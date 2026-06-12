import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Reservation,
  ViolationRecord,
  User,
  ActivityRoom,
  Equipment,
} from '../../entities';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reservation,
      ViolationRecord,
      User,
      ActivityRoom,
      Equipment,
    ]),
  ],
  controllers: [AdminController],
})
export class AdminModule {}
