import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CatalogService } from './catalog.service';

@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @GrpcMethod('CatalogService', 'ValidateProducts')
  async validateProducts(data: any) {
    console.log('RAW DATA RECIBIDO EN GRPC:', JSON.stringify(data, null, 2));
    
    const restaurantId = data.restaurant_id || data.restaurantId;
    
    // Mapea los productos de camelCase a snake_case
    const products = (data.products || []).map((p: any) => ({
      product_id: p.product_id || p.productId,
      expected_price: p.expected_price || p.expectedPrice,
      quantity: p.quantity,
    }));

    console.log('DATOS PROCESADOS:', {
      restaurantId,
      products
    });

    console.log('Validacion solicitada:', {
      restaurantId: restaurantId,
      productCount: products.length,
    });

    try {
      const result = await this.catalogService.validateProducts(
        restaurantId,
        products,
      );

      console.log('Resultado validacion:', result);
      return result;
    } catch (error) {
      console.error('Error en validacion:', error);
      return {
        valid: false,
        message: 'Error en validacion',
        errors: [error.message],
      };
    }
  }
}