import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn } from 'typeorm';
import { OrderItem } from './order-item.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number; // ID del cliente (viene del Auth)

  @Column()
  restaurantId: number; // ID del restaurante

  @Column('decimal', { precision: 10, scale: 2 }) // Decimal para dinero
  total: number;

  @Column({ default: 'PENDING' }) 
  status: string; // PENDING, PREPARING, READY, DELIVERED

  @CreateDateColumn()
  createdAt: Date;

  // Relación: Una orden tiene muchos items
  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];
}