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
import type { ClientGrpc } from '@nestjs/microservices';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { lastValueFrom } from 'rxjs';

interface OrderServiceClient {
  createOrder(data: any): any;
  getOrder(data: any): any;
  getOrdersByUser(data: any): any;
  updateOrderStatus(data: any): any;
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
    // TRUCO DE SEGURIDAD:
    // No dejamos que el usuario envíe su userId en el body.
    // Lo sacamos del token (req.user) para asegurar que quien pide es quien dice ser.
    const userId = req.user.userId;

    return this.orderService.createOrder({
      ...body,
      userId: userId,
    });
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
  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.orderService.getOrder({ id: Number(id) });
  }
}
