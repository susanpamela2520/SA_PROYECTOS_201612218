import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Inject,
  OnModuleInit,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GrpcMethod, type ClientGrpc } from '@nestjs/microservices';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { lastValueFrom, Observable } from 'rxjs';

interface OrderServiceClient {
  createOrder(data: any): any;
  getOrder(data: any): any;
  getOrdersByUser(data: any): any;
  updateOrderStatus(data: any): any;

  getOrdersByRestaurant(data: any): any;

  cancelOrder(data: { id: number }): any;
  rateOrder(data: {
    id: number;
    rating: number;
    comment?: string;
    deliveryRating: number;
    deliveryComment?: string;
    items: { menuItemId: number; isRecommended: boolean }[];
  }): Observable<any>;
}

@Controller('orders')
@UseGuards(AuthGuard, RolesGuard) // Protegemos TODO el controlador de una vez
export class OrderController implements OnModuleInit {
  private orderService: OrderServiceClient;

  constructor(@Inject('ORDER_SERVICE') private client: ClientGrpc) {}

  onModuleInit() {
    this.orderService =
      this.client.getService<OrderServiceClient>('OrderService');
  }

  // 1. CREAR ORDEN (Solo Clientes)
  @Post()
  @Roles('Cliente')
  async createOrder(@Req() req: any, @Body() body: any) {
    const userId = req.user.userId;
    const orderRequest = {
      ...body,
      userId: userId,
      status: 'PENDIENTE',
    };

    try {
      return await lastValueFrom(this.orderService.createOrder(orderRequest));
    } catch (error: any) {
      throw new HttpException(
        'Error al conectar con el microservicio de órdenes',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 2. VER MIS ÓRDENES (Solo Clientes)
  @Get()
  @Roles('Cliente')
  async getMyOrders(@Req() req: any) {
    const userId = req.user.userId;
    return this.orderService.getOrdersByUser({ userId });
  }

  // 3. ACTUALIZAR ESTADO (Solo Restaurantes)
  // Ej: Pasar de PENDING a PREPARING
  @Patch(':id/status')
  @Roles('Restaurante', 'Vendedor')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.orderService.updateOrderStatus({
      id: Number(id),
      status: body.status,
    });
  }

  // 4. VER UNA ORDEN ESPECIFICA (Clientes y Restaurantes)
  @Get('restaurant/:id')
  @Roles('Restaurante', 'Vendedor', 'Repartidor')
  async getByRestaurant(@Param('id') id: string) {
    console.log('Gateway: Consultando órdenes para el restaurante ID:', id);

    try {
      // Tipamos la respuesta como 'any' o creamos una interfaz para 'OrdersList'
      const response = await lastValueFrom<any>(
        this.orderService.getOrdersByRestaurant({ restaurantId: Number(id) }),
      );

      // Ahora TS ya no dirá que es 'unknown'
      return response.orders || [];
    } catch (error) {
      console.error('Error al conectar con Order-Service:', error);
      throw new HttpException(
        'No se pudieron recuperar las órdenes del microservicio',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/cancel')
  @Roles('Cliente', 'Restaurante', 'Vendedor', 'Repartidor') // Ambos pueden cancelar
  async cancel(@Param('id') id: string) {
    try {
      return await lastValueFrom(
        this.orderService.cancelOrder({ id: Number(id) }),
      );
    } catch (error) {
      throw new HttpException(
        'Error al cancelar la orden',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post(':id/rate')
  async rateOrder(
    @Param('id') id: string,
    @Body() body: any, // Recibimos todo el JSON de Angular
  ) {
    // Unimos el ID de la url con el resto de la data del body
    const rateData = {
      id: Number(id),
      rating: body.rating,
      comment: body.comment,
      deliveryRating: body.deliveryRating,
      deliveryComment: body.deliveryComment,
      items: body.items,
    };

    return this.orderService.rateOrder(rateData);
  }
}
