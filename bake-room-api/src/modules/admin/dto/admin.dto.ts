import { IsString, IsUUID, IsNotEmpty, IsOptional, IsEnum, IsInt, Min, Max, IsArray, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ViolationType, ViolationSeverity, ReservationStatus } from '../../../entities';

export class ConfirmReservationDto {
  @ApiProperty({ description: '管理员ID' })
  @IsUUID()
  @IsNotEmpty()
  confirmedBy: string;

  @ApiProperty({ description: '确认状态', enum: ReservationStatus })
  @IsEnum(ReservationStatus)
  status: ReservationStatus.CONFIRMED | ReservationStatus.REJECTED;

  @ApiProperty({ description: '管理员备注', required: false })
  @IsOptional()
  @IsString()
  adminNote?: string;
}

export class CreateViolationDto {
  @ApiProperty({ description: '违规用户ID' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: '关联预约ID', required: false })
  @IsOptional()
  @IsUUID()
  reservationId?: string;

  @ApiProperty({ description: '记录人ID' })
  @IsUUID()
  @IsNotEmpty()
  reportedBy: string;

  @ApiProperty({ description: '违规类型', enum: ViolationType })
  @IsEnum(ViolationType)
  type: ViolationType;

  @ApiProperty({ description: '严重程度', enum: ViolationSeverity })
  @IsEnum(ViolationSeverity)
  severity: ViolationSeverity;

  @ApiProperty({ description: '违规描述' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: '照片URL(逗号分隔)', required: false })
  @IsOptional()
  @IsString()
  photoUrls?: string;
}

export class ResolveViolationDto {
  @ApiProperty({ description: '处理备注' })
  @IsString()
  @IsNotEmpty()
  resolutionNote: string;

  @ApiProperty({ description: '处理措施' })
  @IsString()
  @IsNotEmpty()
  resolutionAction: string;
}

export class UpdateReservationStatusDto {
  @ApiProperty({ description: '目标状态', enum: ReservationStatus })
  @IsEnum(ReservationStatus)
  status: ReservationStatus;

  @ApiProperty({ description: '管理员ID' })
  @IsUUID()
  @IsNotEmpty()
  operatorId: string;

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
