import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from '../../entities';
import { SlotConflictService } from './slot-conflict.service';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation])],
  providers: [SlotConflictService],
  exports: [SlotConflictService],
})
export class SlotConflictModule {}
