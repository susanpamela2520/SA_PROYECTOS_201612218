import { Test, TestingModule } from '@nestjs/testing';
import { FxService } from './fx.service';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { of, throwError } from 'rxjs';

describe('FxService', () => {
  let service: FxService;
  let httpService: HttpService;
  let cacheManager: any;

  // 1. Creamos nuestros "Mocks" (Doble de riesgo) para Redis y Axios
  const mockHttpService = {
    get: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  // Esto se ejecuta ANTES de cada prueba para limpiar el terreno
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FxService,
        // Le decimos a Nest: "Cuando alguien pida el HttpService, dale mi mock falso"
        { provide: HttpService, useValue: mockHttpService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<FxService>(FxService);
    httpService = module.get<HttpService>(HttpService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  // Limpiamos los contadores después de cada prueba
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido el servicio', () => {
    expect(service).toBeDefined();
  });

  // --- PRUEBA 1: EL CACHÉ FUNCIONA ---
  it('debería retornar la tasa de cambio rápido desde Redis (Caché Hit)', async () => {
    // Simulamos que Redis encuentra la tasa y nos devuelve 0.13
    cacheManager.get.mockResolvedValue(0.13);

    const result = await service.getRate('GTQ', 'USD');

    // Comprobamos que el servicio respondió correctamente
    expect(result).toEqual({ rate: 0.13, source: 'CACHE' });
    // Verificamos que sí intentó buscar en Redis
    expect(cacheManager.get).toHaveBeenCalledWith('rate_GTQ_USD');
    // Verificamos que NO haya tocado la API externa para ahorrar recursos
    expect(httpService.get).not.toHaveBeenCalled();
  });

  // --- PRUEBA 2: NO HAY CACHÉ, VA A LA API ---
  it('debería ir a la API externa si no hay caché y guardar el nuevo valor en Redis', async () => {
    // Simulamos que Redis está vacío (caducó el caché)
    cacheManager.get.mockResolvedValue(null);

    // Simulamos que la API de open.er-api.com nos responde exitosamente
    mockHttpService.get.mockReturnValue(
      of({ data: { rates: { USD: 0.13 } } }), // Usamos "of" porque NestJS/Axios devuelve Observables
    );

    const result = await service.getRate('GTQ', 'USD');

    expect(result).toEqual({ rate: 0.13, source: 'API' });
    // Verificamos que sí haya llamado a la API
    expect(httpService.get).toHaveBeenCalled();
    // Verificamos que haya guardado la tasa 2 veces (caché normal y caché de fallback)
    expect(cacheManager.set).toHaveBeenCalledTimes(2);
  });

  // --- PRUEBA 3: FALLA CATASTRÓFICA ---
  it('debería lanzar un error si la API externa se cae y no hay caché de respaldo', async () => {
    // Simulamos que Redis no tiene nada
    cacheManager.get.mockResolvedValue(null);

    // Simulamos que la API nos tira un error 500
    mockHttpService.get.mockReturnValue(
      throwError(() => new Error('API caída, timeout')),
    );

    // Comprobamos que el código de nuestro servicio intercepte el error y tire la excepción que diseñamos
    await expect(service.getRate('GTQ', 'USD')).rejects.toThrow(
      'No se pudo obtener la tasa de cambio y no hay fallback disponible.',
    );
  });
});
