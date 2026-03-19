import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { INestApplication } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<INestApplication>(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC, // Comunicación vía gRPC [cite: 38]
    options: {
      package: 'restaurant', // Debe coincidir con el package del .proto
      protoPath: join(__dirname, 'proto/restaurant.proto'), // Ruta al archivo proto
      url: '0.0.0.0:50052', // Puerto del microservicio Auth
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://guest:guest@127.0.0.1:5672'],
      queue: 'orders_queue',
      queueOptions: {
        durable: false,
      },
    },
  });

  // 5. Iniciamos todo
  await app.startAllMicroservices();

  await app.init();
  console.log('Restaurant Microservice is listening on port 50052');
}
bootstrap();
