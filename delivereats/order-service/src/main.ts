import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'order', // Debe coincidir con el package del .proto
        protoPath: join(__dirname, 'proto/order.proto'),
        url: '0.0.0.0:50053', // <--- PUERTO 50053 (Diferente a Auth y Restaurant)
      },
    },
  );
  await app.listen();
  console.log('Order Microservice is running on port 50053');
}
bootstrap();