import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { getTypeOrmConfig } from './database/database.config';
import { ReservationModule } from './modules/reservation/reservation.module';
import { TrayModule } from './modules/tray/tray.module';
import { CleaningModule } from './modules/cleaning/cleaning.module';
import { AdminModule } from './modules/admin/admin.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(getTypeOrmConfig()),
    ReservationModule,
    TrayModule,
    CleaningModule,
    AdminModule,
    RoomsModule,
    UserModule,
  ],
})
export class AppModule {}
