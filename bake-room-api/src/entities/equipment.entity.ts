import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ActivityRoom } from './activity-room.entity';
import { Tray } from './tray.entity';
import { Reservation } from './reservation.entity';

export enum EquipmentStatus {
  AVAILABLE = 'available',
  IN_USE = 'in_use',
  MAINTENANCE = 'maintenance',
  RETIRED = 'retired',
}

@Entity('equipment')
export class Equipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50 })
  model: string;

  @Column({ length: 200, nullable: true })
  serialNumber: string;

  @Column({
    type: 'enum',
    enum: EquipmentStatus,
    default: EquipmentStatus.AVAILABLE,
  })
  status: EquipmentStatus;

  @Column({ type: 'uuid' })
  roomId: string;

  @ManyToOne(() => ActivityRoom, (room) => room.equipment)
  @JoinColumn({ name: 'roomId' })
  room: ActivityRoom;

  @OneToMany(() => Tray, (tray) => tray.equipment)
  trays: Tray[];

  @OneToMany(() => Reservation, (reservation) => reservation.equipment)
  reservations: Reservation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
