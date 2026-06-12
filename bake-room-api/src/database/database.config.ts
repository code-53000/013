import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import {
  ActivityRoom,
  Equipment,
  Tray,
  TrayBorrowRecord,
  User,
  Reservation,
  CleaningRecord,
  ViolationRecord,
} from '../entities';

export const getTypeOrmConfig = (): TypeOrmModuleOptions => {
  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'bakeadmin',
    password: process.env.DB_PASSWORD || 'bakepass2024',
    database: process.env.DB_NAME || 'bakeroom',
    entities: [
      ActivityRoom,
      Equipment,
      Tray,
      TrayBorrowRecord,
      User,
      Reservation,
      CleaningRecord,
      ViolationRecord,
    ],
    synchronize: true,
    logging: process.env.NODE_ENV !== 'production',
    ssl: false,
  };
};

export const getTypeOrmConfigForSeed = (): any => {
  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'bakeadmin',
    password: process.env.DB_PASSWORD || 'bakepass2024',
    database: process.env.DB_NAME || 'bakeroom',
    entities: [
      ActivityRoom,
      Equipment,
      Tray,
      TrayBorrowRecord,
      User,
      Reservation,
      CleaningRecord,
      ViolationRecord,
    ],
    synchronize: true,
    logging: false,
    ssl: false,
  };
};
