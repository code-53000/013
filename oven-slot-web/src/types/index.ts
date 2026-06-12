export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  apartmentNumber?: string;
  role: 'resident' | 'admin';
  violationCount: number;
  isActive: boolean;
}

export interface ActivityRoom {
  id: string;
  name: string;
  location?: string;
  capacity: number;
  openTime: string;
  closeTime: string;
  isActive: boolean;
  equipment?: Equipment[];
}

export interface Equipment {
  id: string;
  name: string;
  model: string;
  serialNumber?: string;
  status: 'available' | 'in_use' | 'maintenance' | 'retired';
  roomId: string;
  trays?: Tray[];
}

export interface Tray {
  id: string;
  trayNumber: string;
  size: 'small' | 'medium' | 'large' | 'extra_large';
  capacity?: number;
  equipmentId: string;
  status: 'available' | 'borrowed' | 'lost' | 'damaged';
  notes?: string;
  equipment?: Equipment;
}

export interface Reservation {
  id: string;
  userId: string;
  roomId: string;
  equipmentId: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
  adminNote?: string;
  confirmedBy?: string;
  confirmedAt?: Date;
  user?: User;
  room?: ActivityRoom;
  equipment?: Equipment;
  trayBorrowRecords?: TrayBorrowRecord[];
  cleaningRecords?: CleaningRecord[];
  violationRecords?: ViolationRecord[];
  createdAt: Date;
}

export interface TrayBorrowRecord {
  id: string;
  userId: string;
  trayId: string;
  reservationId?: string;
  borrowedAt: Date;
  dueReturnAt?: Date;
  returnedAt?: Date;
  status: 'borrowed' | 'returned' | 'overdue' | 'lost';
  conditionAtBorrow?: string;
  conditionAtReturn?: string;
  tray?: Tray;
  user?: User;
}

export interface CleaningRecord {
  id: string;
  reservationId: string;
  userId: string;
  phase: 'before' | 'after';
  notes: string;
  photoUrls?: string;
  score?: number;
  scoreNote?: string;
  scoredBy?: string;
  scoredAt?: Date;
  user?: User;
  reservation?: Reservation;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ViolationRecord {
  id: string;
  userId: string;
  reservationId?: string;
  reportedBy: string;
  type: 'overcleaning' | 'dirty_after_use' | 'missing_tray' | 'damaged_equipment' | 'no_show' | 'overtime' | 'other';
  severity: 'low' | 'medium' | 'high';
  description: string;
  photoUrls?: string;
  isResolved: boolean;
  resolutionNote?: string;
  resolutionAction?: string;
  user?: User;
  reservation?: Reservation;
  createdAt: Date;
}

export interface SlotInfo {
  startTime: string;
  endTime: string;
  available: boolean;
  reservation?: Reservation;
}

export interface RoomSlotResponse {
  room: ActivityRoom;
  equipment: Equipment;
  date: string;
  slots: SlotInfo[];
}
