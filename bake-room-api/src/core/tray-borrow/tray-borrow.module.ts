import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tray, TrayBorrowRecord, Reservation } from '../../entities';
import { TrayBorrowService } from './tray-borrow.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tray, TrayBorrowRecord, Reservation])],
  providers: [TrayBorrowService],
  exports: [TrayBorrowService],
})
export class TrayBorrowModule {}
