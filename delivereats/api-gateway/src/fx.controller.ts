import {
  Controller,
  Get,
  Query,
  Inject,
  OnModuleInit,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { type ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom, Observable } from 'rxjs';

interface FxServiceClient {
  convertCurrency(data: {
    baseCurrency: string;
    targetCurrency: string;
    amount: number;
  }): Observable<any>;

  getExchangeRate(data: {
    baseCurrency: string;
    targetCurrency: string;
  }): Observable<any>;
}

@Controller('fx')
export class FxController implements OnModuleInit {
  private fxService: FxServiceClient;

  // Inyectamos el nombre exacto que le pusiste en el app.module.ts
  constructor(@Inject('FX_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    // FxService es el nombre del service dentro de tu fx.proto
    this.fxService = this.client.getService<FxServiceClient>('FxService');
  }

  // Endpoint: GET /fx/convert?amount=150&target=USD
  @Get('convert')
  // @UseGuards(AuthGuard) // Descomenta esto si quieres proteger la ruta
  async convertAmount(
    @Query('amount') amount: string,
    @Query('target') target: string,
  ) {
    if (!amount || !target) {
      throw new HttpException(
        'Faltan parámetros: amount y target son requeridos',
        HttpStatus.BAD_REQUEST,
      );
    }

    const convertRequest = {
      baseCurrency: 'GTQ', // <-- Cambio aquí
      targetCurrency: target.toUpperCase(), // <-- Cambio aquí
      amount: Number(amount),
    };

    try {
      return await lastValueFrom(
        this.fxService.convertCurrency(convertRequest),
      );
    } catch (error) {
      console.error('Error al obtener la conversión:', error);
      throw new HttpException(
        'Error al conectar con el microservicio de divisas',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
