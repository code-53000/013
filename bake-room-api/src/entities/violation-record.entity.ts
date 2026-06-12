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

export enum ViolationType {
  OVERCLEANING = 'overcleaning',
  DIRTY_AFTER_USE = 'dirty_after_use',
  MISSING_TRAY = 'missing_tray',
  DAMAGED_EQUIPMENT = 'damaged_equipment',
  NO_SHOW = 'no_show',
  OVERTIME = 'overtime',
  OTHER = 'other',
}

export enum ViolationSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

@Entity('violation_records')
export class ViolationRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  reservationId: string;

  @Column({ type: 'uuid' })
  reportedBy: string;

  @Column({
    type: 'enum',
    enum: ViolationType,
  })
  type: ViolationType;

  @Column({
    type: 'enum',
    enum: ViolationSeverity,
    default: ViolationSeverity.LOW,
  })
  severity: ViolationSeverity;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  photoUrls: string;

  @Column({ default: false })
  isResolved: boolean;

  @Column({ type: 'text', nullable: true })
  resolutionNote: string;

  @Column({ type: 'text', nullable: true })
  resolutionAction: string;

  @ManyToOne(() => User, (user) => user.violationRecords)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Reservation, (reservation) => reservation.violationRecords)
  @JoinColumn({ name: 'reservationId' })
  reservation: Reservation;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
