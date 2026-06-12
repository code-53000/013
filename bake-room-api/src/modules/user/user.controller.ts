import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../entities';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsPhoneNumber } from 'class-validator';

class CreateUserDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() phone: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() apartmentNumber?: string;
  @IsOptional() @IsEnum(UserRole) role?: UserRole;
}

@ApiTags('用户管理')
@Controller('users')
export class UserController {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  @Post('login')
  @ApiOperation({ summary: '通过手机号登录/注册' })
  async loginOrRegister(@Body() body: { phone: string; name?: string }) {
    if (!body.phone) {
      throw new HttpException('请提供手机号', HttpStatus.BAD_REQUEST);
    }
    let user = await this.userRepo.findOne({ where: { phone: body.phone } });
    if (!user) {
      if (!body.name) {
        throw new HttpException(
          { needRegister: true, message: '新用户请提供姓名' },
          HttpStatus.NOT_FOUND,
        );
      }
      user = this.userRepo.create({
        phone: body.phone,
        name: body.name,
        role: UserRole.RESIDENT,
      });
      user = await this.userRepo.save(user);
    }
    return user;
  }

  @Get(':id')
  @ApiOperation({ summary: '查询用户详情' })
  async findOne(@Param('id') id: string) {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.reservations', 'reservations')
      .leftJoinAndSelect('u.violationRecords', 'violationRecords')
      .where('u.id = :id', { id })
      .orderBy('reservations.date', 'DESC')
      .addOrderBy('violationRecords.createdAt', 'DESC')
      .getOne();
    if (!user) throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
    return user;
  }

  @Post()
  @ApiOperation({ summary: '创建用户' })
  async create(@Body() dto: CreateUserDto) {
    const existing = await this.userRepo.findOne({ where: { phone: dto.phone } });
    if (existing) {
      throw new HttpException('该手机号已注册', HttpStatus.BAD_REQUEST);
    }
    const user = this.userRepo.create({ ...dto, role: dto.role || UserRole.RESIDENT });
    return this.userRepo.save(user);
  }
}
