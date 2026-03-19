import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { INestApplication } from '@nestjs/common';

async function bootstrap() {
  /* const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC, // Comunicación vía gRPC [cite: 38]
      options: {
        package: 'delivery', // Debe coincidir con el package del .proto
        protoPath: join(__dirname, 'proto/delivery.proto'), // Ruta al archivo proto
        url: '0.0.0.0:50054', // Puerto del microservicio Auth
      },
    },
  ); */

  const app = await NestFactory.create<INestApplication>(AppModule);

  // 1. Conexión gRPC original
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'delivery',
      protoPath: join(__dirname, 'proto/delivery.proto'),
      url: '0.0.0.0:50054',
    },
  });

  // 2. NUEVO: Conexión RabbitMQ (Fase 2)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [
        process.env.RABBITMQ_URL || 'amqp://admin:123456@rabbitmq-service:5672',
      ],
      queue: 'delivery_queue', // La cola que creamos en el Order Service
      queueOptions: { durable: false },
    },
  });

  await app.startAllMicroservices();
  await app.init();
  console.log('delivery Microservice is listening on port 50054');
}
bootstrap();
