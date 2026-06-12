import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Reservation,
  ReservationStatus,
  ActivityRoom,
  Equipment,
} from '../../entities';
import { CreateReservationDto, UpdateReservationDto } from './dto/reservation.dto';
import { SlotConflictService } from '../../core';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('预约管理')
@Controller('reservations')
export class ReservationController {
  constructor(
    @InjectRepository(Reservation)
    private reservationRepo: Repository<Reservation>,
    @InjectRepository(ActivityRoom)
    private roomRepo: Repository<ActivityRoom>,
    @InjectRepository(Equipment)
    private equipmentRepo: Repository<Equipment>,
    private slotConflictService: SlotConflictService,
  ) {}

  @Get()
  @ApiOperation({ summary: '查询预约列表' })
  async findAll(
    @Query('userId') userId?: string,
    @Query('roomId') roomId?: string,
    @Query('equipmentId') equipmentId?: string,
    @Query('date') date?: string,
    @Query('status') status?: ReservationStatus,
  ) {
    const query = this.reservationRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'user')
      .leftJoinAndSelect('r.room', 'room')
      .leftJoinAndSelect('r.equipment', 'equipment')
      .orderBy('r.date', 'DESC')
      .addOrderBy('r.startTime', 'ASC');

    if (userId) query.andWhere('r.userId = :userId', { userId });
    if (roomId) query.andWhere('r.roomId = :roomId', { roomId });
    if (equipmentId) query.andWhere('r.equipmentId = :equipmentId', { equipmentId });
    if (date) query.andWhere('r.date = :date', { date });
    if (status) query.andWhere('r.status = :status', { status });

    return query.getMany();
  }

  @Get(':id')
  @ApiOperation({ summary: '查询预约详情' })
  async findOne(@Param('id') id: string) {
    const reservation = await this.reservationRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'user')
      .leftJoinAndSelect('r.room', 'room')
      .leftJoinAndSelect('r.equipment', 'equipment')
      .leftJoinAndSelect('r.trayBorrowRecords', 'trayBorrowRecords')
      .leftJoinAndSelect('trayBorrowRecords.tray', 'tray')
      .leftJoinAndSelect('r.cleaningRecords', 'cleaningRecords')
      .leftJoinAndSelect('r.violationRecords', 'violationRecords')
      .where('r.id = :id', { id })
      .getOne();

    if (!reservation) {
      throw new HttpException('预约不存在', HttpStatus.NOT_FOUND);
    }
    return reservation;
  }

  @Post()
  @ApiOperation({ summary: '提交预约申请' })
  async create(@Body() dto: CreateReservationDto) {
    const [room, equipment] = await Promise.all([
      this.roomRepo.findOne({ where: { id: dto.roomId } }),
      this.equipmentRepo.findOne({ where: { id: dto.equipmentId } }),
    ]);

    if (!room) throw new HttpException('活动室不存在', HttpStatus.NOT_FOUND);
    if (!equipment) throw new HttpException('设备不存在', HttpStatus.NOT_FOUND);
    if (equipment.roomId !== dto.roomId) {
      throw new HttpException('设备不在该活动室内', HttpStatus.BAD_REQUEST);
    }

    const hoursCheck = this.slotConflictService.validateOperatingHours(
      dto.startTime,
      dto.endTime,
      room.openTime,
      room.closeTime,
    );
    if (!hoursCheck.valid) {
      throw new HttpException(hoursCheck.message!, HttpStatus.BAD_REQUEST);
    }

    const conflict = await this.slotConflictService.checkConflict({
      equipmentId: dto.equipmentId,
      date: dto.date,
      startTime: dto.startTime,
      endTime: dto.endTime,
    });
    if (conflict.hasConflict) {
      throw new HttpException(
        {
          message: '存在时段冲突',
          conflicts: conflict.conflicts,
          conflictingReservations: conflict.conflictingReservations,
        },
        HttpStatus.CONFLICT,
      );
    }

    const today = new Date().toISOString().split('T')[0];
    if (dto.date < today) {
      throw new HttpException('不能预约过去的日期', HttpStatus.BAD_REQUEST);
    }

    const reservation = this.reservationRepo.create({
      ...dto,
      status: ReservationStatus.PENDING,
    });
    return this.reservationRepo.save(reservation);
  }

  @Put(':id')
  @ApiOperation({ summary: '修改预约（仅待确认状态）' })
  async update(@Param('id') id: string, @Body() dto: UpdateReservationDto) {
    const reservation = await this.reservationRepo.findOne({ where: { id } });
    if (!reservation) {
      throw new HttpException('预约不存在', HttpStatus.NOT_FOUND);
    }
    if (reservation.status !== ReservationStatus.PENDING) {
      throw new HttpException('只有待确认状态的预约可修改', HttpStatus.BAD_REQUEST);
    }

    const newDate = dto.date || reservation.date;
    const newStart = dto.startTime || reservation.startTime;
    const newEnd = dto.endTime || reservation.endTime;

    if (dto.date || dto.startTime || dto.endTime) {
      const room = await this.roomRepo.findOne({ where: { id: reservation.roomId } });
      const hoursCheck = this.slotConflictService.validateOperatingHours(
        newStart,
        newEnd,
        room.openTime,
        room.closeTime,
      );
      if (!hoursCheck.valid) {
        throw new HttpException(hoursCheck.message!, HttpStatus.BAD_REQUEST);
      }

      const conflict = await this.slotConflictService.checkConflict({
        equipmentId: reservation.equipmentId,
        date: newDate,
        startTime: newStart,
        endTime: newEnd,
        excludeReservationId: id,
      });
      if (conflict.hasConflict) {
        throw new HttpException(
          {
            message: '存在时段冲突',
            conflicts: conflict.conflicts,
          },
          HttpStatus.CONFLICT,
        );
      }
    }

    Object.assign(reservation, dto);
    return this.reservationRepo.save(reservation);
  }

  @Delete(':id')
  @ApiOperation({ summary: '取消预约' })
  async cancel(@Param('id') id: string) {
    const reservation = await this.reservationRepo.findOne({ where: { id } });
    if (!reservation) {
      throw new HttpException('预约不存在', HttpStatus.NOT_FOUND);
    }
    if (
      reservation.status === ReservationStatus.COMPLETED ||
      reservation.status === ReservationStatus.CANCELLED ||
      reservation.status === ReservationStatus.REJECTED
    ) {
      throw new HttpException('当前状态的预约不可取消', HttpStatus.BAD_REQUEST);
    }
    reservation.status = ReservationStatus.CANCELLED;
    return this.reservationRepo.save(reservation);
  }

  @Get('rooms/:roomId/equipment/:equipmentId/slots')
  @ApiOperation({ summary: '查询指定设备的可用时段' })
  async getAvailableSlots(
    @Param('roomId') roomId: string,
    @Param('equipmentId') equipmentId: string,
    @Query('date') date: string,
  ) {
    if (!date) {
      throw new HttpException('请指定查询日期', HttpStatus.BAD_REQUEST);
    }
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) throw new HttpException('活动室不存在', HttpStatus.NOT_FOUND);
    const equipment = await this.equipmentRepo.findOne({ where: { id: equipmentId } });
    if (!equipment) throw new HttpException('设备不存在', HttpStatus.NOT_FOUND);

    const slots = await this.slotConflictService.getAvailableSlots(
      equipmentId,
      date,
      room.openTime,
      room.closeTime,
    );
    return { room, equipment, date, slots };
  }
}
