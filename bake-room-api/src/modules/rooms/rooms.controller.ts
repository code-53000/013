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
  ActivityRoom,
  Equipment,
  EquipmentStatus,
} from '../../entities';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum, Matches, IsInt, Min } from 'class-validator';

class CreateRoomDto {
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() location?: string;
  @IsInt() @Min(1) capacity: number;
  @IsString() @Matches(/^\d{2}:\d{2}$/) openTime: string;
  @IsString() @Matches(/^\d{2}:\d{2}$/) closeTime: string;
}

class CreateEquipmentDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() model: string;
  @IsOptional() @IsString() serialNumber?: string;
  @IsUUID() roomId: string;
  @IsOptional() @IsEnum(EquipmentStatus) status?: EquipmentStatus;
}

@ApiTags('活动室与设备')
@Controller('rooms-and-equipment')
export class PublicRoomController {
  constructor(
    @InjectRepository(ActivityRoom)
    private roomRepo: Repository<ActivityRoom>,
    @InjectRepository(Equipment)
    private equipmentRepo: Repository<Equipment>,
  ) {}

  @Get('rooms')
  @ApiOperation({ summary: '查询所有活动室' })
  async getRooms() {
    return this.roomRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
      relations: ['equipment', 'equipment.trays'],
    });
  }

  @Get('rooms/:id')
  @ApiOperation({ summary: '查询活动室详情(含设备)' })
  async getRoom(@Param('id') id: string) {
    const room = await this.roomRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.equipment', 'e')
      .leftJoinAndSelect('e.trays', 't')
      .where('r.id = :id', { id })
      .getOne();
    if (!room) throw new HttpException('活动室不存在', HttpStatus.NOT_FOUND);
    return room;
  }

  @Get('equipment')
  @ApiOperation({ summary: '查询所有设备' })
  async getEquipment(@Query('roomId') roomId?: string) {
    const query = this.equipmentRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.room', 'room')
      .leftJoinAndSelect('e.trays', 'trays')
      .orderBy('e.name', 'ASC');
    if (roomId) query.andWhere('e.roomId = :roomId', { roomId });
    return query.getMany();
  }
}
