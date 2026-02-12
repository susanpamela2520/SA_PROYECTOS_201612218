import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  async validateProducts(restaurantId: number, products: any[]) {
    const errors: string[] = [];

    console.log('Validando productos para restaurante:', restaurantId);

    for (const item of products) {
      const product = await this.productRepo.findOne({
        where: { id: item.product_id },
      });

      if (!product) {
        errors.push(`Producto ${item.product_id} no existe`);
        console.log('Producto NO encontrado:', item.product_id);
        continue;
      }

      console.log('Producto encontrado:', {
        id: product.id,
        nombre: product.nombre,
        restaurantId: product.restaurantId,
        disponible: product.disponible,
        precio: product.precio
      });

      if (product.restaurantId !== restaurantId) {
        errors.push(`Producto ${item.product_id} no pertenece al restaurante ${restaurantId}`);
        console.log('Producto pertenece a otro restaurante');
        continue;
      }

      if (!product.disponible) {
        errors.push(`Producto ${item.product_id} no esta disponible`);
        console.log('Producto NO disponible');
        continue;
      }

      const productPrice = parseFloat(product.precio.toString());
      const expectedPrice = parseFloat(item.expected_price);

      if (productPrice !== expectedPrice) {
        errors.push(`Precio incorrecto para ${product.nombre}. Esperado: ${expectedPrice}, Actual: ${productPrice}`);
        console.log('Precio incorrecto');
        continue;
      }

      console.log('Producto validado OK');
    }

    if (errors.length > 0) {
      return {
        valid: false,
        message: 'Validacion fallida',
        errors,
      };
    }

    return {
      valid: true,
      message: 'Todos los productos son validos',
      errors: [],
    };
  }
}