import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Reservation } from './reservation.entity';
import { TrayBorrowRecord } from './tray-borrow-record.entity';
import { CleaningRecord } from './cleaning-record.entity';
import { ViolationRecord } from './violation-record.entity';

export enum UserRole {
  RESIDENT = 'resident',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, unique: true })
  phone: string;

  @Column({ length: 100, unique: true, nullable: true })
  email: string;

  @Column({ length: 50, nullable: true })
  apartmentNumber: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.RESIDENT,
  })
  role: UserRole;

  @Column({ default: 0 })
  violationCount: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Reservation, (reservation) => reservation.user)
  reservations: Reservation[];

  @OneToMany(() => TrayBorrowRecord, (record) => record.user)
  trayBorrowRecords: TrayBorrowRecord[];

  @OneToMany(() => CleaningRecord, (record) => record.user)
  cleaningRecords: CleaningRecord[];

  @OneToMany(() => ViolationRecord, (record) => record.user)
  violationRecords: ViolationRecord[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
