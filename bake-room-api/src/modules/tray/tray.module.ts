import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tray, TrayBorrowRecord } from '../../entities';
import { TrayController } from './tray.controller';
import { TrayBorrowModule } from '../../core';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tray, TrayBorrowRecord]),
    TrayBorrowModule,
  ],
  controllers: [TrayController],
})
export class TrayModule {}
