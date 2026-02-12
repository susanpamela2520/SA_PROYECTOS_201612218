import { Injectable, OnModuleInit } from '@nestjs/common';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { join } from 'path';

@Injectable()
export class CatalogGrpcClient implements OnModuleInit {
  private client: any;

  async onModuleInit() {
    const PROTO_PATH = '/app/proto/catalog.proto';
    
    console.log('Intentando cargar proto desde:', PROTO_PATH);

    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
    const catalogProto = protoDescriptor.catalog;

    this.client = new catalogProto.CatalogService(
      process.env.CATALOG_GRPC_URL || 'catalog-service:50052',
      grpc.credentials.createInsecure(),
    );

    console.log('Catalog gRPC Client inicializado:', process.env.CATALOG_GRPC_URL);
  }

  validateProducts(restaurantId: number, products: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log('Enviando a gRPC:', {
        restaurant_id: restaurantId,
        products: products
      });

      this.client.ValidateProducts(
        {
          restaurant_id: restaurantId,
          products: products,
        },
        (error: any, response: any) => {
          if (error) {
            console.error('Error en ValidateProducts:', error);
            reject(error);
          } else {
            console.log('Respuesta de ValidateProducts:', response);
            resolve(response);
          }
        },
      );
    });
  }
}