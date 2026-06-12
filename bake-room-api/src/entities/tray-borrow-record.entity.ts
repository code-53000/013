import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Reservation } from './reservation.entity';
import { Tray } from './tray.entity';

export enum BorrowStatus {
  BORROWED = 'borrowed',
  RETURNED = 'returned',
  OVERDUE = 'overdue',
  LOST = 'lost',
}

@Entity('tray_borrow_records')
export class TrayBorrowRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  trayId: string;

  @Column({ type: 'uuid', nullable: true })
  reservationId: string;

  @Column({ type: 'timestamp' })
  borrowedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  dueReturnAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  returnedAt: Date;

  @Column({
    type: 'enum',
    enum: BorrowStatus,
    default: BorrowStatus.BORROWED,
  })
  status: BorrowStatus;

  @Column({ type: 'text', nullable: true })
  conditionAtBorrow: string;

  @Column({ type: 'text', nullable: true })
  conditionAtReturn: string;

  @ManyToOne(() => User, (user) => user.trayBorrowRecords)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Tray, (tray) => tray.borrowRecords)
  @JoinColumn({ name: 'trayId' })
  tray: Tray;

  @ManyToOne(() => Reservation, (reservation) => reservation.trayBorrowRecords)
  @JoinColumn({ name: 'reservationId' })
  reservation: Reservation;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
