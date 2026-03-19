import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

import { RestaurantService } from './restaurant.service';
import { Restaurant } from './entities/restaurant.entity';
import { MenuItem } from './entities/menu-item.entity';

describe('RestaurantService', () => {
  let service: RestaurantService;

  const mockRestaurantRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockMenuItemRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantService,
        {
          provide: getRepositoryToken(Restaurant),
          useValue: mockRestaurantRepo,
        },
        {
          provide: getRepositoryToken(MenuItem),
          useValue: mockMenuItemRepo,
        },
      ],
    }).compile();

    service = module.get<RestaurantService>(RestaurantService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRestaurant', () => {
    it('debe crear y guardar un restaurante', async () => {
      const dto = {
        name: 'Pizza Place',
        address: 'Zona 1',
        category: 'Pizza',
        horario: '8:00-22:00',
        calificacion: 'Buena',
      };

      const createdRestaurant = { ...dto };
      const savedRestaurant = { id: 1, ...dto, ratingCount: 0, rating: 0 };

      mockRestaurantRepo.create.mockReturnValue(createdRestaurant);
      mockRestaurantRepo.save.mockResolvedValue(savedRestaurant);

      const result = await service.createRestaurant(dto);

      expect(mockRestaurantRepo.create).toHaveBeenCalledWith(dto);
      expect(mockRestaurantRepo.save).toHaveBeenCalledWith(createdRestaurant);
      expect(result).toEqual(savedRestaurant);
    });
  });

  describe('getRestaurants', () => {
    it('debe retornar todos los restaurantes', async () => {
      const restaurants = [
        { id: 1, name: 'Pizza Place' },
        { id: 2, name: 'Burger House' },
      ];

      mockRestaurantRepo.find.mockResolvedValue(restaurants);

      const result = await service.getRestaurants();

      expect(mockRestaurantRepo.find).toHaveBeenCalled();
      expect(result).toEqual({ restaurants });
    });
  });

  describe('getRestaurant', () => {
    it('debe retornar un restaurante por id', async () => {
      const restaurant = { id: 1, name: 'Pizza Place' };

      mockRestaurantRepo.findOne.mockResolvedValue(restaurant);

      const result = await service.getRestaurant(1);

      expect(mockRestaurantRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(restaurant);
    });

    it('debe lanzar NotFoundException si no existe el restaurante', async () => {
      mockRestaurantRepo.findOne.mockResolvedValue(null);

      await expect(service.getRestaurant(999)).rejects.toThrow(
        new NotFoundException('Restaurante no encontrado'),
      );
    });
  });

  describe('updateRestaurant', () => {
    it('debe actualizar un restaurante y retornarlo', async () => {
      const dto = {
        id: 1,
        name: 'Pizza Premium',
        address: 'Zona 10',
      };

      const updatedRestaurant = {
        id: 1,
        name: 'Pizza Premium',
        address: 'Zona 10',
        category: 'Pizza',
      };

      mockRestaurantRepo.update.mockResolvedValue({ affected: 1 });
      mockRestaurantRepo.findOne.mockResolvedValue(updatedRestaurant);

      const result = await service.updateRestaurant(dto);

      expect(mockRestaurantRepo.update).toHaveBeenCalledWith(1, {
        name: 'Pizza Premium',
        address: 'Zona 10',
      });
      expect(mockRestaurantRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(updatedRestaurant);
    });
  });

  describe('deleteRestaurant', () => {
    it('debe eliminar un restaurante si existe', async () => {
      mockRestaurantRepo.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteRestaurant(1);

      expect(mockRestaurantRepo.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        success: true,
        message: 'Restaurante eliminado',
      });
    });

    it('debe retornar no encontrado si no existe', async () => {
      mockRestaurantRepo.delete.mockResolvedValue({ affected: 0 });

      const result = await service.deleteRestaurant(999);

      expect(result).toEqual({
        success: false,
        message: 'Restaurante no encontrado',
      });
    });

    it('debe manejar affected null', async () => {
      mockRestaurantRepo.delete.mockResolvedValue({ affected: null });

      const result = await service.deleteRestaurant(999);

      expect(result).toEqual({
        success: false,
        message: 'Restaurante no encontrado',
      });
    });
  });

  describe('createMenuItem', () => {
    it('debe crear un item de menú si el restaurante existe', async () => {
      const dto = {
        name: 'Pizza Pepperoni',
        description: 'Grande',
        price: 85,
        restaurantId: 1,
      };

      const restaurant = { id: 1, name: 'Pizza Place' };
      const createdItem = { ...dto, restaurant };
      const savedItem = { id: 10, ...dto, restaurant };

      mockRestaurantRepo.findOne.mockResolvedValue(restaurant);
      mockMenuItemRepo.create.mockReturnValue(createdItem);
      mockMenuItemRepo.save.mockResolvedValue(savedItem);

      const result = await service.createMenuItem(dto);

      expect(mockRestaurantRepo.findOne).toHaveBeenCalledWith({
        where: { id: dto.restaurantId },
      });
      expect(mockMenuItemRepo.create).toHaveBeenCalledWith({
        ...dto,
        restaurant,
      });
      expect(mockMenuItemRepo.save).toHaveBeenCalledWith(createdItem);
      expect(result).toEqual(savedItem);
    });

    it('debe lanzar NotFoundException si el restaurante no existe', async () => {
      mockRestaurantRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createMenuItem({
          name: 'Pizza',
          description: 'Grande',
          price: 50,
          restaurantId: 999,
        }),
      ).rejects.toThrow(new NotFoundException('El restaurante no existe'));

      expect(mockMenuItemRepo.create).not.toHaveBeenCalled();
      expect(mockMenuItemRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('getMenu', () => {
    it('debe retornar los items del menú de un restaurante', async () => {
      const items = [
        { id: 1, name: 'Pizza', restaurantId: 1 },
        { id: 2, name: 'Lasagna', restaurantId: 1 },
      ];

      mockMenuItemRepo.find.mockResolvedValue(items);

      const result = await service.getMenu(1);

      expect(mockMenuItemRepo.find).toHaveBeenCalledWith({
        where: { restaurantId: 1 },
      });
      expect(result).toEqual({ items });
    });
  });

  describe('updateMenuItem', () => {
    it('debe actualizar un item y retornarlo', async () => {
      const dto = {
        id: 1,
        name: 'Pizza 4 Quesos',
        price: 95,
      };

      const updatedItem = {
        id: 1,
        name: 'Pizza 4 Quesos',
        description: 'Grande',
        price: 95,
        restaurantId: 1,
      };

      mockMenuItemRepo.update.mockResolvedValue({ affected: 1 });
      mockMenuItemRepo.findOne.mockResolvedValue(updatedItem);

      const result = await service.updateMenuItem(dto);

      expect(mockMenuItemRepo.update).toHaveBeenCalledWith(1, {
        name: 'Pizza 4 Quesos',
        price: 95,
      });
      expect(mockMenuItemRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(updatedItem);
    });

    it('debe lanzar NotFoundException si el item no existe tras actualizar', async () => {
      mockMenuItemRepo.update.mockResolvedValue({ affected: 0 });
      mockMenuItemRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateMenuItem({
          id: 999,
          name: 'Inexistente',
        }),
      ).rejects.toThrow(
        new NotFoundException('Plato no encontrado tras actualizar'),
      );
    });
  });

  describe('deleteMenuItem', () => {
    it('debe eliminar un item si existe', async () => {
      mockMenuItemRepo.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteMenuItem(1);

      expect(mockMenuItemRepo.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        success: true,
        message: 'Plato eliminado',
      });
    });

    it('debe retornar no encontrado si el item no existe', async () => {
      mockMenuItemRepo.delete.mockResolvedValue({ affected: 0 });

      const result = await service.deleteMenuItem(999);

      expect(result).toEqual({
        success: false,
        message: 'Plato no encontrado',
      });
    });

    it('debe manejar affected null', async () => {
      mockMenuItemRepo.delete.mockResolvedValue({ affected: null });

      const result = await service.deleteMenuItem(999);

      expect(result).toEqual({
        success: false,
        message: 'Plato no encontrado',
      });
    });
  });

  describe('updateRestaurantRating', () => {
    it('debe actualizar correctamente el promedio y ratingCount', async () => {
      const restaurant = {
        id: 1,
        name: 'Pizza Place',
        rating: 4,
        ratingCount: 2,
      };

      mockRestaurantRepo.findOne.mockResolvedValue(restaurant);
      mockRestaurantRepo.save.mockResolvedValue({
        ...restaurant,
        ratingCount: 3,
        rating: 4.33,
      });

      await service.updateRestaurantRating({
        restaurantId: 1,
        rating: 5,
      });

      expect(mockRestaurantRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(mockRestaurantRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          ratingCount: 3,
          rating: 13 / 3,
        }),
      );
    });

    it('no debe guardar si el restaurante no existe', async () => {
      mockRestaurantRepo.findOne.mockResolvedValue(null);

      const result = await service.updateRestaurantRating({
        restaurantId: 999,
        rating: 5,
      });

      expect(mockRestaurantRepo.save).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('debe calcular correctamente el primer rating cuando ratingCount es 0', async () => {
      const restaurant = {
        id: 2,
        name: 'Burger House',
        rating: 0,
        ratingCount: 0,
      };

      mockRestaurantRepo.findOne.mockResolvedValue(restaurant);
      mockRestaurantRepo.save.mockResolvedValue({
        ...restaurant,
        ratingCount: 1,
        rating: 4,
      });

      await service.updateRestaurantRating({
        restaurantId: 2,
        rating: 4,
      });

      expect(mockRestaurantRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 2,
          ratingCount: 1,
          rating: 4,
        }),
      );
    });
  });
});
