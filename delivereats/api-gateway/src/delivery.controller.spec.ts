import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { of, throwError } from 'rxjs';

import { DeliveryController } from './delivery.controller';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';

describe('DeliveryController', () => {
  let controller: DeliveryController;

  const mockDeliveryService = {
    acceptOrder: jest.fn(),
    updateDeliveryStatus: jest.fn(),
    getDeliveriesByDriver: jest.fn(),
    healthCheck: jest.fn(),
  };

  const mockClientGrpc = {
    getService: jest.fn().mockReturnValue(mockDeliveryService),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeliveryController],
      providers: [
        {
          provide: 'DELIVERY_SERVICE',
          useValue: mockClientGrpc,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<DeliveryController>(DeliveryController);
    controller.onModuleInit();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('acceptOrder', () => {
    it('debe aceptar una orden correctamente', async () => {
      const req = {
        user: {
          userId: 7,
          role: 'Repartidor',
        },
      };

      mockDeliveryService.acceptOrder.mockReturnValue(
        of({
          id: 1,
          orderId: 15,
          driverId: 7,
          status: 'En_camino',
        }),
      );

      const result = await controller.acceptOrder('15', req);

      expect(mockDeliveryService.acceptOrder).toHaveBeenCalledWith({
        orderId: 15,
        driverId: 7,
      });

      expect(result).toEqual({
        id: 1,
        orderId: 15,
        driverId: 7,
        status: 'En_camino',
      });
    });

    it('debe lanzar HttpException si falla acceptOrder', async () => {
      const req = {
        user: {
          userId: 7,
          role: 'Repartidor',
        },
      };

      mockDeliveryService.acceptOrder.mockReturnValue(
        throwError(() => new Error('already taken')),
      );

      await expect(controller.acceptOrder('15', req)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('updateStatus', () => {
    it('debe enviar deliveryId, status y proofOfDelivery', async () => {
      const body = {
        status: 'Entregado',
        proofOfDelivery: 'foto-base64',
      };

      const response = {
        id: 5,
        orderId: 20,
        status: 'Entregado',
        proofOfDelivery: 'foto-base64',
      };

      mockDeliveryService.updateDeliveryStatus.mockReturnValue(response);

      const result = await controller.updateStatus('5', body);

      expect(mockDeliveryService.updateDeliveryStatus).toHaveBeenCalledWith({
        deliveryId: 5,
        status: 'Entregado',
        proofOfDelivery: 'foto-base64',
      });

      expect(result).toEqual(response);
    });

    it('debe enviar proofOfDelivery undefined si no viene en body', async () => {
      const body = {
        status: 'Cancelado',
      };

      const response = {
        id: 6,
        orderId: 21,
        status: 'Cancelado',
      };

      mockDeliveryService.updateDeliveryStatus.mockReturnValue(response);

      const result = await controller.updateStatus('6', body);

      expect(mockDeliveryService.updateDeliveryStatus).toHaveBeenCalledWith({
        deliveryId: 6,
        status: 'Cancelado',
        proofOfDelivery: undefined,
      });

      expect(result).toEqual(response);
    });
  });

  describe('getMyDeliveries', () => {
    it('debe retornar deliveries cuando el microservicio responde bien', async () => {
      const req = {
        user: {
          userId: 9,
          role: 'Repartidor',
        },
      };

      const deliveries = [
        { id: 1, orderId: 100, status: 'Entregado' },
        { id: 2, orderId: 101, status: 'En_camino' },
      ];

      mockDeliveryService.getDeliveriesByDriver.mockReturnValue(
        of({ deliveries }),
      );

      const result = await controller.getMyDeliveries(req);

      expect(mockDeliveryService.getDeliveriesByDriver).toHaveBeenCalledWith({
        driverId: 9,
      });
      expect(result).toEqual(deliveries);
    });

    it('debe retornar [] si deliveries viene undefined', async () => {
      const req = {
        user: {
          userId: 9,
          role: 'Repartidor',
        },
      };

      mockDeliveryService.getDeliveriesByDriver.mockReturnValue(of({}));

      const result = await controller.getMyDeliveries(req);

      expect(result).toEqual([]);
    });

    it('debe retornar [] si falla el microservicio', async () => {
      const req = {
        user: {
          userId: 9,
          role: 'Repartidor',
        },
      };

      mockDeliveryService.getDeliveriesByDriver.mockReturnValue(
        throwError(() => new Error('grpc fail')),
      );

      const result = await controller.getMyDeliveries(req);

      expect(result).toEqual([]);
    });
  });

  describe('testConnection', () => {
    it('debe retornar healthCheck cuando el microservicio responde', async () => {
      mockDeliveryService.healthCheck.mockReturnValue(
        of({ message: 'Delivery service alive' }),
      );

      const result = await controller.testConnection({} as any);

      expect(mockDeliveryService.healthCheck).toHaveBeenCalledWith({});
      expect(result).toEqual({ message: 'Delivery service alive' });
    });

    it('debe retornar mensaje de fallback si falla healthCheck', async () => {
      const grpcError = new Error('connection refused');

      mockDeliveryService.healthCheck.mockReturnValue(
        throwError(() => grpcError),
      );

      const result = await controller.testConnection({} as any);

      expect(result).toEqual({
        message: 'El Gateway funciona, pero el Microservicio NO responde.',
        error: grpcError,
      });
    });
  });
});
