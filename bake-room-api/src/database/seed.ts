import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { getTypeOrmConfigForSeed } from './database.config';
import {
  ActivityRoom,
  Equipment,
  EquipmentStatus,
  Tray,
  TraySize,
  TrayStatus,
  User,
  UserRole,
  Reservation,
  ReservationStatus,
  CleaningRecord,
  CleaningPhase,
  ViolationRecord,
  ViolationType,
  ViolationSeverity,
} from '../entities';

async function seed() {
  console.log('🌱 开始初始化种子数据...');

  const config = getTypeOrmConfigForSeed() as DataSourceOptions;
  const dataSource = new DataSource(config);

  try {
    await dataSource.initialize();
    console.log('✅ 数据库连接成功');

    const userRepo = dataSource.getRepository(User);
    const roomRepo = dataSource.getRepository(ActivityRoom);
    const equipmentRepo = dataSource.getRepository(Equipment);
    const trayRepo = dataSource.getRepository(Tray);
    const reservationRepo = dataSource.getRepository(Reservation);
    const cleaningRepo = dataSource.getRepository(CleaningRecord);
    const violationRepo = dataSource.getRepository(ViolationRecord);

    const existing = await userRepo.count();
    if (existing > 0) {
      console.log('ℹ️  数据库已有数据，跳过种子数据插入');
      await dataSource.destroy();
      return;
    }

    const adminUser = userRepo.create({
      name: '物业管理员',
      phone: '13800000000',
      email: 'admin@community.com',
      apartmentNumber: '物业办公室',
      role: UserRole.ADMIN,
      isActive: true,
    });
    await userRepo.save(adminUser);
    console.log('✅ 管理员用户已创建');

    const residents = [
      { name: '张阿姨', phone: '13800000001', apartmentNumber: '1栋101室' },
      { name: '李姐', phone: '13800000002', apartmentNumber: '2栋305室' },
      { name: '王先生', phone: '13800000003', apartmentNumber: '3栋502室' },
      { name: '赵妈妈', phone: '13800000004', apartmentNumber: '5栋201室' },
      { name: '陈叔叔', phone: '13800000005', apartmentNumber: '4栋108室' },
    ];

    const savedResidents: User[] = [];
    for (const r of residents) {
      const user = userRepo.create({
        ...r,
        role: UserRole.RESIDENT,
        isActive: true,
      });
      savedResidents.push(await userRepo.save(user));
    }
    console.log('✅ 5位居民用户已创建');

    const rooms = [
      {
        name: '阳光社区活动室',
        location: '小区会所1楼',
        capacity: 20,
        openTime: '08:00',
        closeTime: '22:00',
      },
      {
        name: '邻里烘焙工作室',
        location: '3栋架空层',
        capacity: 10,
        openTime: '09:00',
        closeTime: '21:00',
      },
    ];

    const savedRooms: ActivityRoom[] = [];
    for (const r of rooms) {
      const room = roomRepo.create(r);
      savedRooms.push(await roomRepo.save(room));
    }
    console.log('✅ 2个活动室已创建');

    const equipmentList = [
      { roomId: savedRooms[0].id, name: '海尔嵌入式烤箱', model: 'EOB6561BOX', serialNumber: 'HL2023001', status: EquipmentStatus.AVAILABLE },
      { roomId: savedRooms[0].id, name: '美的多功能烤箱', model: 'T7-421D', serialNumber: 'MD2023015', status: EquipmentStatus.AVAILABLE },
      { roomId: savedRooms[1].id, name: '松下蒸烤一体机', model: 'NU-SC350W', serialNumber: 'SX2024008', status: EquipmentStatus.AVAILABLE },
      { roomId: savedRooms[1].id, name: '长帝专业风炉', model: 'CKTF-32GS', serialNumber: 'CD2023022', status: EquipmentStatus.AVAILABLE },
    ];

    const savedEquipment: Equipment[] = [];
    for (const e of equipmentList) {
      const eq = equipmentRepo.create(e);
      savedEquipment.push(await equipmentRepo.save(eq));
    }
    console.log('✅ 4台设备已创建');

    const trayConfigs: Array<{ equipment: Equipment; number: number; size: TraySize; capacity: number }> = [
      { equipment: savedEquipment[0], number: 4, size: TraySize.LARGE, capacity: 45 },
      { equipment: savedEquipment[0], number: 4, size: TraySize.MEDIUM, capacity: 30 },
      { equipment: savedEquipment[1], number: 3, size: TraySize.LARGE, capacity: 42 },
      { equipment: savedEquipment[1], number: 3, size: TraySize.MEDIUM, capacity: 28 },
      { equipment: savedEquipment[2], number: 2, size: TraySize.LARGE, capacity: 35 },
      { equipment: savedEquipment[2], number: 2, size: TraySize.SMALL, capacity: 18 },
      { equipment: savedEquipment[3], number: 5, size: TraySize.EXTRA_LARGE, capacity: 60 },
      { equipment: savedEquipment[3], number: 3, size: TraySize.MEDIUM, capacity: 32 },
    ];

    const savedTrays: Tray[] = [];
    for (const cfg of trayConfigs) {
      for (let i = 1; i <= cfg.number; i++) {
        const sizeLabel = {
          [TraySize.SMALL]: 'S',
          [TraySize.MEDIUM]: 'M',
          [TraySize.LARGE]: 'L',
          [TraySize.EXTRA_LARGE]: 'XL',
        }[cfg.size];
        const tray = trayRepo.create({
          trayNumber: `${cfg.equipment.name.substring(0, 2)}-${sizeLabel}${i.toString().padStart(2, '0')}`,
          size: cfg.size,
          capacity: cfg.capacity,
          equipmentId: cfg.equipment.id,
          status: TrayStatus.AVAILABLE,
          notes: `${cfg.equipment.model}配套烤盘`,
        });
        savedTrays.push(await trayRepo.save(tray));
      }
    }
    console.log(`✅ ${savedTrays.length}个烤盘已创建`);

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(today.getDate() + 2);

    const reservations = [
      {
        userId: savedResidents[0].id,
        roomId: savedRooms[0].id,
        equipmentId: savedEquipment[0].id,
        date: formatDate(today),
        startTime: '14:00',
        endTime: '16:00',
        purpose: '做戚风蛋糕给孙子过生日',
        status: ReservationStatus.CONFIRMED,
        confirmedBy: adminUser.id,
        confirmedAt: new Date(),
      },
      {
        userId: savedResidents[1].id,
        roomId: savedRooms[0].id,
        equipmentId: savedEquipment[1].id,
        date: formatDate(today),
        startTime: '18:00',
        endTime: '20:00',
        purpose: '烤披萨家庭聚餐用',
        status: ReservationStatus.PENDING,
      },
      {
        userId: savedResidents[2].id,
        roomId: savedRooms[1].id,
        equipmentId: savedEquipment[2].id,
        date: formatDate(tomorrow),
        startTime: '10:00',
        endTime: '12:30',
        purpose: '蒸烤点心招待客人',
        status: ReservationStatus.PENDING,
      },
      {
        userId: savedResidents[3].id,
        roomId: savedRooms[1].id,
        equipmentId: savedEquipment[3].id,
        date: formatDate(tomorrow),
        startTime: '15:00',
        endTime: '18:00',
        purpose: '批量做饼干给小区义卖',
        status: ReservationStatus.CONFIRMED,
        confirmedBy: adminUser.id,
        confirmedAt: new Date(),
      },
      {
        userId: savedResidents[4].id,
        roomId: savedRooms[0].id,
        equipmentId: savedEquipment[0].id,
        date: formatDate(dayAfter),
        startTime: '09:00',
        endTime: '11:00',
        purpose: '烤月饼练习',
        status: ReservationStatus.PENDING,
      },
    ];

    const savedReservations: Reservation[] = [];
    for (const r of reservations) {
      const reservation = reservationRepo.create(r as any);
      const saved = (await reservationRepo.save(reservation)) as unknown as Reservation;
      savedReservations.push(saved);
    }
    console.log(`✅ ${savedReservations.length}条预约样例已创建`);

    const cleaningRecords = [
      {
        reservationId: savedReservations[0].id,
        userId: savedResidents[0].id,
        phase: CleaningPhase.BEFORE,
        notes: '烤箱内部已擦拭干净，烤盘已取出检查。',
      },
    ];
    for (const c of cleaningRecords) {
      const record = cleaningRepo.create(c);
      await cleaningRepo.save(record);
    }
    console.log('✅ 清洁记录样例已创建');

    const violations = [
      {
        userId: savedResidents[2].id,
        reservationId: null,
        reportedBy: adminUser.id,
        type: ViolationType.DIRTY_AFTER_USE,
        severity: ViolationSeverity.MEDIUM,
        description: '上次使用后烤盘未清洗干净，留有食物残渣',
        photoUrls: null,
        isResolved: false,
      },
    ];
    for (const v of violations) {
      const violation = violationRepo.create(v as any);
      await violationRepo.save(violation);
      const user = await userRepo.findOne({ where: { id: v.userId } });
      if (user) {
        user.violationCount = 1;
        await userRepo.save(user);
      }
    }
    console.log('✅ 违规记录样例已创建');

    console.log('\n🎉 种子数据初始化完成！');
    console.log(`   管理员手机号: ${adminUser.phone} (可用于管理员登录)`);
    console.log(`   居民手机号: ${savedResidents.map((r) => r.phone).join('、')}`);
  } catch (err) {
    console.error('❌ 种子数据初始化失败:', err);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

seed();
