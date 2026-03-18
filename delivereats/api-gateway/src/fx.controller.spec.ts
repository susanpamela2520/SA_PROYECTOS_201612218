import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { of, throwError } from 'rxjs';

import { FxController } from './fx.controller';

describe('FxController', () => {
  let controller: FxController;

  const mockFxService = {
    convertCurrency: jest.fn(),
    getExchangeRate: jest.fn(),
  };

  const mockClientGrpc = {
    getService: jest.fn().mockReturnValue(mockFxService),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FxController],
      providers: [
        {
          provide: 'FX_PACKAGE',
          useValue: mockClientGrpc,
        },
      ],
    }).compile();

    controller = module.get<FxController>(FxController);
    controller.onModuleInit();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('debe inicializar fxService desde ClientGrpc', () => {
      expect(mockClientGrpc.getService).toHaveBeenCalledWith('FxService');
    });
  });

  describe('convertAmount', () => {
    it('debe convertir monto correctamente usando GTQ como base', async () => {
      mockFxService.convertCurrency.mockReturnValue(
        of({
          originalAmount: 150,
          convertedAmount: 19.35,
          baseCurrency: 'GTQ',
          targetCurrency: 'USD',
          exchangeRate: 0.129,
        }),
      );

      const result = await controller.convertAmount('150', 'usd');

      expect(mockFxService.convertCurrency).toHaveBeenCalledWith({
        baseCurrency: 'GTQ',
        targetCurrency: 'USD',
        amount: 150,
      });

      expect(result).toEqual({
        originalAmount: 150,
        convertedAmount: 19.35,
        baseCurrency: 'GTQ',
        targetCurrency: 'USD',
        exchangeRate: 0.129,
      });
    });

    it('debe lanzar BAD_REQUEST si falta amount', async () => {
      await expect(
        controller.convertAmount(undefined as any, 'USD'),
      ).rejects.toThrow(
        new HttpException(
          'Faltan parámetros: amount y target son requeridos',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('debe lanzar BAD_REQUEST si falta target', async () => {
      await expect(
        controller.convertAmount('150', undefined as any),
      ).rejects.toThrow(
        new HttpException(
          'Faltan parámetros: amount y target son requeridos',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('debe lanzar BAD_REQUEST si faltan ambos parámetros', async () => {
      await expect(
        controller.convertAmount(undefined as any, undefined as any),
      ).rejects.toThrow(
        new HttpException(
          'Faltan parámetros: amount y target son requeridos',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('debe lanzar INTERNAL_SERVER_ERROR si falla el microservicio', async () => {
      mockFxService.convertCurrency.mockReturnValue(
        throwError(() => new Error('grpc fail')),
      );

      await expect(controller.convertAmount('150', 'USD')).rejects.toThrow(
        new HttpException(
          'Error al conectar con el microservicio de divisas',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });

    it('debe convertir amount string a number', async () => {
      mockFxService.convertCurrency.mockReturnValue(
        of({
          convertedAmount: 6.45,
        }),
      );

      await controller.convertAmount('50', 'eur');

      expect(mockFxService.convertCurrency).toHaveBeenCalledWith({
        baseCurrency: 'GTQ',
        targetCurrency: 'EUR',
        amount: 50,
      });
    });
  });
});
