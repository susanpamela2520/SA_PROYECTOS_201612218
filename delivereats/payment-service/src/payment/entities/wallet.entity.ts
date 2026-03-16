import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  userId: number; // Cada usuario tiene 1 sola billetera

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  balance: number;

  @UpdateDateColumn()
  lastUpdated: Date;
}
