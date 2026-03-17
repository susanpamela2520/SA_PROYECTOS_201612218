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
        package: 'payment', // Debe coincidir con el package del .proto
        protoPath: join(__dirname, 'proto/payment.proto'), // Ruta al archivo proto
        url: '0.0.0.0:50055', // Puerto del microservicio Auth
      },
    },
  ); */

  const app = await NestFactory.create<INestApplication>(AppModule);

  // 1. Conexión gRPC para recibir peticiones del Gateway
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'payment',
      protoPath: join(__dirname, 'proto/payment.proto'),
      url: '0.0.0.0:50055', // Puerto exclusivo para Pagos
    },
  });

  // 2. Conexión RabbitMQ para escuchar reembolsos
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://guest:guest@127.0.0.1:5672'],
      queue: 'payment_queue',
      queueOptions: { durable: false },
    },
  });

  await app.startAllMicroservices();
  await app.init();
  console.log('Payment Microservice is listening on port 50055');
}
bootstrap();
