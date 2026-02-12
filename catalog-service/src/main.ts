import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'catalog',
      protoPath: '/app/proto/catalog.proto',
      url: `0.0.0.0:${process.env.GRPC_PORT || 50052}`,
    },
  });

  await app.listen();
  console.log('✅ Catalog-Service gRPC listening on port', process.env.GRPC_PORT || 50052);
}
bootstrap();