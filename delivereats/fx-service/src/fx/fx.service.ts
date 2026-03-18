import { Injectable, Inject, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FxService {
  private readonly logger = new Logger(FxService.name);
  private readonly TTL_12_HOURS = 43200; // 12 horas en segundos

  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getRate(
    base: string,
    target: string,
  ): Promise<{ rate: number; source: string }> {
    const cacheKey = `rate_${base}_${target}`;
    const backupKey = `backup_rate_${base}_${target}`;

    // 1. Intentar obtener de Caché principal (12 horas)
    const cachedRate = await this.cacheManager.get<number>(cacheKey);
    if (cachedRate) {
      this.logger.log(`Tasa obtenida de Redis Caché para ${base}->${target}`);
      return { rate: cachedRate, source: 'CACHE' };
    }

    // 2. Si no hay caché, ir a la API externa
    try {
      this.logger.log(`Consultando API Externa para ${base}->${target}...`);
      const url = `https://open.er-api.com/v6/latest/${base}`;
      const response = await firstValueFrom(this.httpService.get(url));

      const rates = response.data.rates;
      const targetRate = rates[target];

      if (!targetRate) {
        throw new Error(`Moneda destino ${target} no soportada por la API`);
      }

      // Guardar en caché principal con TTL de 12 horas
      await this.cacheManager.set(cacheKey, targetRate, this.TTL_12_HOURS);

      // Guardar en caché de respaldo sin expiración (para el Fallback)
      await this.cacheManager.set(backupKey, targetRate, 0);

      return { rate: targetRate, source: 'API' };
    } catch (error) {
      this.logger.error(
        `Error en API Externa: ${error.message}. Intentando Fallback...`,
      );

      // 3. Fallback: Si la API falló y el caché principal expiró, usamos el respaldo
      const backupRate = await this.cacheManager.get<number>(backupKey);
      if (backupRate) {
        this.logger.warn(`Usando caché de RESPALDO para ${base}->${target}`);
        return { rate: backupRate, source: 'FALLBACK_CACHE' };
      }

      throw new Error(
        `No se pudo obtener la tasa de cambio y no hay fallback disponible.`,
      );
    }
  }
}
