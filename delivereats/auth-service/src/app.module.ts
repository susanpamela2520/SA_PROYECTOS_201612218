import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/user.entity';

@Module({
  imports: [
    // Carga variables del archivo
    ConfigModule.forRoot({ isGlobal: true }),
    // Conexión a Base de Datos
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST_AUTH,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME_AUTH,
      entities: [User],
      synchronize: true, // Solo para desarrollo
      ssl: false,
    }),

    // Importamos el módulo de Auth que creamos en el paso
    AuthModule,
  ],
})
export class AppModule {}
