import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Reservation,
  ReservationStatus,
  ViolationRecord,
  User,
  UserRole,
  ActivityRoom,
  Equipment,
  EquipmentStatus,
} from '../../entities';
import {
  ConfirmReservationDto,
  CreateViolationDto,
  ResolveViolationDto,
  UpdateReservationStatusDto,
} from './dto/admin.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('管理员功能')
@Controller('admin')
export class AdminController {
  constructor(
    @InjectRepository(Reservation)
    private reservationRepo: Repository<Reservation>,
    @InjectRepository(ViolationRecord)
    private violationRepo: Repository<ViolationRecord>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(ActivityRoom)
    private roomRepo: Repository<ActivityRoom>,
    @InjectRepository(Equipment)
    private equipmentRepo: Repository<Equipment>,
  ) {}

  @Post('reservations/:id/confirm')
  @ApiOperation({ summary: '确认/拒绝预约' })
  async confirmReservation(
    @Param('id') id: string,
    @Body() dto: ConfirmReservationDto,
  ) {
    const reservation = await this.reservationRepo.findOne({ where: { id } });
    if (!reservation) {
      throw new HttpException('预约不存在', HttpStatus.NOT_FOUND);
    }
    if (reservation.status !== ReservationStatus.PENDING) {
      throw new HttpException(
        '只有待确认状态的预约可审核',
        HttpStatus.BAD_REQUEST,
      );
    }

    reservation.status = dto.status;
    reservation.confirmedBy = dto.confirmedBy;
    reservation.confirmedAt = new Date();
    reservation.adminNote = dto.adminNote || null;

    return this.reservationRepo.save(reservation);
  }

  @Put('reservations/:id/status')
  @ApiOperation({ summary: '更新预约状态(进行中/完成等)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReservationStatusDto,
  ) {
    const reservation = await this.reservationRepo.findOne({ where: { id } });
    if (!reservation) {
      throw new HttpException('预约不存在', HttpStatus.NOT_FOUND);
    }

    const validTransitions: Record<ReservationStatus, ReservationStatus[]> = {
      [ReservationStatus.PENDING]: [ReservationStatus.CONFIRMED, ReservationStatus.REJECTED, ReservationStatus.CANCELLED],
      [ReservationStatus.CONFIRMED]: [ReservationStatus.IN_PROGRESS, ReservationStatus.CANCELLED],
      [ReservationStatus.IN_PROGRESS]: [ReservationStatus.COMPLETED],
      [ReservationStatus.COMPLETED]: [],
      [ReservationStatus.CANCELLED]: [],
      [ReservationStatus.REJECTED]: [],
    };

    const validNext = validTransitions[reservation.status];
    if (!validNext.includes(dto.status)) {
      throw new HttpException(
        `无法从 ${reservation.status} 转换到 ${dto.status}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    reservation.status = dto.status;
    if (dto.status === ReservationStatus.CONFIRMED) {
      reservation.confirmedBy = dto.operatorId;
      reservation.confirmedAt = new Date();
    }
    if (dto.note) {
      reservation.adminNote = dto.note;
    }

    return this.reservationRepo.save(reservation);
  }

  @Post('violations')
  @ApiOperation({ summary: '记录违规情况' })
  async createViolation(@Body() dto: CreateViolationDto) {
    const user = await this.userRepo.findOne({ where: { id: dto.userId } });
    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
    }

    const violation = this.violationRepo.create(dto);
    const saved = await this.violationRepo.save(violation);

    user.violationCount = user.violationCount + 1;
    await this.userRepo.save(user);

    return saved;
  }

  @Get('violations')
  @ApiOperation({ summary: '查询违规记录列表' })
  async getViolations(
    @Query('userId') userId?: string,
    @Query('type') type?: string,
    @Query('severity') severity?: string,
    @Query('isResolved') isResolved?: string,
  ) {
    const query = this.violationRepo
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.user', 'user')
      .leftJoinAndSelect('v.reservation', 'reservation')
      .orderBy('v.createdAt', 'DESC');

    if (userId) query.andWhere('v.userId = :userId', { userId });
    if (type) query.andWhere('v.type = :type', { type });
    if (severity) query.andWhere('v.severity = :severity', { severity });
    if (isResolved !== undefined) {
      query.andWhere('v.isResolved = :isResolved', {
        isResolved: isResolved === 'true',
      });
    }

    return query.getMany();
  }

  @Put('violations/:id/resolve')
  @ApiOperation({ summary: '处理违规记录' })
  async resolveViolation(
    @Param('id') id: string,
    @Body() dto: ResolveViolationDto,
  ) {
    const violation = await this.violationRepo.findOne({ where: { id } });
    if (!violation) {
      throw new HttpException('违规记录不存在', HttpStatus.NOT_FOUND);
    }
    if (violation.isResolved) {
      throw new HttpException('该记录已处理', HttpStatus.BAD_REQUEST);
    }

    violation.isResolved = true;
    violation.resolutionNote = dto.resolutionNote;
    violation.resolutionAction = dto.resolutionAction;

    return this.violationRepo.save(violation);
  }

  @Get('users')
  @ApiOperation({ summary: '查询用户列表' })
  async getUsers(@Query('role') role?: UserRole) {
    const query = this.userRepo
      .createQueryBuilder('u')
      .orderBy('u.name', 'ASC');
    if (role) query.andWhere('u.role = :role', { role });
    return query.getMany();
  }

  @Get('rooms')
  @ApiOperation({ summary: '查询活动室列表(含设备)' })
  async getRooms() {
    return this.roomRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.equipment', 'equipment')
      .leftJoinAndSelect('equipment.trays', 'trays')
      .orderBy('r.name', 'ASC')
      .getMany();
  }

  @Get('dashboard/stats')
  @ApiOperation({ summary: '获取仪表盘统计数据' })
  async getDashboardStats() {
    const [
      pendingReservations,
      todayReservations,
      totalReservations,
      unresolvedViolations,
      totalUsers,
      totalEquipment,
    ] = await Promise.all([
      this.reservationRepo.count({ where: { status: ReservationStatus.PENDING } }),
      this.reservationRepo.count({
        where: { date: new Date().toISOString().split('T')[0] },
      }),
      this.reservationRepo.count(),
      this.violationRepo.count({ where: { isResolved: false } }),
      this.userRepo.count({ where: { isActive: true } }),
      this.equipmentRepo.count({ where: { status: EquipmentStatus.AVAILABLE } }),
    ]);

    return {
      pendingReservations,
      todayReservations,
      totalReservations,
      unresolvedViolations,
      totalUsers,
      totalEquipment,
    };
  }
}
