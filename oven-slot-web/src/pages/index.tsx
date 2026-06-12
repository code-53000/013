import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { reservationApi, roomApi, trayApi, cleaningApi } from '@/lib/api';
import { statusLabels, statusColors, borrowStatusLabels } from '@/lib/store';
import type { Reservation, ActivityRoom, TrayBorrowRecord } from '@/types';

export default function HomePage({ user }: { user: any }) {
  const router = useRouter();
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<ActivityRoom[]>([]);
  const [myBorrows, setMyBorrows] = useState<TrayBorrowRecord[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    try {
      const [reservations, roomsData, borrows, cleaningStats] = await Promise.all([
        reservationApi.list({ userId: user.id }),
        roomApi.list(),
        trayApi.getUserBorrows(user.id, true),
        cleaningApi.getUserStats(user.id),
      ]);
      setMyReservations(reservations.slice(0, 5));
      setRooms(roomsData);
      setMyBorrows(borrows);
      setStats(cleaningStats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  const upcomingReservations = myReservations.filter(
    (r) => r.status === 'confirmed' || r.status === 'pending' || r.status === 'in_progress',
  );

  return (
    <div>
      <h1 className="page-title">👋 欢迎回来，{user.name}！</h1>
      <p className="page-subtitle">烘焙前记得预约哦～ 祝你做出美味！</p>

      <div className="grid grid-cols-3" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-card-label">📋 待处理预约</div>
          <div className="stat-card-value">{upcomingReservations.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">🍳 进行中烤盘</div>
          <div className="stat-card-value">{myBorrows.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">⭐ 清洁评分</div>
          <div className="stat-card-value">
            {stats.averageScore?.toFixed(1) || '--'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            共 {stats.totalRecords || 0} 次记录
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
        <button
          className="btn-primary"
          style={{ fontSize: 15, padding: '14px 28px' }}
          onClick={() => router.push('/reservations/new')}
        >
          📅 立即预约烤箱
        </button>
        <button
          className="btn-secondary"
          style={{ fontSize: 15, padding: '14px 28px' }}
          onClick={() => router.push('/trays')}
        >
          🍳 借用烤盘
        </button>
      </div>

      <div className="grid grid-cols-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">📅 我的预约</div>
            <Link href="/reservations" style={{ color: 'var(--primary)', fontSize: 13 }}>
              查看全部 →
            </Link>
          </div>
          {myReservations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <div>还没有预约记录</div>
            </div>
          ) : (
            <div>
              {myReservations.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: '12px 0',
                    borderBottom: '1px dashed var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>
                      {r.date} {r.startTime}-{r.endTime}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {r.purpose}
                    </div>
                  </div>
                  <span
                    className="status-badge"
                    style={{ background: statusColors[r.status] + '20', color: statusColors[r.status] }}
                  >
                    {statusLabels[r.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">🏢 活动室</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => router.push('/reservations/new')}
                style={{
                  cursor: 'pointer',
                  padding: 14,
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  background: '#fffaed',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{room.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  📍 {room.location} &nbsp;|&nbsp; 🕒 {room.openTime}-{room.closeTime}
                  &nbsp;|&nbsp; 设备 {room.equipment?.length || 0} 台
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
