import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { of, throwError } from 'rxjs';

import { OrderController } from './order.controller';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';

describe('OrderController', () => {
  let controller: OrderController;

  const mockOrderService = {
    createOrder: jest.fn(),
    getOrder: jest.fn(),
    getOrdersByUser: jest.fn(),
    updateOrderStatus: jest.fn(),
    getOrdersByRestaurant: jest.fn(),
    cancelOrder: jest.fn(),
    rateOrder: jest.fn(),
  };

  const mockClientGrpc = {
    getService: jest.fn().mockReturnValue(mockOrderService),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: 'ORDER_SERVICE',
          useValue: mockClientGrpc,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<OrderController>(OrderController);
    controller.onModuleInit();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('debe inicializar orderService desde ClientGrpc', () => {
      expect(mockClientGrpc.getService).toHaveBeenCalledWith('OrderService');
    });
  });

  describe('createOrder', () => {
    it('debe crear una orden con userId y status PENDIENTE', async () => {
      const req = {
        user: {
          userId: 25,
          role: 'Cliente',
        },
      };

      const body = {
        restaurantId: 10,
        items: [{ menuItemId: 1, quantity: 2, price: 20 }],
      };

      const response = {
        id: 1,
        userId: 25,
        restaurantId: 10,
        status: 'PENDIENTE',
      };

      mockOrderService.createOrder.mockReturnValue(of(response));

      const result = await controller.createOrder(req, body);

      expect(mockOrderService.createOrder).toHaveBeenCalledWith({
        ...body,
        userId: 25,
        status: 'PENDIENTE',
      });
      expect(result).toEqual(response);
    });

    it('debe lanzar INTERNAL_SERVER_ERROR si falla el microservicio', async () => {
      const req = {
        user: {
          userId: 25,
          role: 'Cliente',
        },
      };

      const body = {
        restaurantId: 10,
        items: [],
      };

      mockOrderService.createOrder.mockReturnValue(
        throwError(() => new Error('grpc fail')),
      );

      await expect(controller.createOrder(req, body)).rejects.toThrow(
        new HttpException(
          'Error al conectar con el microservicio de órdenes',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('getMyOrders', () => {
    it('debe pedir órdenes por userId', async () => {
      const req = {
        user: {
          userId: 99,
          role: 'Cliente',
        },
      };

      const response = of({
        orders: [{ id: 1 }, { id: 2 }],
      });

      mockOrderService.getOrdersByUser.mockReturnValue(response);

      const result = await controller.getMyOrders(req);

      expect(mockOrderService.getOrdersByUser).toHaveBeenCalledWith({
        userId: 99,
      });
      expect(result).toBe(response);
    });
  });

  describe('updateStatus', () => {
    it('debe actualizar estado con id numérico', async () => {
      const body = { status: 'PREPARANDO' };
      const response = { id: 7, status: 'PREPARANDO' };

      mockOrderService.updateOrderStatus.mockReturnValue(response);

      const result = await controller.updateStatus('7', body);

      expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith({
        id: 7,
        status: 'PREPARANDO',
      });
      expect(result).toEqual(response);
    });
  });

  describe('getByRestaurant', () => {
    it('debe retornar response.orders cuando existe', async () => {
      const orders = [{ id: 1 }, { id: 2 }];

      mockOrderService.getOrdersByRestaurant.mockReturnValue(of({ orders }));

      const result = await controller.getByRestaurant('15');

      expect(mockOrderService.getOrdersByRestaurant).toHaveBeenCalledWith({
        restaurantId: 15,
      });
      expect(result).toEqual(orders);
    });

    it('debe retornar [] si response.orders no existe', async () => {
      mockOrderService.getOrdersByRestaurant.mockReturnValue(of({}));

      const result = await controller.getByRestaurant('15');

      expect(result).toEqual([]);
    });

    it('debe lanzar INTERNAL_SERVER_ERROR si falla el microservicio', async () => {
      mockOrderService.getOrdersByRestaurant.mockReturnValue(
        throwError(() => new Error('grpc fail')),
      );

      await expect(controller.getByRestaurant('15')).rejects.toThrow(
        new HttpException(
          'No se pudieron recuperar las órdenes del microservicio',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('cancel', () => {
    it('debe cancelar una orden por id', async () => {
      const response = {
        id: 20,
        status: 'Cancelada',
      };

      mockOrderService.cancelOrder.mockReturnValue(of(response));

      const result = await controller.cancel('20');

      expect(mockOrderService.cancelOrder).toHaveBeenCalledWith({ id: 20 });
      expect(result).toEqual(response);
    });

    it('debe lanzar BAD_REQUEST si falla la cancelación', async () => {
      mockOrderService.cancelOrder.mockReturnValue(
        throwError(() => new Error('cancel error')),
      );

      await expect(controller.cancel('20')).rejects.toThrow(
        new HttpException('Error al cancelar la orden', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('rateOrder', () => {
    it('debe enviar el payload completo al microservicio', async () => {
      const body = {
        rating: 5,
        comment: 'Muy bien',
        deliveryRating: 4,
        deliveryComment: 'Rápido',
        items: [
          { menuItemId: 1, isRecommended: true },
          { menuItemId: 2, isRecommended: false },
        ],
      };

      const response = of({
        success: true,
      });

      mockOrderService.rateOrder.mockReturnValue(response);

      const result = await controller.rateOrder('30', body);

      expect(mockOrderService.rateOrder).toHaveBeenCalledWith({
        id: 30,
        rating: 5,
        comment: 'Muy bien',
        deliveryRating: 4,
        deliveryComment: 'Rápido',
        items: [
          { menuItemId: 1, isRecommended: true },
          { menuItemId: 2, isRecommended: false },
        ],
      });
      expect(result).toBe(response);
    });

    it('debe enviar undefined en campos opcionales faltantes', async () => {
      const body = {
        rating: 5,
        deliveryRating: 4,
      };

      const response = of({ success: true });

      mockOrderService.rateOrder.mockReturnValue(response);

      const result = await controller.rateOrder('31', body);

      expect(mockOrderService.rateOrder).toHaveBeenCalledWith({
        id: 31,
        rating: 5,
        comment: undefined,
        deliveryRating: 4,
        deliveryComment: undefined,
        items: undefined,
      });
      expect(result).toBe(response);
    });
  });
});
