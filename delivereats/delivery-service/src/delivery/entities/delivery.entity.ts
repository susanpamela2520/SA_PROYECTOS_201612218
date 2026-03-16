import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('deliveries')
export class Delivery {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderId: number; // Referencia a la orden (sin FK porque es microservicio)

  @Column()
  driverId: number; // ID del repartidor que la tomó

  @Column({ default: 'En_camino' })
  status: string; // EN_CAMINO, ENTREGADO, CANCELADO

  @CreateDateColumn()
  startTime: Date;

  @Column({ nullable: true }) // Es null al principio, se llena al entregar
  proofOfDelivery: string;

  @Column({ type: 'int', nullable: true })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @UpdateDateColumn()
  endTime: Date;
}
