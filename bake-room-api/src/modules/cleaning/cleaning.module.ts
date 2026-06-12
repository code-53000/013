import { Module } from '@nestjs/common';
import { CleaningController } from './cleaning.controller';
import { CleaningScoreModule } from '../../core';

@Module({
  imports: [CleaningScoreModule],
  controllers: [CleaningController],
})
export class CleaningModule {}
