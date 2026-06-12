import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SubmitCleaningDto, ScoreCleaningDto } from './dto/cleaning.dto';
import { CleaningScoreService } from '../../core';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('清洁记录')
@Controller('cleaning-records')
export class CleaningController {
  constructor(private cleaningScoreService: CleaningScoreService) {}

  @Post('submit')
  @ApiOperation({ summary: '提交清洁记录（使用前/使用后）' })
  async submit(@Body() dto: SubmitCleaningDto) {
    const result = await this.cleaningScoreService.submit(dto);
    if (!result.success) {
      throw new HttpException(result.error!, HttpStatus.BAD_REQUEST);
    }
    return result;
  }

  @Post('score')
  @ApiOperation({ summary: '管理员对清洁记录评分' })
  async score(@Body() dto: ScoreCleaningDto) {
    const result = await this.cleaningScoreService.score(dto);
    if (!result.success) {
      throw new HttpException(
        { message: '评分失败', errors: result.errors },
        HttpStatus.BAD_REQUEST,
      );
    }
    return result;
  }

  @Get('reservation/:reservationId')
  @ApiOperation({ summary: '查询预约的清洁记录' })
  async getByReservation(@Param('reservationId') reservationId: string) {
    return this.cleaningScoreService.getReservationCleaningRecords(reservationId);
  }

  @Get('user/:userId/stats')
  @ApiOperation({ summary: '查询用户清洁评分统计' })
  async getUserStats(@Param('userId') userId: string) {
    return this.cleaningScoreService.getUserCleaningStats(userId);
  }

  @Get()
  @ApiOperation({ summary: '查询所有清洁记录' })
  async findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('onlyScored') onlyScored?: string,
    @Query('onlyUnscored') onlyUnscored?: string,
  ) {
    return this.cleaningScoreService.getAllCleaningRecords({
      startDate,
      endDate,
      onlyScored: onlyScored === 'true',
      onlyUnscored: onlyUnscored === 'true',
    });
  }
}
