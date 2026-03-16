import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { of, throwError } from 'rxjs';
import { DeliveryService } from './delivery.service';
import { Delivery } from './entities/delivery.entity';

describe('DeliveryService', () => {
  let service: DeliveryService;

  const mockDeliveryRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockOrderService = {
    updateOrderStatus: jest.fn(),
    getOrder: jest.fn(),
  };

  const mockClientGrpc = {
    getService: jest.fn().mockReturnValue(mockOrderService),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryService,
        {
          provide: getRepositoryToken(Delivery),
          useValue: mockDeliveryRepo,
        },
        {
          provide: 'ORDER_SERVICE',
          useValue: mockClientGrpc,
        },
      ],
    }).compile();

    service = module.get<DeliveryService>(DeliveryService);
    service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('debe inicializar orderService desde ClientGrpc', () => {
      expect(mockClientGrpc.getService).toHaveBeenCalledWith('OrderService');
    });
  });

  describe('acceptOrder', () => {
    it('debe crear y guardar una entrega, y sincronizar con Order Service', async () => {
      const dto = { orderId: 1, driverId: 10 };

      const createdDelivery = {
        orderId: dto.orderId,
        driverId: dto.driverId,
        status: 'En_camino',
      };

      const savedDelivery = {
        id: 100,
        ...createdDelivery,
      };

      mockDeliveryRepo.create.mockReturnValue(createdDelivery);
      mockDeliveryRepo.save.mockResolvedValue(savedDelivery);
      mockOrderService.updateOrderStatus.mockReturnValue(of({ success: true }));

      const result = await service.acceptOrder(dto);

      expect(mockDeliveryRepo.create).toHaveBeenCalledWith({
        orderId: dto.orderId,
        driverId: dto.driverId,
        status: 'En_camino',
      });
      expect(mockDeliveryRepo.save).toHaveBeenCalledWith(createdDelivery);
      expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith({
        id: dto.orderId,
        status: 'En_camino',
      });
      expect(result).toEqual(savedDelivery);
    });

    it('debe guardar la entrega aunque falle la sincronización con Order Service', async () => {
      const dto = { orderId: 2, driverId: 20 };

      const createdDelivery = {
        orderId: dto.orderId,
        driverId: dto.driverId,
        status: 'En_camino',
      };

      const savedDelivery = {
        id: 101,
        ...createdDelivery,
      };

      mockDeliveryRepo.create.mockReturnValue(createdDelivery);
      mockDeliveryRepo.save.mockResolvedValue(savedDelivery);
      mockOrderService.updateOrderStatus.mockReturnValue(
        throwError(() => new Error('gRPC error')),
      );

      const result = await service.acceptOrder(dto);

      expect(mockDeliveryRepo.save).toHaveBeenCalled();
      expect(mockOrderService.updateOrderStatus).toHaveBeenCalled();
      expect(result).toEqual(savedDelivery);
    });
  });

  describe('updateStatus', () => {
    it('debe actualizar el estado de la entrega y sincronizar con Order Service', async () => {
      const dto = {
        deliveryId: 1,
        status: 'Entregado',
        proofOfDelivery: 'foto.jpg',
      };

      const delivery = {
        id: 1,
        orderId: 50,
        driverId: 5,
        status: 'En_camino',
        proofOfDelivery: null,
      };

      const updatedDelivery = {
        ...delivery,
        status: 'Entregado',
        proofOfDelivery: 'foto.jpg',
      };

      mockDeliveryRepo.findOneBy.mockResolvedValue(delivery);
      mockDeliveryRepo.save.mockResolvedValue(updatedDelivery);
      mockOrderService.updateOrderStatus.mockReturnValue(of({ success: true }));

      const result = await service.updateStatus(dto);

      expect(mockDeliveryRepo.findOneBy).toHaveBeenCalledWith({
        id: dto.deliveryId,
      });
      expect(mockDeliveryRepo.save).toHaveBeenCalledWith({
        ...delivery,
        status: 'Entregado',
        proofOfDelivery: 'foto.jpg',
      });
      expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith({
        id: delivery.orderId,
        status: dto.status,
        proofOfDelivery: dto.proofOfDelivery,
      });
      expect(result).toEqual(updatedDelivery);
    });

    it('debe actualizar solo el status si no llega proofOfDelivery', async () => {
      const dto = {
        deliveryId: 2,
        status: 'Cancelado',
      };

      const delivery = {
        id: 2,
        orderId: 60,
        driverId: 9,
        status: 'En_camino',
        proofOfDelivery: null,
      };

      const updatedDelivery = {
        ...delivery,
        status: 'Cancelado',
      };

      mockDeliveryRepo.findOneBy.mockResolvedValue(delivery);
      mockDeliveryRepo.save.mockResolvedValue(updatedDelivery);
      mockOrderService.updateOrderStatus.mockReturnValue(of({ success: true }));

      const result = await service.updateStatus(dto);

      expect(mockDeliveryRepo.save).toHaveBeenCalledWith({
        ...delivery,
        status: 'Cancelado',
      });
      expect(mockOrderService.updateOrderStatus).toHaveBeenCalledWith({
        id: delivery.orderId,
        status: dto.status,
        proofOfDelivery: undefined,
      });
      expect(result).toEqual(updatedDelivery);
    });

    it('debe lanzar error si la entrega no existe', async () => {
      mockDeliveryRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.updateStatus({
          deliveryId: 999,
          status: 'Entregado',
        }),
      ).rejects.toThrow('Entrega no encontrada');

      expect(mockDeliveryRepo.save).not.toHaveBeenCalled();
      expect(mockOrderService.updateOrderStatus).not.toHaveBeenCalled();
    });

    it('debe retornar la entrega actualizada aunque falle la sincronización con Order Service', async () => {
      const dto = {
        deliveryId: 3,
        status: 'Entregado',
        proofOfDelivery: 'foto2.jpg',
      };

      const delivery = {
        id: 3,
        orderId: 70,
        driverId: 11,
        status: 'En_camino',
        proofOfDelivery: null,
      };

      const updatedDelivery = {
        ...delivery,
        status: 'Entregado',
        proofOfDelivery: 'foto2.jpg',
      };

      mockDeliveryRepo.findOneBy.mockResolvedValue(delivery);
      mockDeliveryRepo.save.mockResolvedValue(updatedDelivery);
      mockOrderService.updateOrderStatus.mockReturnValue(
        throwError(() => new Error('sync error')),
      );

      const result = await service.updateStatus(dto);

      expect(mockDeliveryRepo.save).toHaveBeenCalled();
      expect(result).toEqual(updatedDelivery);
    });
  });

  describe('getDeliveriesByDriver', () => {
    it('debe retornar las entregas enriquecidas con datos del Order Service', async () => {
      const deliveries = [
        {
          id: 1,
          orderId: 100,
          driverId: 7,
          status: 'Entregado',
          proofOfDelivery: 'img1.jpg',
          startTime: new Date(),
          rating: 5,
          comment: 'Excelente',
        },
        {
          id: 2,
          orderId: 101,
          driverId: 7,
          status: 'En_camino',
          proofOfDelivery: null,
          startTime: new Date(),
          rating: null,
          comment: null,
        },
      ];

      mockDeliveryRepo.find.mockResolvedValue(deliveries);

      mockOrderService.getOrder
        .mockReturnValueOnce(
          of({ restaurantName: 'Pizza Place', total: '150' }),
        )
        .mockReturnValueOnce(
          of({ restaurantName: 'Burger House', total: '200' }),
        );

      const result = await service.getDeliveriesByDriver(7);

      expect(mockDeliveryRepo.find).toHaveBeenCalledWith({
        where: { driverId: 7 },
        order: { startTime: 'DESC' },
      });

      expect(result).toEqual({
        deliveries: [
          {
            id: 1,
            orderId: 100,
            driverId: 7,
            status: 'Entregado',
            proofOfDelivery: 'img1.jpg',
            startTime: deliveries[0].startTime,
            restaurantName: 'Pizza Place',
            total: 150,
            rating: 5,
            comment: 'Excelente',
          },
          {
            id: 2,
            orderId: 101,
            driverId: 7,
            status: 'En_camino',
            proofOfDelivery: null,
            startTime: deliveries[1].startTime,
            restaurantName: 'Burger House',
            total: 200,
            rating: null,
            comment: null,
          },
        ],
      });
    });

    it('debe usar valores por defecto cuando faltan datos de la orden', async () => {
      const deliveries = [
        {
          id: 1,
          orderId: 300,
          driverId: 8,
          status: 'En_camino',
          proofOfDelivery: null,
          startTime: new Date(),
          rating: null,
          comment: null,
        },
      ];

      mockDeliveryRepo.find.mockResolvedValue(deliveries);
      mockOrderService.getOrder.mockReturnValue(of({}));

      const result = await service.getDeliveriesByDriver(8);

      expect(result).toEqual({
        deliveries: [
          {
            id: 1,
            orderId: 300,
            driverId: 8,
            status: 'En_camino',
            proofOfDelivery: null,
            startTime: deliveries[0].startTime,
            restaurantName: 'Restaurante Desconocido',
            total: 0,
            rating: null,
            comment: null,
          },
        ],
      });
    });
  });

  describe('updateDeliveryRating', () => {
    it('debe actualizar rating y comment de la entrega', async () => {
      const dto = {
        orderId: 10,
        rating: 4,
        comment: 'Muy bien',
      };

      const delivery = {
        id: 1,
        orderId: 10,
        driverId: 99,
        rating: null,
        comment: null,
      };

      mockDeliveryRepo.findOne.mockResolvedValue(delivery);
      mockDeliveryRepo.save.mockResolvedValue({
        ...delivery,
        rating: 4,
        comment: 'Muy bien',
      });

      await service.updateDeliveryRating(dto);

      expect(mockDeliveryRepo.findOne).toHaveBeenCalledWith({
        where: { orderId: dto.orderId },
      });
      expect(mockDeliveryRepo.save).toHaveBeenCalledWith({
        ...delivery,
        rating: 4,
        comment: 'Muy bien',
      });
    });

    it('debe guardar comment vacío si no se envía comment', async () => {
      const dto = {
        orderId: 11,
        rating: 5,
      };

      const delivery = {
        id: 2,
        orderId: 11,
        driverId: 33,
        rating: null,
        comment: null,
      };

      mockDeliveryRepo.findOne.mockResolvedValue(delivery);
      mockDeliveryRepo.save.mockResolvedValue({
        ...delivery,
        rating: 5,
        comment: '',
      });

      await service.updateDeliveryRating(dto);

      expect(mockDeliveryRepo.save).toHaveBeenCalledWith({
        ...delivery,
        rating: 5,
        comment: '',
      });
    });

    it('no debe guardar nada si no encuentra la entrega', async () => {
      mockDeliveryRepo.findOne.mockResolvedValue(null);

      const result = await service.updateDeliveryRating({
        orderId: 999,
        rating: 1,
        comment: 'Mal',
      });

      expect(mockDeliveryRepo.save).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });

  describe('cancelDeliveryByOrderId', () => {
    it('debe cancelar la entrega si existe y no está entregada', async () => {
      const delivery = {
        id: 1,
        orderId: 20,
        status: 'En_camino',
      };

      mockDeliveryRepo.findOne.mockResolvedValue(delivery);
      mockDeliveryRepo.save.mockResolvedValue({
        ...delivery,
        status: 'Cancelado',
      });

      await service.cancelDeliveryByOrderId(20);

      expect(mockDeliveryRepo.findOne).toHaveBeenCalledWith({
        where: { orderId: 20 },
      });
      expect(mockDeliveryRepo.save).toHaveBeenCalledWith({
        ...delivery,
        status: 'Cancelado',
      });
    });

    it('no debe cancelar si ya está entregada', async () => {
      const delivery = {
        id: 2,
        orderId: 21,
        status: 'Entregado',
      };

      mockDeliveryRepo.findOne.mockResolvedValue(delivery);

      await service.cancelDeliveryByOrderId(21);

      expect(mockDeliveryRepo.save).not.toHaveBeenCalled();
    });

    it('no debe hacer nada si no encuentra la entrega', async () => {
      mockDeliveryRepo.findOne.mockResolvedValue(null);

      await service.cancelDeliveryByOrderId(22);

      expect(mockDeliveryRepo.save).not.toHaveBeenCalled();
    });
  });
});
