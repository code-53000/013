import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Equipment } from './equipment.entity';
import { Reservation } from './reservation.entity';

@Entity('activity_rooms')
export class ActivityRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  location: string;

  @Column({ type: 'int', default: 1 })
  capacity: number;

  @Column({ type: 'time' })
  openTime: string;

  @Column({ type: 'time' })
  closeTime: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Equipment, (equipment) => equipment.room)
  equipment: Equipment[];

  @OneToMany(() => Reservation, (reservation) => reservation.room)
  reservations: Reservation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
