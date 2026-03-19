import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RestaurantService } from './restaurant.service';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  // --- RESTAURANTES ---
  @GrpcMethod('RestaurantService', 'CreateRestaurant')
  createRestaurant(data: any) {
    return this.restaurantService.createRestaurant(data);
  }

  @GrpcMethod('RestaurantService', 'GetRestaurants')
  getRestaurants() {
    return this.restaurantService.getRestaurants();
  }

  @GrpcMethod('RestaurantService', 'GetRestaurant')
  getRestaurant(data: { id: number }) {
    return this.restaurantService.getRestaurant(data.id);
  }

  @GrpcMethod('RestaurantService', 'UpdateRestaurant')
  updateRestaurant(data: any) {
    return this.restaurantService.updateRestaurant(data);
  }

  @GrpcMethod('RestaurantService', 'DeleteRestaurant')
  deleteRestaurant(data: { id: number }) {
    return this.restaurantService.deleteRestaurant(data.id);
  }

  // --- MENÚ ---
  @GrpcMethod('RestaurantService', 'CreateMenuItem')
  createMenuItem(data: any) {
    return this.restaurantService.createMenuItem(data);
  }

  @GrpcMethod('RestaurantService', 'GetMenu')
  getMenu(data: { restaurantId: number }) {
    return this.restaurantService.getMenu(data.restaurantId);
  }

  @GrpcMethod('RestaurantService', 'UpdateMenuItem')
  updateMenuItem(data: any) {
    return this.restaurantService.updateMenuItem(data);
  }

  @GrpcMethod('RestaurantService', 'DeleteMenuItem')
  deleteMenuItem(data: { id: number }) {
    return this.restaurantService.deleteMenuItem(data.id);
  }

  @EventPattern('new_order_placed')
  async handleNewOrder(@Payload() data: any) {
    console.log('NUEVO PEDIDO RECIBIDO EN COCINA:', data);
    setTimeout(() => {
      console.log(`Orden ${data.orderId} aceptada y en preparación.`);
    }, 2000);
  }

  @EventPattern('order_rated')
  async handleOrderRated(@Payload() data: any) {
    console.log(`\n📥 [RabbitMQ] Evento recibido: 'order_rated'`);
    console.log(
      `El restaurante ${data.restaurantId} recibió ${data.rating} estrellas por la orden #${data.orderId}`,
    );

    // Llamamos al servicio para actualizar la BD
    await this.restaurantService.updateRestaurantRating(data);
  }
}
