import { IsString, IsUUID, IsNotEmpty, IsArray, ArrayNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TraySize } from '../../../entities';

export class BorrowTrayDto {
  @ApiProperty({ description: '用户ID' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: '烤盘ID列表' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  trayIds: string[];

  @ApiProperty({ description: '关联预约ID', required: false })
  @IsOptional()
  @IsUUID()
  reservationId?: string;

  @ApiProperty({ description: '借出时烤盘状态', required: false })
  @IsOptional()
  @IsString()
  conditionAtBorrow?: string;
}

export class ReturnTrayDto {
  @ApiProperty({ description: '借还记录ID列表' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  borrowRecordIds: string[];

  @ApiProperty({ description: '归还时烤盘状态说明' })
  @IsString()
  @IsNotEmpty()
  conditionAtReturn: string;
}

export class CreateTrayDto {
  @ApiProperty({ description: '烤盘编号' })
  @IsString()
  @IsNotEmpty()
  trayNumber: string;

  @ApiProperty({ description: '烤盘尺寸', enum: TraySize })
  @IsEnum(TraySize)
  size: TraySize;

  @ApiProperty({ description: '容量(升)', required: false })
  @IsOptional()
  capacity?: number;

  @ApiProperty({ description: '所属设备ID' })
  @IsUUID()
  @IsNotEmpty()
  equipmentId: string;

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
