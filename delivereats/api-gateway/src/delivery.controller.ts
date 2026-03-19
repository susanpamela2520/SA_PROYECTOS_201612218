import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Inject,
  OnModuleInit,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GrpcMethod, type ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

// Definimos la interfaz aquí para que TS no se queje
interface DeliveryServiceClient {
  acceptOrder(data: { orderId: number; driverId: number }): any;
  updateDeliveryStatus(data: {
    deliveryId: number;
    status: string;
    proofOfDelivery?: string;
  }): any;
  getDeliveriesByDriver(data: { driverId: number }): any;
  healthCheck(data: {}): any;
}

@Controller('delivery')
@UseGuards(AuthGuard, RolesGuard)
export class DeliveryController implements OnModuleInit {
  private deliveryService: DeliveryServiceClient;

  constructor(@Inject('DELIVERY_SERVICE') private client: ClientGrpc) {}

  onModuleInit() {
    // Conectamos con el servicio definido en el .proto
    this.deliveryService =
      this.client.getService<DeliveryServiceClient>('DeliveryService');
  }

  // 1. ACEPTAR UN PEDIDO (El repartidor toma la orden)
  // Ruta: PATCH /delivery/accept/15 (donde 15 es el orderId)
  @Patch('accept/:orderId')
  @Roles('Repartidor', 'REPARTIDOR')
  async acceptOrder(@Param('orderId') orderId: string, @Req() req: any) {
    console.log('User en request:');
    try {
      const driverId = req.user.userId; // Sacamos el ID del token JWT
      console.log(`Repartidor ${driverId} aceptando orden ${orderId}`);

      return await lastValueFrom(
        this.deliveryService.acceptOrder({
          orderId: Number(orderId),
          driverId: driverId,
        }),
      );
    } catch (error) {
      throw new HttpException(
        'No se pudo aceptar el pedido. Verifica que no haya sido tomado ya.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 2. ACTUALIZAR ESTADO (Para marcar ENTREGADO o CANCELADO)
  // Ruta: PATCH /delivery/5/status (donde 5 es el deliveryId, no el orderId)
  // Body: { "status": "ENTREGADO" }
  @Patch(':id/status')
  @Roles('Repartidor', 'REPARTIDOR')
  async updateStatus(
    @Param('id') deliveryId: string,
    @Body() body: { status: string; proofOfDelivery?: string }, // <--- Recibimos la URL aquí
  ) {
    console.log(
      `Repartidor finalizando entrega ${deliveryId}. Foto: ${body.proofOfDelivery ? 'SÍ' : 'NO'}`,
    );

    return this.deliveryService.updateDeliveryStatus({
      deliveryId: Number(deliveryId),
      status: body.status,
      proofOfDelivery: body.proofOfDelivery, // <--- La pasamos al microservicio
    });
  }

  // 3. VER MIS ENTREGAS (Historial del repartidor)
  // Ruta: GET /delivery/my-history
  @Get('my-history')
  @Roles('Repartidor', 'REPARTIDOR')
  async getMyDeliveries(@Req() req: any) {
    const driverId = req.user.userId;
    try {
      const response = await lastValueFrom<GetDeliveriesResponse>(
        this.deliveryService.getDeliveriesByDriver({ driverId }),
      );
      // gRPC devuelve objeto { deliveries: [] }, retornamos directo el array
      return response.deliveries || [];
    } catch (error) {
      return [];
    }
  }

  @Get('test')
  @Roles('Repartidor', 'REPARTIDOR')
  async testConnection(@Req() req: Request) {
    console.log('Gateway recibido. Intentando conectar con Microservicio...');
    console.log('Usuario autenticado:', req);
    try {
      return await lastValueFrom(this.deliveryService.healthCheck({}));
    } catch (error) {
      console.error('Error conectando gRPC:', error);
      return {
        message: 'El Gateway funciona, pero el Microservicio NO responde.',
        error: error,
      };
    }
  }
}

interface GetDeliveriesResponse {
  deliveries: any[]; // Cambia 'any' por el tipo de objeto de entrega si lo tienes
}
