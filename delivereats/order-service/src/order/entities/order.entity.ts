import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
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

  @Column({ default: 'Pendiente' })
  status: string; // PENDING, PREPARING, READY, DELIVERED

  @CreateDateColumn()
  createdAt: Date;

  @Column({ name: 'restaurantName', nullable: true })
  restaurantName: string;

  @Column({ type: 'text', nullable: true }) // 'text' porque el Base64 es largo
  proofOfDelivery: string;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'int', nullable: true })
  rating: number;

  @Column({ type: 'int', nullable: true })
  deliveryRating: number;

  @Column({ type: 'text', nullable: true })
  deliveryComment: string;

  // Relación: Una orden tiene muchos items
  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];
}
