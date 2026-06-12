import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityRoom, Equipment } from '../../entities';
import { PublicRoomController } from './rooms.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityRoom, Equipment])],
  controllers: [PublicRoomController],
})
export class RoomsModule {}
