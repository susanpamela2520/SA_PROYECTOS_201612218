import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { MenuItem } from './entities/menu-item.entity';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private restaurantRepo: Repository<Restaurant>,
    @InjectRepository(MenuItem)
    private menuItemRepo: Repository<MenuItem>,
  ) {}

  // --- CRUD RESTAURANTE ---

  async createRestaurant(data: any): Promise<Restaurant> {
    const newRestaurant = this.restaurantRepo.create(data);
    // CORRECCIÓN 1: Forzamos el tipo 'as Restaurant' para evitar el error de Array
    return (await this.restaurantRepo.save(
      newRestaurant,
    )) as unknown as Restaurant;
  }

  async getRestaurants(): Promise<{ restaurants: Restaurant[] }> {
    const restaurants = await this.restaurantRepo.find();
    return { restaurants };
  }

  async getRestaurant(id: number): Promise<Restaurant> {
    const restaurant = await this.restaurantRepo.findOne({ where: { id } });
    if (!restaurant) throw new NotFoundException('Restaurante no encontrado');
    return restaurant;
  }

  async updateRestaurant(data: any): Promise<Restaurant> {
    const { id, ...updateData } = data;
    await this.restaurantRepo.update(id, updateData);
    return this.getRestaurant(id);
  }

  async deleteRestaurant(id: number): Promise<any> {
    const result = await this.restaurantRepo.delete(id);
    // CORRECCIÓN 2: Usamos ( || 0) para manejar si 'affected' es null
    return {
      success: (result.affected || 0) > 0,
      message:
        (result.affected || 0) > 0
          ? 'Restaurante eliminado'
          : 'Restaurante no encontrado',
    };
  }

  // --- CRUD MENÚ ---

  async createMenuItem(data: any): Promise<MenuItem> {
    const restaurant = await this.restaurantRepo.findOne({
      where: { id: data.restaurantId },
    });
    if (!restaurant) throw new NotFoundException('El restaurante no existe');

    const newItem = this.menuItemRepo.create({ ...data, restaurant });
    // CORRECCIÓN 3: Forzamos el tipo 'as MenuItem'
    return (await this.menuItemRepo.save(newItem)) as unknown as MenuItem;
  }

  async getMenu(restaurantId: number): Promise<{ items: MenuItem[] }> {
    const items = await this.menuItemRepo.find({ where: { restaurantId } });
    return { items };
  }

  async updateMenuItem(data: any): Promise<MenuItem> {
    const { id, ...updateData } = data;
    await this.menuItemRepo.update(id, updateData);

    // CORRECCIÓN 4: Manejamos el caso null de findOne
    const item = await this.menuItemRepo.findOne({ where: { id } });

    if (!item) {
      throw new NotFoundException('Plato no encontrado tras actualizar');
    }

    return item;
  }

  async deleteMenuItem(id: number): Promise<any> {
    const result = await this.menuItemRepo.delete(id);
    // CORRECCIÓN 5: Usamos ( || 0) nuevamente
    return {
      success: (result.affected || 0) > 0,
      message:
        (result.affected || 0) > 0 ? 'Plato eliminado' : 'Plato no encontrado',
    };
  }
}
