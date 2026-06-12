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

export enum CleaningPhase {
  BEFORE = 'before',
  AFTER = 'after',
}

@Entity('cleaning_records')
export class CleaningRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  reservationId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: CleaningPhase,
  })
  phase: CleaningPhase;

  @Column({ type: 'text' })
  notes: string;

  @Column({ type: 'text', nullable: true })
  photoUrls: string;

  @Column({ type: 'int', nullable: true })
  score: number;

  @Column({ type: 'text', nullable: true })
  scoreNote: string;

  @Column({ type: 'uuid', nullable: true })
  scoredBy: string;

  @Column({ type: 'timestamp', nullable: true })
  scoredAt: Date;

  @ManyToOne(() => User, (user) => user.cleaningRecords)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Reservation, (reservation) => reservation.cleaningRecords)
  @JoinColumn({ name: 'reservationId' })
  reservation: Reservation;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
