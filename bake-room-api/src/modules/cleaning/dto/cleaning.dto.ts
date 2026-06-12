import { IsString, IsUUID, IsNotEmpty, IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CleaningPhase } from '../../../entities';

export class SubmitCleaningDto {
  @ApiProperty({ description: '预约ID' })
  @IsUUID()
  @IsNotEmpty()
  reservationId: string;

  @ApiProperty({ description: '用户ID' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: '清洁阶段', enum: CleaningPhase })
  @IsEnum(CleaningPhase)
  phase: CleaningPhase;

  @ApiProperty({ description: '清洁备注' })
  @IsString()
  @IsNotEmpty()
  notes: string;

  @ApiProperty({ description: '照片URL(逗号分隔)', required: false })
  @IsOptional()
  @IsString()
  photoUrls?: string;
}

export class ScoreCleaningDto {
  @ApiProperty({ description: '清洁记录ID' })
  @IsUUID()
  @IsNotEmpty()
  cleaningRecordId: string;

  @ApiProperty({ description: '评分人ID' })
  @IsUUID()
  @IsNotEmpty()
  scoredBy: string;

  @ApiProperty({ description: '评分(0-10)' })
  @IsInt()
  @Min(0)
  @Max(10)
  score: number;

  @ApiProperty({ description: '评分备注', required: false })
  @IsOptional()
  @IsString()
  scoreNote?: string;
}
