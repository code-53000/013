import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CleaningRecord,
  CleaningPhase,
  Reservation,
  ReservationStatus,
  User,
} from '../../entities';

export interface CleaningSubmitInput {
  reservationId: string;
  userId: string;
  phase: CleaningPhase;
  notes: string;
  photoUrls?: string;
}

export interface CleaningScoreInput {
  cleaningRecordId: string;
  scoredBy: string;
  score: number;
  scoreNote?: string;
}

export interface ScoreResult {
  success: boolean;
  score?: number;
  errors?: string[];
}

export interface UserCleaningStats {
  userId: string;
  totalRecords: number;
  averageScore: number;
  latestScore: number;
  scoreDistribution: Record<number, number>;
}

@Injectable()
export class CleaningScoreService {
  constructor(
    @InjectRepository(CleaningRecord)
    private cleaningRepo: Repository<CleaningRecord>,
    @InjectRepository(Reservation)
    private reservationRepo: Repository<Reservation>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async submit(input: CleaningSubmitInput): Promise<{ success: boolean; record?: CleaningRecord; error?: string }> {
    const reservation = await this.reservationRepo.findOne({
      where: { id: input.reservationId },
    });
    if (!reservation) {
      return { success: false, error: '预约不存在' };
    }
    if (reservation.userId !== input.userId) {
      return { success: false, error: '只能为本人预约提交清洁记录' };
    }

    const existing = await this.cleaningRepo.findOne({
      where: {
        reservationId: input.reservationId,
        userId: input.userId,
        phase: input.phase,
      },
    });
    if (existing) {
      existing.notes = input.notes;
      existing.photoUrls = input.photoUrls;
      const saved = await this.cleaningRepo.save(existing);
      return { success: true, record: saved };
    }

    const record = this.cleaningRepo.create(input);
    const saved = await this.cleaningRepo.save(record);
    return { success: true, record: saved };
  }

  async score(input: CleaningScoreInput): Promise<ScoreResult> {
    const errors: string[] = [];

    if (input.score < 0 || input.score > 10) {
      errors.push('评分必须在 0-10 之间');
    }
    if (!Number.isInteger(input.score)) {
      errors.push('评分必须是整数');
    }
    if (errors.length > 0) {
      return { success: false, errors };
    }

    const record = await this.cleaningRepo.findOne({
      where: { id: input.cleaningRecordId },
    });
    if (!record) {
      return { success: false, errors: ['清洁记录不存在'] };
    }
    if (record.phase !== CleaningPhase.AFTER) {
      return { success: false, errors: ['只能对使用后清洁记录进行评分'] };
    }
    if (record.score !== null && record.score !== undefined) {
      return { success: false, errors: ['该记录已评分，不可重复评分'] };
    }

    record.score = input.score;
    record.scoreNote = input.scoreNote;
    record.scoredBy = input.scoredBy;
    record.scoredAt = new Date();
    const saved = await this.cleaningRepo.save(record);

    const needsWarning = this.autoFlagViolation(saved);
    if (needsWarning) {
      return {
        success: true,
        score: saved.score,
        errors: ['清洁评分过低，建议记录违规'],
      };
    }

    return { success: true, score: saved.score };
  }

  private autoFlagViolation(record: CleaningRecord): boolean {
    if (record.score <= 3) {
      return true;
    }
    return false;
  }

  async getReservationCleaningRecords(
    reservationId: string,
  ): Promise<CleaningRecord[]> {
    return this.cleaningRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.user', 'user')
      .where('c.reservationId = :reservationId', { reservationId })
      .orderBy('c.phase', 'ASC')
      .addOrderBy('c.createdAt', 'ASC')
      .getMany();
  }

  async getUserCleaningStats(userId: string): Promise<UserCleaningStats> {
    const records = await this.cleaningRepo
      .createQueryBuilder('c')
      .where('c.userId = :userId', { userId })
      .andWhere('c.phase = :phase', { phase: CleaningPhase.AFTER })
      .andWhere('c.score IS NOT NULL')
      .orderBy('c.createdAt', 'DESC')
      .getMany();

    const distribution: Record<number, number> = {};
    let total = 0;
    records.forEach((r) => {
      const s = r.score as number;
      distribution[s] = (distribution[s] || 0) + 1;
      total += s;
    });

    return {
      userId,
      totalRecords: records.length,
      averageScore: records.length > 0 ? total / records.length : 0,
      latestScore: records.length > 0 ? records[0].score : 0,
      scoreDistribution: distribution,
    };
  }

  async getAllCleaningRecords(filters?: {
    startDate?: string;
    endDate?: string;
    onlyScored?: boolean;
    onlyUnscored?: boolean;
  }): Promise<CleaningRecord[]> {
    const query = this.cleaningRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.user', 'user')
      .leftJoinAndSelect('c.reservation', 'reservation')
      .orderBy('c.createdAt', 'DESC');

    if (filters?.startDate) {
      query.andWhere('c.createdAt >= :startDate', { startDate: filters.startDate });
    }
    if (filters?.endDate) {
      query.andWhere('c.createdAt <= :endDate', { endDate: filters.endDate });
    }
    if (filters?.onlyScored) {
      query.andWhere('c.score IS NOT NULL');
    }
    if (filters?.onlyUnscored) {
      query.andWhere('c.score IS NULL AND c.phase = :phase', {
        phase: CleaningPhase.AFTER,
      });
    }

    return query.getMany();
  }
}
