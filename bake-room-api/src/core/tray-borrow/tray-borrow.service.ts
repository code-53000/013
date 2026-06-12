import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Tray,
  TrayBorrowRecord,
  TrayStatus,
  BorrowStatus,
  Reservation,
  ReservationStatus,
} from '../../entities';

export interface BorrowInput {
  userId: string;
  trayIds: string[];
  reservationId?: string;
  conditionAtBorrow?: string;
}

export interface ReturnInput {
  borrowRecordIds: string[];
  conditionAtReturn: string;
}

export interface BorrowResult {
  success: boolean;
  records?: TrayBorrowRecord[];
  errors?: string[];
}

@Injectable()
export class TrayBorrowService {
  constructor(
    @InjectRepository(Tray)
    private trayRepo: Repository<Tray>,
    @InjectRepository(TrayBorrowRecord)
    private borrowRepo: Repository<TrayBorrowRecord>,
    @InjectRepository(Reservation)
    private reservationRepo: Repository<Reservation>,
  ) {}

  async borrow(input: BorrowInput): Promise<BorrowResult> {
    const errors: string[] = [];
    const records: TrayBorrowRecord[] = [];

    if (input.reservationId) {
      const reservation = await this.reservationRepo.findOne({
        where: { id: input.reservationId },
      });
      if (!reservation) {
        return { success: false, errors: ['预约不存在'] };
      }
      if (
        reservation.status !== ReservationStatus.CONFIRMED &&
        reservation.status !== ReservationStatus.IN_PROGRESS
      ) {
        return {
          success: false,
          errors: ['只有已确认或进行中的预约才能借用烤盘'],
        };
      }
      if (reservation.userId !== input.userId) {
        return { success: false, errors: ['只能借用本人预约的烤盘'] };
      }
    }

    const dueReturnAt = new Date();
    dueReturnAt.setHours(dueReturnAt.getHours() + 4);

    for (const trayId of input.trayIds) {
      const tray = await this.trayRepo.findOne({ where: { id: trayId } });
      if (!tray) {
        errors.push(`烤盘不存在：${trayId}`);
        continue;
      }
      if (tray.status !== TrayStatus.AVAILABLE) {
        errors.push(`烤盘不可用：${tray.trayNumber}（当前状态：${tray.status}）`);
        continue;
      }

      tray.status = TrayStatus.BORROWED;
      await this.trayRepo.save(tray);

      const record = this.borrowRepo.create({
        userId: input.userId,
        trayId: tray.id,
        reservationId: input.reservationId || null,
        borrowedAt: new Date(),
        dueReturnAt,
        status: BorrowStatus.BORROWED,
        conditionAtBorrow: input.conditionAtBorrow || '完好',
      });
      records.push(await this.borrowRepo.save(record));
    }

    if (errors.length > 0 && records.length === 0) {
      return { success: false, errors };
    }

    return { success: true, records, errors };
  }

  async return(input: ReturnInput): Promise<BorrowResult> {
    const errors: string[] = [];
    const records: TrayBorrowRecord[] = [];

    for (const recordId of input.borrowRecordIds) {
      const record = await this.borrowRepo.findOne({
        where: { id: recordId },
        relations: ['tray'],
      });
      if (!record) {
        errors.push(`借还记录不存在：${recordId}`);
        continue;
      }
      if (record.status !== BorrowStatus.BORROWED && record.status !== BorrowStatus.OVERDUE) {
        errors.push(`该记录已归还或已丢失：${recordId}`);
        continue;
      }

      record.returnedAt = new Date();
      record.conditionAtReturn = input.conditionAtReturn;
      record.status = BorrowStatus.RETURNED;
      records.push(await this.borrowRepo.save(record));

      if (record.tray) {
        record.tray.status = TrayStatus.AVAILABLE;
        await this.trayRepo.save(record.tray);
      }
    }

    if (errors.length > 0 && records.length === 0) {
      return { success: false, errors };
    }

    return { success: true, records, errors };
  }

  async markLost(borrowRecordId: string): Promise<{ success: boolean; error?: string }> {
    const record = await this.borrowRepo.findOne({
      where: { id: borrowRecordId },
      relations: ['tray'],
    });
    if (!record) {
      return { success: false, error: '借还记录不存在' };
    }
    if (record.status === BorrowStatus.RETURNED || record.status === BorrowStatus.LOST) {
      return { success: false, error: '该记录状态不允许标记为丢失' };
    }

    record.status = BorrowStatus.LOST;
    await this.borrowRepo.save(record);

    if (record.tray) {
      record.tray.status = TrayStatus.LOST;
      await this.trayRepo.save(record.tray);
    }

    return { success: true };
  }

  async checkOverdue(): Promise<TrayBorrowRecord[]> {
    const now = new Date();
    const overdueRecords = await this.borrowRepo
      .createQueryBuilder('r')
      .where('r.status = :status', { status: BorrowStatus.BORROWED })
      .andWhere('r.dueReturnAt < :now', { now })
      .getMany();

    for (const record of overdueRecords) {
      record.status = BorrowStatus.OVERDUE;
      await this.borrowRepo.save(record);
    }

    return overdueRecords;
  }

  async getUserBorrows(userId: string, activeOnly = false): Promise<TrayBorrowRecord[]> {
    const query = this.borrowRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.tray', 'tray')
      .where('r.userId = :userId', { userId });

    if (activeOnly) {
      query.andWhere('r.status IN (:...statuses)', {
        statuses: [BorrowStatus.BORROWED, BorrowStatus.OVERDUE],
      });
    }

    query.orderBy('r.borrowedAt', 'DESC');
    return query.getMany();
  }

  async getAvailableTrays(equipmentId?: string): Promise<Tray[]> {
    const query = this.trayRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.equipment', 'equipment')
      .where('t.status = :status', { status: TrayStatus.AVAILABLE });

    if (equipmentId) {
      query.andWhere('t.equipmentId = :equipmentId', { equipmentId });
    }

    return query.getMany();
  }
}
