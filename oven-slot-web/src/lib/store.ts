const USER_KEY = 'bake_room_user';

export const authStore = {
  getUser: () => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setUser: (user: any) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clearUser: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(USER_KEY);
  },
  isAdmin: () => {
    const u = authStore.getUser();
    return u && u.role === 'admin';
  },
  isResident: () => {
    const u = authStore.getUser();
    return u && u.role === 'resident';
  },
};

export const statusLabels: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  in_progress: '使用中',
  completed: '已完成',
  cancelled: '已取消',
  rejected: '已拒绝',
};

export const statusColors: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  in_progress: '#10b981',
  completed: '#6b7280',
  cancelled: '#ef4444',
  rejected: '#dc2626',
};

export const trayStatusLabels: Record<string, string> = {
  available: '可用',
  borrowed: '已借出',
  lost: '丢失',
  damaged: '损坏',
};

export const traySizeLabels: Record<string, string> = {
  small: '小号',
  medium: '中号',
  large: '大号',
  extra_large: '特大',
};

export const borrowStatusLabels: Record<string, string> = {
  borrowed: '借出中',
  returned: '已归还',
  overdue: '已逾期',
  lost: '已丢失',
};

export const violationTypeLabels: Record<string, string> = {
  overcleaning: '清洁过度',
  dirty_after_use: '使用后未清理',
  missing_tray: '烤盘缺失',
  damaged_equipment: '设备损坏',
  no_show: '预约未到',
  overtime: '超时使用',
  other: '其他',
};

export const violationSeverityLabels: Record<string, string> = {
  low: '一般',
  medium: '较严重',
  high: '严重',
};

export const phaseLabels: Record<string, string> = {
  before: '使用前',
  after: '使用后',
};
