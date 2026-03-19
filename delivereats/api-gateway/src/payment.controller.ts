import {
  Controller,
  Get,
  Post,
  Body,
  Inject,
  OnModuleInit,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { type ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom, Observable } from 'rxjs';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

interface PaymentServiceClient {
  rechargeWallet(data: {
    userId: number;
    amount: number;
    cardNumber: string;
    cvv: string;
    expiryDate: string;
  }): Observable<any>;

  processOrderPayment(data: {
    userId: number;
    orderId: number;
    amount: number;
  }): Observable<any>;

  getWallet(data: { userId: number }): Observable<any>;
}

@Controller('payment')
@UseGuards(AuthGuard, RolesGuard) // Protegemos TODO el controlador de pagos
export class PaymentController implements OnModuleInit {
  private paymentService: PaymentServiceClient;

  constructor(@Inject('PAYMENT_SERVICE') private client: ClientGrpc) {}

  onModuleInit() {
    this.paymentService =
      this.client.getService<PaymentServiceClient>('PaymentService');
  }

  // 1. OBTENER SALDO DE LA BILLETERA (Solo Clientes)
  @Get('wallet')
  @Roles('Cliente')
  async getMyWallet(@Req() req: any) {
    // Tomamos el ID de forma segura desde el token
    const userId = req.user.userId;

    try {
      return await lastValueFrom(this.paymentService.getWallet({ userId }));
    } catch (error) {
      console.error('Error al obtener la billetera:', error);
      throw new HttpException(
        'Error al conectar con el microservicio de pagos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 2. RECARGAR BILLETERA SIMULANDO TARJETA (Solo Clientes)
  @Post('recharge')
  @Roles('Cliente')
  async rechargeWallet(@Req() req: any, @Body() body: any) {
    const userId = req.user.userId;

    const rechargeRequest = {
      userId: userId,
      amount: body.amount,
      cardNumber: body.cardNumber,
      cvv: body.cvv,
      expiryDate: body.expiryDate,
    };

    try {
      return await lastValueFrom(
        this.paymentService.rechargeWallet(rechargeRequest),
      );
    } catch (error) {
      throw new HttpException(
        'Error procesando la recarga',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 3. PROCESAR PAGO DE UNA ORDEN (Solo Clientes)
  @Post('pay')
  @Roles('Cliente')
  async payOrder(
    @Req() req: any,
    @Body() body: { orderId: number; amount: number },
  ) {
    const userId = req.user.userId;

    const payRequest = {
      userId: userId,
      orderId: body.orderId,
      amount: body.amount,
    };

    try {
      return await lastValueFrom(
        this.paymentService.processOrderPayment(payRequest),
      );
    } catch (error) {
      throw new HttpException(
        'Error procesando el pago de la orden',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
