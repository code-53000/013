import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { reservationApi } from '@/lib/api';
import { statusLabels, statusColors, phaseLabels } from '@/lib/store';
import type { Reservation } from '@/types';

export default function ReservationDetailPage({ user }: { user: any }) {
  const router = useRouter();
  const { id } = router.query;
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const data = await reservationApi.get(id as string);
      setReservation(data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('确定取消预约吗？')) return;
    try {
      await reservationApi.cancel(id as string);
      alert('已取消');
      router.push('/reservations');
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!reservation) return <div>未找到预约</div>;

  const canCancel = ['pending', 'confirmed'].includes(reservation.status);
  const canBorrowTray = ['confirmed', 'in_progress'].includes(reservation.status);
  const canSubmitCleaning = ['confirmed', 'in_progress', 'completed'].includes(reservation.status);

  return (
    <div>
      <h1 className="page-title">
        📋 预约详情
        <span
          className="status-badge"
          style={{
            background: statusColors[reservation.status] + '20',
            color: statusColors[reservation.status],
            fontSize: 14,
            marginLeft: 12,
          }}
        >
          {statusLabels[reservation.status]}
        </span>
      </h1>

      <div className="grid grid-cols-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">基本信息</div>
            <div className="row-actions">
              {canCancel && (
                <button className="btn-danger" onClick={handleCancel}>
                  取消预约
                </button>
              )}
              <button
                className="btn-secondary"
                onClick={() => router.push('/reservations')}
              >
                返回
              </button>
            </div>
          </div>
          <div className="info-row">
            <div className="info-label">预约日期</div>
            <div className="info-value">{reservation.date}</div>
          </div>
          <div className="info-row">
            <div className="info-label">使用时段</div>
            <div className="info-value">
              {reservation.startTime} - {reservation.endTime}
            </div>
          </div>
          <div className="info-row">
            <div className="info-label">活动室</div>
            <div className="info-value">{reservation.room?.name}</div>
          </div>
          <div className="info-row">
            <div className="info-label">使用设备</div>
            <div className="info-value">
              {reservation.equipment?.name} ({reservation.equipment?.model})
            </div>
          </div>
          <div className="info-row">
            <div className="info-label">使用目的</div>
            <div className="info-value">{reservation.purpose}</div>
          </div>
          {reservation.adminNote && (
            <div className="info-row">
              <div className="info-label">管理员备注</div>
              <div className="info-value">{reservation.adminNote}</div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">快速操作</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {canBorrowTray && (
              <button
                className="btn-primary"
                onClick={() =>
                  router.push(`/trays?reservationId=${reservation.id}`)
                }
              >
                🍳 借用烤盘
              </button>
            )}
            {canSubmitCleaning && (
              <>
                <button
                  className="btn-secondary"
                  onClick={() =>
                    router.push(
                      `/cleaning?reservationId=${reservation.id}&phase=before`,
                    )
                  }
                >
                  📝 登记使用前清洁
                </button>
                <button
                  className="btn-secondary"
                  onClick={() =>
                    router.push(
                      `/cleaning?reservationId=${reservation.id}&phase=after`,
                    )
                  }
                >
                  ✅ 登记使用后清洁
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2">
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>
            🍳 烤盘借用记录
          </div>
          {(!reservation.trayBorrowRecords || reservation.trayBorrowRecords.length === 0) ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              暂无借用记录
            </div>
          ) : (
            <div>
              {reservation.trayBorrowRecords.map((br) => (
                <div
                  key={br.id}
                  style={{
                    padding: '10px 0',
                    borderBottom: '1px dashed var(--border)',
                  }}
                >
                  <div style={{ fontWeight: 500 }}>
                    烤盘 #{br.tray?.trayNumber}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    借出：{new Date(br.borrowedAt).toLocaleString()}
                    {br.returnedAt &&
                      ` / 归还：${new Date(br.returnedAt).toLocaleString()}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>
            🧹 清洁记录
          </div>
          {(!reservation.cleaningRecords || reservation.cleaningRecords.length === 0) ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              暂无清洁记录
            </div>
          ) : (
            <div>
              {reservation.cleaningRecords.map((cr) => (
                <div
                  key={cr.id}
                  style={{
                    padding: '10px 0',
                    borderBottom: '1px dashed var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                    <span className="badge" style={{ background: 'var(--bg)' }}>
                      {phaseLabels[cr.phase]}
                    </span>
                    {cr.score !== undefined && cr.score !== null && (
                      <span className="badge" style={{ background: '#fef3c7' }}>
                        ⭐ {cr.score}/10
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13 }}>{cr.notes}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
