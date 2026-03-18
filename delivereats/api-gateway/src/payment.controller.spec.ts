import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { of, throwError } from 'rxjs';

import { PaymentController } from './payment.controller';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';

describe('PaymentController', () => {
  let controller: PaymentController;

  const mockPaymentService = {
    rechargeWallet: jest.fn(),
    processOrderPayment: jest.fn(),
    getWallet: jest.fn(),
  };

  const mockClientGrpc = {
    getService: jest.fn().mockReturnValue(mockPaymentService),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: 'PAYMENT_SERVICE',
          useValue: mockClientGrpc,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<PaymentController>(PaymentController);
    controller.onModuleInit();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('debe inicializar paymentService desde ClientGrpc', () => {
      expect(mockClientGrpc.getService).toHaveBeenCalledWith('PaymentService');
    });
  });

  describe('getMyWallet', () => {
    it('debe obtener la billetera del usuario autenticado', async () => {
      const req = {
        user: {
          userId: 25,
          role: 'Cliente',
        },
      };

      const response = {
        userId: 25,
        balance: 150.5,
      };

      mockPaymentService.getWallet.mockReturnValue(of(response));

      const result = await controller.getMyWallet(req);

      expect(mockPaymentService.getWallet).toHaveBeenCalledWith({
        userId: 25,
      });
      expect(result).toEqual(response);
    });

    it('debe lanzar INTERNAL_SERVER_ERROR si falla getWallet', async () => {
      const req = {
        user: {
          userId: 25,
          role: 'Cliente',
        },
      };

      mockPaymentService.getWallet.mockReturnValue(
        throwError(() => new Error('grpc fail')),
      );

      await expect(controller.getMyWallet(req)).rejects.toThrow(
        new HttpException(
          'Error al conectar con el microservicio de pagos',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('rechargeWallet', () => {
    it('debe recargar la billetera con los datos del body y userId del token', async () => {
      const req = {
        user: {
          userId: 8,
          role: 'Cliente',
        },
      };

      const body = {
        amount: 100,
        cardNumber: '4111111111111111',
        cvv: '123',
        expiryDate: '12/28',
      };

      const response = {
        success: true,
        newBalance: 300,
      };

      mockPaymentService.rechargeWallet.mockReturnValue(of(response));

      const result = await controller.rechargeWallet(req, body);

      expect(mockPaymentService.rechargeWallet).toHaveBeenCalledWith({
        userId: 8,
        amount: 100,
        cardNumber: '4111111111111111',
        cvv: '123',
        expiryDate: '12/28',
      });
      expect(result).toEqual(response);
    });

    it('debe lanzar INTERNAL_SERVER_ERROR si falla rechargeWallet', async () => {
      const req = {
        user: {
          userId: 8,
          role: 'Cliente',
        },
      };

      const body = {
        amount: 100,
        cardNumber: '4111111111111111',
        cvv: '123',
        expiryDate: '12/28',
      };

      mockPaymentService.rechargeWallet.mockReturnValue(
        throwError(() => new Error('payment fail')),
      );

      await expect(controller.rechargeWallet(req, body)).rejects.toThrow(
        new HttpException(
          'Error procesando la recarga',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('payOrder', () => {
    it('debe procesar el pago de una orden con userId del token', async () => {
      const req = {
        user: {
          userId: 14,
          role: 'Cliente',
        },
      };

      const body = {
        orderId: 77,
        amount: 250,
      };

      const response = {
        success: true,
        orderId: 77,
        amount: 250,
      };

      mockPaymentService.processOrderPayment.mockReturnValue(of(response));

      const result = await controller.payOrder(req, body);

      expect(mockPaymentService.processOrderPayment).toHaveBeenCalledWith({
        userId: 14,
        orderId: 77,
        amount: 250,
      });
      expect(result).toEqual(response);
    });

    it('debe lanzar INTERNAL_SERVER_ERROR si falla processOrderPayment', async () => {
      const req = {
        user: {
          userId: 14,
          role: 'Cliente',
        },
      };

      const body = {
        orderId: 77,
        amount: 250,
      };

      mockPaymentService.processOrderPayment.mockReturnValue(
        throwError(() => new Error('grpc fail')),
      );

      await expect(controller.payOrder(req, body)).rejects.toThrow(
        new HttpException(
          'Error procesando el pago de la orden',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });
});
