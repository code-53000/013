import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Not } from 'typeorm';
import { Reservation, ReservationStatus } from '../../entities';

export interface ConflictCheckInput {
  equipmentId: string;
  date: string;
  startTime: string;
  endTime: string;
  excludeReservationId?: string;
}

export interface ConflictResult {
  hasConflict: boolean;
  conflictingReservations: Reservation[];
  conflicts: Array<{
    type: string;
    message: string;
  }>;
}

@Injectable()
export class SlotConflictService {
  constructor(
    @InjectRepository(Reservation)
    private reservationRepo: Repository<Reservation>,
  ) {}

  async checkConflict(input: ConflictCheckInput): Promise<ConflictResult> {
    const conflicts: Array<{ type: string; message: string }> = [];
    const result: ConflictResult = {
      hasConflict: false,
      conflictingReservations: [],
      conflicts,
    };

    if (!this.isValidTimeRange(input.startTime, input.endTime)) {
      conflicts.push({
        type: 'INVALID_TIME_RANGE',
        message: '结束时间必须晚于开始时间',
      });
      result.hasConflict = true;
      return result;
    }

    if (!this.isWithinMinBlock(input.startTime, input.endTime)) {
      conflicts.push({
        type: 'BLOCK_TOO_SHORT',
        message: '预约时段至少为30分钟',
      });
      result.hasConflict = true;
      return result;
    }

    if (!this.isValidBlockInterval(input.startTime, input.endTime)) {
      conflicts.push({
        type: 'INVALID_INTERVAL',
        message: '预约时段必须以30分钟为单位',
      });
      result.hasConflict = true;
      return result;
    }

    const overlapping = await this.findOverlappingReservations(input);

    if (overlapping.length > 0) {
      result.conflictingReservations = overlapping;
      result.hasConflict = true;
      overlapping.forEach((res) => {
        conflicts.push({
          type: 'TIME_OVERLAP',
          message: `时段与现有预约冲突：${res.date} ${res.startTime}-${res.endTime}（状态：${res.status}）`,
        });
      });
    }

    return result;
  }

  private async findOverlappingReservations(
    input: ConflictCheckInput,
  ): Promise<Reservation[]> {
    const queryBuilder = this.reservationRepo
      .createQueryBuilder('r')
      .where('r.equipmentId = :equipmentId', { equipmentId: input.equipmentId })
      .andWhere('r.date = :date', { date: input.date })
      .andWhere(
        'r.status IN (:...statuses)',
        {
          statuses: [
            ReservationStatus.PENDING,
            ReservationStatus.CONFIRMED,
            ReservationStatus.IN_PROGRESS,
          ],
        },
      )
      .andWhere('r.startTime < :endTime', { endTime: input.endTime })
      .andWhere('r.endTime > :startTime', { startTime: input.startTime });

    if (input.excludeReservationId) {
      queryBuilder.andWhere('r.id != :excludeId', {
        excludeId: input.excludeReservationId,
      });
    }

    return queryBuilder.getMany();
  }

  async getAvailableSlots(
    equipmentId: string,
    date: string,
    openTime: string,
    closeTime: string,
  ): Promise<
    Array<{
      startTime: string;
      endTime: string;
      available: boolean;
      reservation?: Reservation;
    }>
  > {
    const slots: Array<{
      startTime: string;
      endTime: string;
      available: boolean;
      reservation?: Reservation;
    }> = [];

    const booked = await this.reservationRepo
      .createQueryBuilder('r')
      .where('r.equipmentId = :equipmentId', { equipmentId })
      .andWhere('r.date = :date', { date })
      .andWhere(
        'r.status IN (:...statuses)',
        {
          statuses: [
            ReservationStatus.PENDING,
            ReservationStatus.CONFIRMED,
            ReservationStatus.IN_PROGRESS,
          ],
        },
      )
      .getMany();

    let current = openTime;
    while (this.timeToMinutes(current) < this.timeToMinutes(closeTime)) {
      const end = this.minutesToTime(this.timeToMinutes(current) + 30);
      if (this.timeToMinutes(end) > this.timeToMinutes(closeTime)) break;

      const overlap = booked.find(
        (r) =>
          this.timeToMinutes(r.startTime) < this.timeToMinutes(end) &&
          this.timeToMinutes(r.endTime) > this.timeToMinutes(current),
      );

      slots.push({
        startTime: current,
        endTime: end,
        available: !overlap,
        reservation: overlap,
      });

      current = end;
    }

    return slots;
  }

  private isValidTimeRange(start: string, end: string): boolean {
    return this.timeToMinutes(end) > this.timeToMinutes(start);
  }

  private isWithinMinBlock(start: string, end: string): boolean {
    const duration = this.timeToMinutes(end) - this.timeToMinutes(start);
    return duration >= 30;
  }

  private isValidBlockInterval(start: string, end: string): boolean {
    const sMin = this.timeToMinutes(start);
    const eMin = this.timeToMinutes(end);
    return sMin % 30 === 0 && eMin % 30 === 0;
  }

  timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  minutesToTime(min: number): string {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  validateOperatingHours(
    startTime: string,
    endTime: string,
    openTime: string,
    closeTime: string,
  ): { valid: boolean; message?: string } {
    const s = this.timeToMinutes(startTime);
    const e = this.timeToMinutes(endTime);
    const open = this.timeToMinutes(openTime);
    const close = this.timeToMinutes(closeTime);

    if (s < open) {
      return { valid: false, message: `开始时间早于开放时间（${openTime}）` };
    }
    if (e > close) {
      return { valid: false, message: `结束时间晚于关闭时间（${closeTime}）` };
    }
    return { valid: true };
  }
}
