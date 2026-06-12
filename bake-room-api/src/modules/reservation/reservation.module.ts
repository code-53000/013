import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation, ActivityRoom, Equipment } from '../../entities';
import { ReservationController } from './reservation.controller';
import { SlotConflictModule } from '../../core';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, ActivityRoom, Equipment]),
    SlotConflictModule,
  ],
  controllers: [ReservationController],
})
export class ReservationModule {}
