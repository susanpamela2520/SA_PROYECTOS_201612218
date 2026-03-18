import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
/* import { INestApplication } from '@nestjs/common'; */

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC, // Comunicación vía gRPC [cite: 38]
      options: {
        package: 'fx', // Debe coincidir con el package del .proto
        protoPath: join(__dirname, 'proto/fx.proto'), // Ruta al archivo proto
        url: '0.0.0.0:50056', // Puerto del microservicio Auth
      },
    },
  );

  await app.listen();
  console.log('fx Microservice is listening on port 50056');
}
bootstrap();
