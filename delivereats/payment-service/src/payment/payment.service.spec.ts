import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Wallet } from './entities/wallet.entity';
import { of, throwError } from 'rxjs';

describe('PaymentService', () => {
  let service: PaymentService;
  let walletRepo: any;
  let orderServiceClient: any;

  // 1. Mock del Repositorio de TypeORM (Simulamos la Base de Datos)
  const mockWalletRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  // 2. Mock del Cliente gRPC de Órdenes
  const mockOrderServiceClient = {
    updateOrderStatus: jest.fn(),
  };

  const mockClientGrpc = {
    getService: jest.fn().mockReturnValue(mockOrderServiceClient),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        // Inyectamos el mock de la base de datos usando el token de TypeORM
        { provide: getRepositoryToken(Wallet), useValue: mockWalletRepo },
        // Inyectamos el mock del cliente gRPC
        { provide: 'ORDER_SERVICE', useValue: mockClientGrpc },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    walletRepo = module.get(getRepositoryToken(Wallet));

    // Ejecutamos manualmente el onModuleInit para que inyecte el mock del gRPC
    service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Limpiamos contadores después de cada prueba
  });

  it('debería estar definido el servicio', () => {
    expect(service).toBeDefined();
  });

  describe('getOrCreateWallet', () => {
    it('debería retornar la billetera si ya existe', async () => {
      const existingWallet = { userId: 1, balance: 150 };
      walletRepo.findOne.mockResolvedValue(existingWallet);

      const result = await service.getOrCreateWallet(1);

      expect(result).toEqual(existingWallet);
      expect(walletRepo.findOne).toHaveBeenCalledWith({ where: { userId: 1 } });
      expect(walletRepo.create).not.toHaveBeenCalled();
    });

    it('debería crear una nueva billetera en Q0.00 si no existe', async () => {
      walletRepo.findOne.mockResolvedValue(null);
      const newWallet = { userId: 2, balance: 0 };
      walletRepo.create.mockReturnValue(newWallet);
      walletRepo.save.mockResolvedValue(newWallet);

      const result = await service.getOrCreateWallet(2);

      expect(result).toEqual(newWallet);
      expect(walletRepo.create).toHaveBeenCalledWith({ userId: 2, balance: 0 });
      expect(walletRepo.save).toHaveBeenCalledWith(newWallet);
    });
  });

  describe('recharge', () => {
    it('debería rechazar la recarga si la tarjeta termina en 0000', async () => {
      const result = await service.recharge({
        cardNumber: '123456780000',
        amount: 100,
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Tarjeta rechazada por el banco.');
      expect(walletRepo.save).not.toHaveBeenCalled();
    });

    it('debería sumar el monto a la billetera con una tarjeta válida', async () => {
      const mockWallet = { userId: 1, balance: 50 };
      walletRepo.findOne.mockResolvedValue(mockWallet);
      walletRepo.save.mockResolvedValue(true);

      const result = await service.recharge({
        userId: 1,
        cardNumber: '123456789012',
        amount: 100,
      });

      expect(mockWallet.balance).toBe(150); // 50 + 100
      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(150);
      expect(walletRepo.save).toHaveBeenCalledWith(mockWallet);
    });
  });

  describe('processPayment', () => {
    it('debería fallar si el saldo es insuficiente', async () => {
      const mockWallet = { userId: 1, balance: 50 }; // Solo tiene Q50
      walletRepo.findOne.mockResolvedValue(mockWallet);

      const result = await service.processPayment({ userId: 1, amount: 100 }); // Intenta pagar Q100

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        'Saldo insuficiente en la billetera virtual.',
      );
      expect(walletRepo.save).not.toHaveBeenCalled();
    });

    it('debería descontar el saldo y notificar al Order Service si hay fondos', async () => {
      const mockWallet = { userId: 1, balance: 200 };
      walletRepo.findOne.mockResolvedValue(mockWallet);

      // Simulamos que el Order Service responde OK
      mockOrderServiceClient.updateOrderStatus.mockReturnValue(
        of({ success: true }),
      );

      const result = await service.processPayment({
        userId: 1,
        orderId: 99,
        amount: 150,
      });

      expect(mockWallet.balance).toBe(50); // 200 - 150
      expect(walletRepo.save).toHaveBeenCalledWith(mockWallet);
      expect(mockOrderServiceClient.updateOrderStatus).toHaveBeenCalledWith({
        id: 99,
        status: 'Pagado',
      });
      expect(result.success).toBe(true);
    });

    it('debería procesar el pago incluso si gRPC falla (atrapar el error)', async () => {
      const mockWallet = { userId: 1, balance: 100 };
      walletRepo.findOne.mockResolvedValue(mockWallet);

      // Simulamos una caída del gRPC
      mockOrderServiceClient.updateOrderStatus.mockReturnValue(
        throwError(() => new Error('gRPC caído')),
      );

      // Espiamos el console.error para que el test no nos ensucie la terminal
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.processPayment({
        userId: 1,
        orderId: 99,
        amount: 50,
      });

      expect(result.success).toBe(true); // El pago sí se hizo internamente
      expect(mockWallet.balance).toBe(50);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('refund', () => {
    it('debería devolver el dinero a la billetera en caso de cancelación', async () => {
      const mockWallet = { userId: 1, balance: 20 };
      walletRepo.findOne.mockResolvedValue(mockWallet);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await service.refund(99, 1, 150);

      expect(mockWallet.balance).toBe(170); // 20 + 150 devueltos
      expect(walletRepo.save).toHaveBeenCalledWith(mockWallet);
      consoleSpy.mockRestore();
    });
  });
});
