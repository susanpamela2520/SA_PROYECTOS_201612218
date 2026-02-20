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

  @OneToMany(() => MenuItem, (menuItem) => menuItem.restaurant)
  menu: MenuItem[];
}
