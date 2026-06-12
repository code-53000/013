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
import { Tray, TrayStatus, TrayBorrowRecord, BorrowStatus } from '../../entities';
import { BorrowTrayDto, ReturnTrayDto, CreateTrayDto } from './dto/tray.dto';
import { TrayBorrowService } from '../../core';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('烤盘管理')
@Controller('trays')
export class TrayController {
  constructor(
    @InjectRepository(Tray)
    private trayRepo: Repository<Tray>,
    private trayBorrowService: TrayBorrowService,
  ) {}

  @Get()
  @ApiOperation({ summary: '查询烤盘列表' })
  async findAll(
    @Query('equipmentId') equipmentId?: string,
    @Query('status') status?: TrayStatus,
  ) {
    const query = this.trayRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.equipment', 'equipment')
      .orderBy('t.trayNumber', 'ASC');
    if (equipmentId) query.andWhere('t.equipmentId = :equipmentId', { equipmentId });
    if (status) query.andWhere('t.status = :status', { status });
    return query.getMany();
  }

  @Get('available')
  @ApiOperation({ summary: '查询可借用烤盘' })
  async getAvailable(@Query('equipmentId') equipmentId?: string) {
    return this.trayBorrowService.getAvailableTrays(equipmentId);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询烤盘详情' })
  async findOne(@Param('id') id: string) {
    const tray = await this.trayRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.equipment', 'equipment')
      .leftJoinAndSelect('t.borrowRecords', 'borrowRecords')
      .leftJoinAndSelect('borrowRecords.user', 'user')
      .where('t.id = :id', { id })
      .getOne();
    if (!tray) throw new HttpException('烤盘不存在', HttpStatus.NOT_FOUND);
    return tray;
  }

  @Post()
  @ApiOperation({ summary: '新增烤盘' })
  async create(@Body() dto: CreateTrayDto) {
    const existing = await this.trayRepo.findOne({
      where: { trayNumber: dto.trayNumber, equipmentId: dto.equipmentId },
    });
    if (existing) {
      throw new HttpException('该设备下已有相同编号的烤盘', HttpStatus.BAD_REQUEST);
    }
    const tray = this.trayRepo.create({ ...dto, status: TrayStatus.AVAILABLE });
    return this.trayRepo.save(tray);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新烤盘状态' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: TrayStatus; notes?: string },
  ) {
    const tray = await this.trayRepo.findOne({ where: { id } });
    if (!tray) throw new HttpException('烤盘不存在', HttpStatus.NOT_FOUND);
    tray.status = body.status;
    if (body.notes) tray.notes = body.notes;
    return this.trayRepo.save(tray);
  }

  @Post('borrow')
  @ApiOperation({ summary: '借出烤盘' })
  async borrow(@Body() dto: BorrowTrayDto) {
    const result = await this.trayBorrowService.borrow(dto);
    if (!result.success) {
      throw new HttpException(
        { message: '借用失败', errors: result.errors },
        HttpStatus.BAD_REQUEST,
      );
    }
    return result;
  }

  @Post('return')
  @ApiOperation({ summary: '归还烤盘' })
  async return(@Body() dto: ReturnTrayDto) {
    const result = await this.trayBorrowService.return(dto);
    if (!result.success) {
      throw new HttpException(
        { message: '归还失败', errors: result.errors },
        HttpStatus.BAD_REQUEST,
      );
    }
    return result;
  }

  @Post('borrow-records/:id/lost')
  @ApiOperation({ summary: '标记烤盘丢失' })
  async markLost(@Param('id') id: string) {
    const result = await this.trayBorrowService.markLost(id);
    if (!result.success) {
      throw new HttpException(result.error!, HttpStatus.BAD_REQUEST);
    }
    return { success: true, message: '已标记为丢失' };
  }

  @Get('borrow-records/user/:userId')
  @ApiOperation({ summary: '查询用户借还记录' })
  async getUserBorrows(
    @Param('userId') userId: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.trayBorrowService.getUserBorrows(
      userId,
      activeOnly === 'true',
    );
  }

  @Get('borrow-records/overdue-check')
  @ApiOperation({ summary: '执行借还记录逾期检查' })
  async checkOverdue() {
    return this.trayBorrowService.checkOverdue();
  }
}
