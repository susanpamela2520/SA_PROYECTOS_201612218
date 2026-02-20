import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Restaurant } from './restaurant.entity';

@Entity()
export class MenuItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column('decimal') // Usamos decimal para dinero
  price: number;

  @Column()
  restaurantId: number; // Guardamos el ID para consultas rápidas

  // Relación: Muchos items pertenecen a un restaurante
  @ManyToOne(() => Restaurant, (restaurant) => restaurant.menu, {
    onDelete: 'CASCADE',
  })
  restaurant: Restaurant;
}
