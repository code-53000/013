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
import { Equipment } from './equipment.entity';
import { TrayBorrowRecord } from './tray-borrow-record.entity';

export enum TrayStatus {
  AVAILABLE = 'available',
  BORROWED = 'borrowed',
  LOST = 'lost',
  DAMAGED = 'damaged',
}

export enum TraySize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  EXTRA_LARGE = 'extra_large',
}

@Entity('trays')
export class Tray {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  trayNumber: string;

  @Column({
    type: 'enum',
    enum: TraySize,
    default: TraySize.MEDIUM,
  })
  size: TraySize;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  capacity: number;

  @Column({ type: 'uuid' })
  equipmentId: string;

  @Column({
    type: 'enum',
    enum: TrayStatus,
    default: TrayStatus.AVAILABLE,
  })
  status: TrayStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => Equipment, (equipment) => equipment.trays)
  @JoinColumn({ name: 'equipmentId' })
  equipment: Equipment;

  @OneToMany(() => TrayBorrowRecord, (record) => record.tray)
  borrowRecords: TrayBorrowRecord[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
