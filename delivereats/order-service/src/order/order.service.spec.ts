import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

import { OrderService } from './order.service';
import { Order } from './entities/order.entity';
import { ClientProxy } from '@nestjs/microservices';

describe('OrderService', () => {
  let service: OrderService;

  const mockOrderRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockRestaurantQueue = {
    emit: jest.fn(),
  };

  const mockDeliveryQueue = {
    emit: jest.fn(),
  };

  const mockPaymentQueue = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepo,
        },
        {
          provide: 'RESTAURANT_QUEUE',
          useValue: mockRestaurantQueue,
        },
        {
          provide: 'DELIVERY_QUEUE',
          useValue: mockDeliveryQueue,
        },
        {
          provide: 'PAYMENT_QUEUE',
          useValue: mockPaymentQueue,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrder', () => {
    it('debe crear una orden, calcular el total y emitir evento', async () => {
      const data = {
        userId: 1,
        restaurantId: 10,
        restaurantName: 'Pizza Place',
        items: [
          { menuItemId: 100, quantity: 2, price: 25 },
          { menuItemId: 101, quantity: 1, price: 30 },
        ],
      };

      const createdOrder = {
        userId: 1,
        restaurantId: 10,
        restaurantName: 'Pizza Place',
        total: 80,
        status: 'Pendiente',
        items: [
          { menuItemId: 100, quantity: 2, price: 25 },
          { menuItemId: 101, quantity: 1, price: 30 },
        ],
      };

      const savedOrder = {
        id: 99,
        ...createdOrder,
        createdAt: new Date('2026-03-17T10:00:00Z'),
      };

      mockOrderRepo.create.mockReturnValue(createdOrder);
      mockOrderRepo.save.mockResolvedValue(savedOrder);

      const result = await service.createOrder(data);

      expect(mockOrderRepo.create).toHaveBeenCalledWith({
        userId: 1,
        restaurantId: 10,
        restaurantName: 'Pizza Place',
        total: 80,
        status: 'Pendiente',
        items: [
          { menuItemId: 100, quantity: 2, price: 25 },
          { menuItemId: 101, quantity: 1, price: 30 },
        ],
      });

      expect(mockOrderRepo.save).toHaveBeenCalledWith(createdOrder);

      expect(mockRestaurantQueue.emit).toHaveBeenCalledWith(
        'new_order_placed',
        {
          orderId: savedOrder.id,
          restaurantId: savedOrder.restaurantId,
          userId: savedOrder.userId,
          items: savedOrder.items,
          total: savedOrder.total,
          timestamp: savedOrder.createdAt,
        },
      );

      expect(result).toEqual(savedOrder);
    });

    it('debe calcular total 0 si no hay items', async () => {
      const data = {
        userId: 1,
        restaurantId: 10,
        restaurantName: 'Pizza Place',
        items: [],
      };

      const createdOrder = {
        userId: 1,
        restaurantId: 10,
        restaurantName: 'Pizza Place',
        total: 0,
        status: 'Pendiente',
        items: [],
      };

      const savedOrder = {
        id: 1,
        ...createdOrder,
        createdAt: new Date(),
      };

      mockOrderRepo.create.mockReturnValue(createdOrder);
      mockOrderRepo.save.mockResolvedValue(savedOrder);

      const result = await service.createOrder(data);

      expect(mockOrderRepo.create).toHaveBeenCalledWith({
        userId: 1,
        restaurantId: 10,
        restaurantName: 'Pizza Place',
        total: 0,
        status: 'Pendiente',
        items: [],
      });

      expect(result.total).toBe(0);
      expect(mockRestaurantQueue.emit).toHaveBeenCalled();
    });
  });

  describe('getOrder', () => {
    it('debe retornar una orden con items', async () => {
      const order = {
        id: 1,
        userId: 1,
        restaurantId: 10,
        items: [{ id: 1, menuItemId: 100, quantity: 2, price: 25 }],
      };

      mockOrderRepo.findOne.mockResolvedValue(order);

      const result = await service.getOrder(1);

      expect(mockOrderRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['items'],
      });
      expect(result).toEqual(order);
    });

    it('debe lanzar NotFoundException si no existe la orden', async () => {
      mockOrderRepo.findOne.mockResolvedValue(null);

      await expect(service.getOrder(999)).rejects.toThrow(
        new NotFoundException('Orden no encontrada'),
      );
    });
  });

  describe('getOrdersByUser', () => {
    it('debe retornar órdenes del usuario ordenadas por fecha DESC', async () => {
      const orders = [
        { id: 2, userId: 1, createdAt: new Date(), items: [] },
        { id: 1, userId: 1, createdAt: new Date(), items: [] },
      ];

      mockOrderRepo.find.mockResolvedValue(orders);

      const result = await service.getOrdersByUser(1);

      expect(mockOrderRepo.find).toHaveBeenCalledWith({
        where: { userId: 1 },
        relations: ['items'],
        order: { createdAt: 'DESC' },
      });

      expect(result).toEqual({ orders });
    });
  });

  describe('updateOrderStatus', () => {
    it('debe actualizar solo el status', async () => {
      const order = {
        id: 1,
        status: 'Pendiente',
        proofOfDelivery: null,
      };

      const updatedOrder = {
        ...order,
        status: 'En_camino',
      };

      jest.spyOn(service, 'getOrder').mockResolvedValue(order as any);
      mockOrderRepo.save.mockResolvedValue(updatedOrder);

      const result = await service.updateOrderStatus({
        id: 1,
        status: 'En_camino',
      });

      expect(service.getOrder).toHaveBeenCalledWith(1);
      expect(mockOrderRepo.save).toHaveBeenCalledWith({
        id: 1,
        status: 'En_camino',
        proofOfDelivery: null,
      });
      expect(result).toEqual(updatedOrder);
    });

    it('debe actualizar status y proofOfDelivery', async () => {
      const order = {
        id: 1,
        status: 'En_camino',
        proofOfDelivery: null,
      };

      const updatedOrder = {
        ...order,
        status: 'Entregado',
        proofOfDelivery: 'base64-image',
      };

      jest.spyOn(service, 'getOrder').mockResolvedValue(order as any);
      mockOrderRepo.save.mockResolvedValue(updatedOrder);

      const result = await service.updateOrderStatus({
        id: 1,
        status: 'Entregado',
        proofOfDelivery: 'base64-image',
      });

      expect(mockOrderRepo.save).toHaveBeenCalledWith({
        id: 1,
        status: 'Entregado',
        proofOfDelivery: 'base64-image',
      });
      expect(result).toEqual(updatedOrder);
    });
  });

  describe('getOrdersByRestaurant', () => {
    it('debe retornar órdenes del restaurante', async () => {
      const orders = [
        { id: 1, restaurantId: 10, items: [] },
        { id: 2, restaurantId: 10, items: [] },
      ];

      mockOrderRepo.find.mockResolvedValue(orders);

      const result = await service.getOrdersByRestaurant(10);

      expect(mockOrderRepo.find).toHaveBeenCalledWith({
        where: { restaurantId: 10 },
        relations: ['items'],
        order: { createdAt: 'DESC' },
      });

      expect(result).toEqual({ orders });
    });

    it('debe retornar arreglo vacío si ocurre error en DB', async () => {
      mockOrderRepo.find.mockRejectedValue(new Error('db error'));

      const result = await service.getOrdersByRestaurant(10);

      expect(result).toEqual({ orders: [] });
    });
  });

  describe('cancelOrder', () => {
    it('debe cancelar la orden y emitir eventos de reembolso y delivery', async () => {
      const order = {
        id: 1,
        userId: 5,
        total: 100,
        status: 'Pendiente',
      };

      const savedOrder = {
        ...order,
        status: 'Cancelada',
      };

      mockOrderRepo.findOne.mockResolvedValue(order);
      mockOrderRepo.save.mockResolvedValue(savedOrder);

      const result = await service.cancelOrder(1);

      expect(mockOrderRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(mockOrderRepo.save).toHaveBeenCalledWith({
        id: 1,
        userId: 5,
        total: 100,
        status: 'Cancelada',
      });

      expect(mockPaymentQueue.emit).toHaveBeenCalledWith('order_cancelled', {
        orderId: 1,
        userId: 5,
        amount: 100,
      });

      expect(mockDeliveryQueue.emit).toHaveBeenCalledWith('order_cancelled', {
        orderId: 1,
      });

      expect(result).toEqual(savedOrder);
    });

    it('debe cancelar sin emitir reembolso si total es 0', async () => {
      const order = {
        id: 2,
        userId: 8,
        total: 0,
        status: 'Pendiente',
      };

      const savedOrder = {
        ...order,
        status: 'Cancelada',
      };

      mockOrderRepo.findOne.mockResolvedValue(order);
      mockOrderRepo.save.mockResolvedValue(savedOrder);

      const result = await service.cancelOrder(2);

      expect(mockPaymentQueue.emit).not.toHaveBeenCalled();
      expect(mockDeliveryQueue.emit).not.toHaveBeenCalled();
      expect(result).toEqual(savedOrder);
    });

    it('debe retornar null si la orden no existe', async () => {
      mockOrderRepo.findOne.mockResolvedValue(null);

      const result = await service.cancelOrder(999);

      expect(mockOrderRepo.save).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('debe lanzar error si la orden ya fue entregada', async () => {
      const order = {
        id: 3,
        userId: 2,
        total: 50,
        status: 'Entregado',
      };

      mockOrderRepo.findOne.mockResolvedValue(order);

      await expect(service.cancelOrder(3)).rejects.toThrow(
        'No se puede cancelar una orden que ya está en camino o entregada',
      );

      expect(mockOrderRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('rateOrder', () => {
    it('debe calificar la orden, items y emitir 3 eventos', async () => {
      const order = {
        id: 1,
        restaurantId: 10,
        status: 'Entregado',
        rating: null,
        comment: null,
        deliveryRating: null,
        deliveryComment: null,
        items: [
          {
            id: 1,
            menuItemId: 100,
            quantity: 1,
            price: 20,
            isRecommended: null,
          },
          {
            id: 2,
            menuItemId: 101,
            quantity: 1,
            price: 15,
            isRecommended: null,
          },
        ],
      };

      const data = {
        id: 1,
        rating: 5,
        comment: 'Muy rico',
        deliveryRating: 4,
        deliveryComment: 'Llegó bien',
        items: [
          { menuItemId: 100, isRecommended: true },
          { menuItemId: 101, isRecommended: false },
        ],
      };

      const savedOrder = {
        ...order,
        rating: 5,
        comment: 'Muy rico',
        deliveryRating: 4,
        deliveryComment: 'Llegó bien',
        items: [
          {
            id: 1,
            menuItemId: 100,
            quantity: 1,
            price: 20,
            isRecommended: true,
          },
          {
            id: 2,
            menuItemId: 101,
            quantity: 1,
            price: 15,
            isRecommended: false,
          },
        ],
      };

      mockOrderRepo.findOne.mockResolvedValue(order);
      mockOrderRepo.save.mockResolvedValue(savedOrder);

      const result = await service.rateOrder(data);

      expect(mockOrderRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['items'],
      });

      expect(mockOrderRepo.save).toHaveBeenCalledWith({
        ...order,
        rating: 5,
        comment: 'Muy rico',
        deliveryRating: 4,
        deliveryComment: 'Llegó bien',
        items: [
          {
            id: 1,
            menuItemId: 100,
            quantity: 1,
            price: 20,
            isRecommended: true,
          },
          {
            id: 2,
            menuItemId: 101,
            quantity: 1,
            price: 15,
            isRecommended: false,
          },
        ],
      });

      expect(mockRestaurantQueue.emit).toHaveBeenCalledWith('order_rated', {
        restaurantId: 10,
        orderId: 1,
        rating: 5,
        comment: 'Muy rico',
      });

      expect(mockRestaurantQueue.emit).toHaveBeenCalledWith('items_rated', {
        restaurantId: 10,
        orderId: 1,
        items: data.items,
      });

      expect(mockDeliveryQueue.emit).toHaveBeenCalledWith('delivery_rated', {
        orderId: 1,
        rating: 4,
        comment: 'Llegó bien',
      });

      expect(result).toEqual(savedOrder);
    });

    it('debe permitir status ENTREGADO en mayúsculas', async () => {
      const order = {
        id: 2,
        restaurantId: 11,
        status: 'ENTREGADO',
        rating: null,
        deliveryRating: null,
        items: [],
      };

      const data = {
        id: 2,
        rating: 5,
        comment: 'Excelente',
        deliveryRating: 5,
        deliveryComment: 'Muy rápido',
        items: [],
      };

      const savedOrder = {
        ...order,
        rating: 5,
        comment: 'Excelente',
        deliveryRating: 5,
        deliveryComment: 'Muy rápido',
        items: [],
      };

      mockOrderRepo.findOne.mockResolvedValue(order);
      mockOrderRepo.save.mockResolvedValue(savedOrder);

      const result = await service.rateOrder(data);

      expect(result).toEqual(savedOrder);
    });

    it('debe lanzar NotFoundException si la orden no existe', async () => {
      mockOrderRepo.findOne.mockResolvedValue(null);

      await expect(
        service.rateOrder({
          id: 999,
          rating: 5,
          deliveryRating: 5,
        }),
      ).rejects.toThrow(new NotFoundException('Orden #999 no encontrada'));
    });

    it('debe lanzar error si la orden no ha sido entregada', async () => {
      mockOrderRepo.findOne.mockResolvedValue({
        id: 1,
        status: 'Pendiente',
        rating: null,
        deliveryRating: null,
        items: [],
      });

      await expect(
        service.rateOrder({
          id: 1,
          rating: 5,
          deliveryRating: 5,
        }),
      ).rejects.toThrow(
        'Solo puedes calificar pedidos que ya fueron entregados.',
      );
    });

    it('debe lanzar error si la orden ya fue calificada por restaurante', async () => {
      mockOrderRepo.findOne.mockResolvedValue({
        id: 1,
        status: 'Entregado',
        rating: 4,
        deliveryRating: null,
        items: [],
      });

      await expect(
        service.rateOrder({
          id: 1,
          rating: 5,
          deliveryRating: 5,
        }),
      ).rejects.toThrow('Este pedido ya fue calificado anteriormente.');
    });

    it('debe lanzar error si la orden ya fue calificada por delivery', async () => {
      mockOrderRepo.findOne.mockResolvedValue({
        id: 1,
        status: 'Entregado',
        rating: null,
        deliveryRating: 4,
        items: [],
      });

      await expect(
        service.rateOrder({
          id: 1,
          rating: 5,
          deliveryRating: 5,
        }),
      ).rejects.toThrow('Este pedido ya fue calificado anteriormente.');
    });

    it('debe emitir solo order_rated si no hay items ni deliveryRating', async () => {
      const order = {
        id: 3,
        restaurantId: 12,
        status: 'Entregado',
        rating: null,
        comment: null,
        deliveryRating: null,
        deliveryComment: null,
        items: [],
      };

      const data = {
        id: 3,
        rating: 4,
        comment: 'Bien',
      };

      const savedOrder = {
        ...order,
        rating: 4,
        comment: 'Bien',
        deliveryRating: undefined,
        deliveryComment: undefined,
        items: [],
      };

      mockOrderRepo.findOne.mockResolvedValue(order);
      mockOrderRepo.save.mockResolvedValue(savedOrder);

      const result = await service.rateOrder(data);

      expect(mockRestaurantQueue.emit).toHaveBeenCalledWith('order_rated', {
        restaurantId: 12,
        orderId: 3,
        rating: 4,
        comment: 'Bien',
      });

      expect(mockDeliveryQueue.emit).not.toHaveBeenCalledWith(
        'delivery_rated',
        expect.anything(),
      );

      expect(mockRestaurantQueue.emit).not.toHaveBeenCalledWith(
        'items_rated',
        expect.anything(),
      );

      expect(result).toEqual(savedOrder);
    });

    it('debe dejar items igual si data.items no viene', async () => {
      const order = {
        id: 4,
        restaurantId: 13,
        status: 'Entregado',
        rating: null,
        comment: null,
        deliveryRating: null,
        deliveryComment: null,
        items: [
          {
            id: 1,
            menuItemId: 200,
            quantity: 1,
            price: 22,
            isRecommended: null,
          },
        ],
      };

      const data = {
        id: 4,
        rating: 5,
        comment: 'Todo bien',
        deliveryRating: 5,
        deliveryComment: 'Excelente',
      };

      const savedOrder = {
        ...order,
        rating: 5,
        comment: 'Todo bien',
        deliveryRating: 5,
        deliveryComment: 'Excelente',
      };

      mockOrderRepo.findOne.mockResolvedValue(order);
      mockOrderRepo.save.mockResolvedValue(savedOrder);

      const result = await service.rateOrder(data);

      expect(mockOrderRepo.save).toHaveBeenCalledWith({
        ...order,
        rating: 5,
        comment: 'Todo bien',
        deliveryRating: 5,
        deliveryComment: 'Excelente',
      });

      expect(result).toEqual(savedOrder);
    });
  });
});
