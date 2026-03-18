import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { of, throwError } from 'rxjs';

import { RestaurantController } from './restaurant.controller';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';

describe('RestaurantController', () => {
  let controller: RestaurantController;

  const mockRestaurantService = {
    createRestaurant: jest.fn(),
    getRestaurants: jest.fn(),
    getRestaurant: jest.fn(),
    updateRestaurant: jest.fn(),
    deleteRestaurant: jest.fn(),
    createMenuItem: jest.fn(),
    getMenu: jest.fn(),
    updateMenuItem: jest.fn(),
    deleteMenuItem: jest.fn(),
  };

  const mockClientGrpc = {
    getService: jest.fn().mockReturnValue(mockRestaurantService),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RestaurantController],
      providers: [
        {
          provide: 'RESTAURANT_SERVICE',
          useValue: mockClientGrpc,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<RestaurantController>(RestaurantController);
    controller.onModuleInit();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('debe inicializar restaurantService desde ClientGrpc', () => {
      expect(mockClientGrpc.getService).toHaveBeenCalledWith(
        'RestaurantService',
      );
    });
  });

  describe('getAll', () => {
    it('debe retornar getRestaurants con payload vacío', async () => {
      const response = of({
        restaurants: [{ id: 1 }, { id: 2 }],
      });

      mockRestaurantService.getRestaurants.mockReturnValue(response);

      const result = await controller.getAll();

      expect(mockRestaurantService.getRestaurants).toHaveBeenCalledWith({});
      expect(result).toBe(response);
    });
  });

  describe('getOne', () => {
    it('debe retornar un restaurante por id', async () => {
      const response = {
        id: 5,
        name: 'Pizza Place',
      };

      mockRestaurantService.getRestaurant.mockReturnValue(of(response));

      const result = await controller.getOne('5');

      expect(mockRestaurantService.getRestaurant).toHaveBeenCalledWith({
        id: 5,
      });
      expect(result).toEqual(response);
    });

    it('debe lanzar NOT_FOUND si falla getRestaurant', async () => {
      mockRestaurantService.getRestaurant.mockReturnValue(
        throwError(() => new Error('not found')),
      );

      await expect(controller.getOne('999')).rejects.toThrow(
        new HttpException('Restaurante no encontrado', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('getMenu', () => {
    it('debe retornar el menú del restaurante', async () => {
      const response = of({
        items: [{ id: 1 }, { id: 2 }],
      });

      mockRestaurantService.getMenu.mockReturnValue(response);

      const result = await controller.getMenu('12');

      expect(mockRestaurantService.getMenu).toHaveBeenCalledWith({
        restaurantId: 12,
      });
      expect(result).toBe(response);
    });
  });

  describe('createRestaurant', () => {
    it('debe crear un restaurante', async () => {
      const body = {
        name: 'Burger House',
        address: 'Zona 10',
      };

      const response = of({
        id: 1,
        ...body,
      });

      mockRestaurantService.createRestaurant.mockReturnValue(response);

      const result = await controller.createRestaurant(body);

      expect(mockRestaurantService.createRestaurant).toHaveBeenCalledWith(body);
      expect(result).toBe(response);
    });
  });

  describe('updateRestaurant', () => {
    it('debe actualizar restaurante con id numérico', async () => {
      const body = {
        name: 'Burger Premium',
      };

      const response = of({
        id: 10,
        name: 'Burger Premium',
      });

      mockRestaurantService.updateRestaurant.mockReturnValue(response);

      const result = await controller.updateRestaurant('10', body);

      expect(mockRestaurantService.updateRestaurant).toHaveBeenCalledWith({
        ...body,
        id: 10,
      });
      expect(result).toBe(response);
    });
  });

  describe('deleteRestaurant', () => {
    it('debe eliminar restaurante con id numérico', async () => {
      const response = of({
        success: true,
      });

      mockRestaurantService.deleteRestaurant.mockReturnValue(response);

      const result = await controller.deleteRestaurant('20');

      expect(mockRestaurantService.deleteRestaurant).toHaveBeenCalledWith({
        id: 20,
      });
      expect(result).toBe(response);
    });
  });

  describe('createDish', () => {
    it('debe crear plato con restaurantId numérico', async () => {
      const body = {
        name: 'Pizza Pepperoni',
        price: 85,
      };

      const response = of({
        id: 1,
        ...body,
        restaurantId: 7,
      });

      mockRestaurantService.createMenuItem.mockReturnValue(response);

      const result = await controller.createDish('7', body);

      expect(mockRestaurantService.createMenuItem).toHaveBeenCalledWith({
        ...body,
        restaurantId: 7,
      });
      expect(result).toBe(response);
    });
  });

  describe('updateDish', () => {
    it('debe actualizar plato con itemId numérico', async () => {
      const body = {
        name: 'Pizza 4 Quesos',
        price: 95,
      };

      const response = of({
        id: 30,
        ...body,
      });

      mockRestaurantService.updateMenuItem.mockReturnValue(response);

      const result = await controller.updateDish('30', body);

      expect(mockRestaurantService.updateMenuItem).toHaveBeenCalledWith({
        ...body,
        id: 30,
      });
      expect(result).toBe(response);
    });
  });

  describe('deleteDish', () => {
    it('debe eliminar plato con itemId numérico', async () => {
      const response = of({
        success: true,
      });

      mockRestaurantService.deleteMenuItem.mockReturnValue(response);

      const result = await controller.deleteDish('40');

      expect(mockRestaurantService.deleteMenuItem).toHaveBeenCalledWith({
        id: 40,
      });
      expect(result).toBe(response);
    });
  });
});
