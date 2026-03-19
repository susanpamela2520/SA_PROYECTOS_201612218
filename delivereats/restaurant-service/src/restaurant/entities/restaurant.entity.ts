import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { MenuItem } from './menu-item.entity';

@Entity()
export class Restaurant {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @Column()
  address: string;
  @Column()
  category: string;
  @Column()
  horario: string;
  @Column()
  calificacion: string;
  @Column({ type: 'int', default: 0 })
  ratingCount: number;
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @OneToMany(() => MenuItem, (menuItem) => menuItem.restaurant)
  menu: MenuItem[];
}
