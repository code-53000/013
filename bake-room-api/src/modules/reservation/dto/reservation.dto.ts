import { IsString, IsUUID, IsNotEmpty, Matches, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty({ description: '用户ID' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: '活动室ID' })
  @IsUUID()
  @IsNotEmpty()
  roomId: string;

  @ApiProperty({ description: '设备ID' })
  @IsUUID()
  @IsNotEmpty()
  equipmentId: string;

  @ApiProperty({ description: '预约日期 YYYY-MM-DD' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '日期格式应为 YYYY-MM-DD' })
  date: string;

  @ApiProperty({ description: '开始时间 HH:mm' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/, { message: '时间格式应为 HH:mm' })
  startTime: string;

  @ApiProperty({ description: '结束时间 HH:mm' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/, { message: '时间格式应为 HH:mm' })
  endTime: string;

  @ApiProperty({ description: '使用目的' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  purpose: string;
}

export class UpdateReservationDto {
  @ApiProperty({ description: '预约日期 YYYY-MM-DD', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '日期格式应为 YYYY-MM-DD' })
  date?: string;

  @ApiProperty({ description: '开始时间 HH:mm', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: '时间格式应为 HH:mm' })
  startTime?: string;

  @ApiProperty({ description: '结束时间 HH:mm', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: '时间格式应为 HH:mm' })
  endTime?: string;

  @ApiProperty({ description: '使用目的', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  purpose?: string;
}
