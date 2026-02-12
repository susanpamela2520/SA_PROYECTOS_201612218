import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ordenes')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'restaurant_id' })
  restaurantId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column('jsonb')
  productos: any[]; // Array de { product_id, cantidad, precio }

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column({ length: 50, default: 'PENDIENTE' })
  estado: string; // PENDIENTE, CONFIRMADA, EN_CAMINO, ENTREGADA, CANCELADA

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}