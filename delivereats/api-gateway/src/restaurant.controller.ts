import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Inject,
  OnModuleInit,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { lastValueFrom } from 'rxjs';

// Interfaz que coincide con tu .proto y el servicio
interface RestaurantServiceClient {
  // Restaurantes
  createRestaurant(data: any): any;
  getRestaurants(data: any): any;
  getRestaurant(data: any): any;
  updateRestaurant(data: any): any;
  deleteRestaurant(data: any): any;

  // Menús
  createMenuItem(data: any): any;
  getMenu(data: any): any;
  updateMenuItem(data: any): any;
  deleteMenuItem(data: any): any;
}

@Controller('restaurants')
export class RestaurantController implements OnModuleInit {
  private restaurantService: RestaurantServiceClient;

  constructor(@Inject('RESTAURANT_SERVICE') private client: ClientGrpc) {}

  onModuleInit() {
    this.restaurantService =
      this.client.getService<RestaurantServiceClient>('RestaurantService');
  }

  // ==========================================
  // 👁️ READ (LEER) - PÚBLICOS
  // ==========================================

  // 1. Obtener todos los Restaurantes
  @Get()
  async getAll() {
    return this.restaurantService.getRestaurants({});
  }

  // 2. Obtener un Restaurante por ID
  @Get(':id')
  async getOne(@Param('id') id: string) {
    try {
      return await lastValueFrom(
        this.restaurantService.getRestaurant({ id: Number(id) }),
      );
    } catch (e) {
      throw new HttpException(
        'Restaurante no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  // 3. Obtener el menú de un Restaurante específico
  @Get(':id/menu')
  async getMenu(@Param('id') id: string) {
    return this.restaurantService.getMenu({ restaurantId: Number(id) });
  }

  // ==========================================
  // 🛠️ CRUD RestauranteS (SOLO ADMIN)
  // ==========================================

  // 4. Crear Restaurante
  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Administrador')
  async createRestaurant(@Body() body: any) {
    return this.restaurantService.createRestaurant(body);
  }

  // 5. Actualizar Restaurante
  @Put(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Administrador')
  async updateRestaurant(@Param('id') id: string, @Body() body: any) {
    return this.restaurantService.updateRestaurant({ ...body, id: Number(id) });
  }

  // 6. Eliminar Restaurante
  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Administrador')
  async deleteRestaurant(@Param('id') id: string) {
    return this.restaurantService.deleteRestaurant({ id: Number(id) });
  }

  // ==========================================
  // 🍽️ CRUD MENÚ (SOLO ROL Restaurante)
  // ==========================================

  // 7. Crear Plato en el Menú
  @Post(':id/menu')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Restaurante', 'Vendedor')
  async createDish(@Param('id') id: string, @Body() body: any) {
    return this.restaurantService.createMenuItem({
      ...body,
      restaurantId: Number(id),
    });
  }

  // 8. Actualizar Plato (Usando el ID del plato)
  @Put('menu/:itemId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Restaurante', 'Vendedor')
  async updateDish(@Param('itemId') itemId: string, @Body() body: any) {
    return this.restaurantService.updateMenuItem({
      ...body,
      id: Number(itemId),
    });
  }

  // 9. Eliminar Plato (Usando el ID del plato)
  @Delete('menu/:itemId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Restaurante', 'Vendedor')
  async deleteDish(@Param('itemId') itemId: string) {
    return this.restaurantService.deleteMenuItem({ id: Number(itemId) });
  }
}
