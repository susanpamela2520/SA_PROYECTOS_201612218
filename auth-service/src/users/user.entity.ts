import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity('usuarios')
@Unique(['email'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ length: 30 })
  rol: string; // CLIENTE | ADMIN | REPARTIDOR | RESTAURANTE

  @Column({ name: 'nombre_completo', length: 255 })
  nombreCompleto: string;

  @Column({ length: 20, nullable: true })
  telefono?: string;
}
