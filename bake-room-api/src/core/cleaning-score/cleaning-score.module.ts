import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CleaningRecord, Reservation, User } from '../../entities';
import { CleaningScoreService } from './cleaning-score.service';

@Module({
  imports: [TypeOrmModule.forFeature([CleaningRecord, Reservation, User])],
  providers: [CleaningScoreService],
  exports: [CleaningScoreService],
})
export class CleaningScoreModule {}
