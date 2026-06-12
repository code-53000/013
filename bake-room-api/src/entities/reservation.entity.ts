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
import { Equipment } from './equipment.entity';
import { User } from './user.entity';
import { TrayBorrowRecord } from './tray-borrow-record.entity';
import { CleaningRecord } from './cleaning-record.entity';
import { ViolationRecord } from './violation-record.entity';

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  roomId: string;

  @Column({ type: 'uuid' })
  equipmentId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ length: 200 })
  purpose: string;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @Column({ type: 'text', nullable: true })
  adminNote: string;

  @Column({ type: 'uuid', nullable: true })
  confirmedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt: Date;

  @ManyToOne(() => User, (user) => user.reservations)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => ActivityRoom, (room) => room.reservations)
  @JoinColumn({ name: 'roomId' })
  room: ActivityRoom;

  @ManyToOne(() => Equipment, (equipment) => equipment.reservations)
  @JoinColumn({ name: 'equipmentId' })
  equipment: Equipment;

  @OneToMany(() => TrayBorrowRecord, (record) => record.reservation)
  trayBorrowRecords: TrayBorrowRecord[];

  @OneToMany(() => CleaningRecord, (record) => record.reservation)
  cleaningRecords: CleaningRecord[];

  @OneToMany(() => ViolationRecord, (record) => record.reservation)
  violationRecords: ViolationRecord[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
