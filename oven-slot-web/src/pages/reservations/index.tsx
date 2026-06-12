import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { reservationApi } from '@/lib/api';
import { statusLabels, statusColors } from '@/lib/store';
import type { Reservation } from '@/types';

export default function ReservationsPage({ user }: { user: any }) {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { userId: user.id };
      if (statusFilter) params.status = statusFilter;
      const data = await reservationApi.list(params);
      setReservations(data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleCancel = async (id: string) => {
    if (!confirm('确定要取消这个预约吗？')) return;
    try {
      await reservationApi.cancel(id);
      alert('已取消预约');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="page-title" style={{ margin: 0 }}>📋 我的预约</h1>
        <button className="btn-primary" onClick={() => router.push('/reservations/new')}>
          + 新建预约
        </button>
      </div>

      <div className="filter-bar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">全部状态</option>
          <option value="pending">待确认</option>
          <option value="confirmed">已确认</option>
          <option value="in_progress">使用中</option>
          <option value="completed">已完成</option>
          <option value="cancelled">已取消</option>
          <option value="rejected">已拒绝</option>
        </select>
        <button className="btn-secondary" onClick={loadData}>
          🔄 刷新
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="loading-spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>日期</th>
                <th>时段</th>
                <th>设备</th>
                <th>目的</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state" style={{ padding: 40 }}>
                      <div className="empty-state-icon">📭</div>
                      <div>暂无预约记录</div>
                    </div>
                  </td>
                </tr>
              ) : (
                reservations.map((r) => (
                  <tr key={r.id}>
                    <td>{r.date}</td>
                    <td>
                      {r.startTime} - {r.endTime}
                    </td>
                    <td>{r.equipment?.name || '--'}</td>
                    <td style={{ maxWidth: 200 }}>{r.purpose}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          background: statusColors[r.status] + '20',
                          color: statusColors[r.status],
                        }}
                      >
                        {statusLabels[r.status]}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <Link
                          href={`/reservations/${r.id}`}
                          style={{
                            padding: '6px 12px',
                            background: 'var(--bg)',
                            borderRadius: 6,
                            fontSize: 12,
                            color: 'var(--primary)',
                          }}
                        >
                          详情
                        </Link>
                        {(r.status === 'pending' || r.status === 'confirmed') && (
                          <button
                            className="btn-danger"
                            style={{ padding: '6px 12px', fontSize: 12 }}
                            onClick={() => handleCancel(r.id)}
                          >
                            取消
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
