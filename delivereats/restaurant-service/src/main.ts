import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC, // Comunicación vía gRPC [cite: 38]
      options: {
        package: 'restaurant', // Debe coincidir con el package del .proto
        protoPath: join(__dirname, 'proto/restaurant.proto'), // Ruta al archivo proto
        url: '0.0.0.0:50052', // Puerto del microservicio Auth
      },
    },
  );

  await app.listen();
  console.log('Restaurant Microservice is listening on port 50052');
}
bootstrap();
