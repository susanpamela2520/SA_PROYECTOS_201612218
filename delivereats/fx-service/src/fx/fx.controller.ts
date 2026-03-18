import { Controller } from '@nestjs/common';
import { FxService } from './fx.service';
import { GrpcMethod } from '@nestjs/microservices';
/* 
import { EventPattern, Payload } from '@nestjs/microservices'; */

@Controller()
export class FxController {
  constructor(private readonly fxService: FxService) {}

  @GrpcMethod('FxService', 'GetExchangeRate')
  async getExchangeRate(data: any) {
    const base = data.baseCurrency || data.base_currency;
    const target = data.targetCurrency || data.target_currency;
    try {
      const result = await this.fxService.getRate(base, target);
      return {
        success: true,
        base_currency: base,
        target_currency: target,
        rate: result.rate,
        last_updated: result.source,
      };
    } catch (error) {
      return { success: false, rate: 0, last_updated: 'ERROR' };
    }
  }

  /*   @GrpcMethod('FxService', 'ConvertCurrency')
  async convertCurrency(data: any) {
    // Lo mismo aquí, aseguramos la lectura correcta
    const base = data.baseCurrency || data.base_currency;
    const target = data.targetCurrency || data.target_currency;
    const amount = data.amount;

    try {
      const result = await this.fxService.getRate(base, target);
      const converted = amount * result.rate;

      return {
        success: true,
        original_amount: amount,
        converted_amount: Number(converted.toFixed(2)),
        rate: result.rate,
      };
    } catch (error) {
      return {
        success: false,
        original_amount: amount,
        converted_amount: 0,
        rate: 0,
      };
    }
  } */
  @GrpcMethod('FxService', 'ConvertCurrency')
  async convertCurrency(data: any) {
    // ESTO ES LO IMPORTANTE AHORITA
    console.log('--- DATA RECIBIDA EN GRPC ---');
    console.log(JSON.stringify(data, null, 2));
    console.log('-----------------------------');

    const base = data.baseCurrency || data.base_currency;
    const target = data.targetCurrency || data.target_currency;
    const amount = data.amount;

    if (!base || !target) {
      console.error('¡Las variables base o target vienen vacías!');
    }

    try {
      const result = await this.fxService.getRate(base, target);
      const converted = amount * result.rate;

      return {
        success: true,
        originalAmount: amount, // <-- Cambio aquí
        convertedAmount: Number(converted.toFixed(2)), // <-- Cambio aquí
        rate: result.rate,
      };
    } catch (error) {
      return {
        success: false,
        originalAmount: amount,
        convertedAmount: 0,
        rate: 0,
      };
    }
  }
}
