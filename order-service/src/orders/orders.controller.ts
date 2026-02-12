import { Controller, Post, Get, Body } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('api/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(@Body() body: any) {
    try {
      return await this.ordersService.createOrder(body);
    } catch (error) {
      console.error('❌ Error al crear orden:', error);
      return {
        ok: false,
        message: error.message || 'Error al crear orden',
        errors: error.response?.errors || [error.message],
      };
    }
  }

  @Get()
  async getOrders() {
    return await this.ordersService.getOrders();
  }
}