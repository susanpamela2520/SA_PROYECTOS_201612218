import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
//import { ConfigModule } from '@nestjs/config';  Recomendado para leer .env
import { AuthModule } from './auth/auth.module';
import { User } from './auth/user.entity';

@Module({
  imports: [
    // Carga variables del archivo .env
    /* ConfigModule.forRoot(),  */
    // Conexión a Base de Datos
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '123',
      database: process.env.DB_NAME || 'auth_db',
      entities: [User],
      synchronize: true, // Solo para desarrollo
    }),

    // Importamos el módulo de Auth que creamos en el paso 4
    AuthModule,
  ],
})
export class AppModule {}
