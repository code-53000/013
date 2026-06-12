import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi, reservationApi } from '@/lib/api';
import { statusLabels, statusColors } from '@/lib/store';
import type { Reservation } from '@/types';

export default function AdminReservations({ user }: { user: any }) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState<Reservation | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;
      const data = await reservationApi.list(params);
      setReservations(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, dateFilter]);

  const handleReview = async (status: 'confirmed' | 'rejected') => {
    if (!reviewModal) return;
    setSubmitting(true);
    try {
      await adminApi.confirmReservation(reviewModal.id, {
        confirmedBy: user.id,
        status,
        adminNote: adminNote.trim() || undefined,
      });
      alert(status === 'confirmed' ? '✅ 已确认预约' : '❌ 已拒绝预约');
      setReviewModal(null);
      setAdminNote('');
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!confirm(`确定将状态更改为 ${statusLabels[newStatus]} 吗？`)) return;
    try {
      await adminApi.updateReservationStatus(id, {
        status: newStatus,
        operatorId: user.id,
      });
      alert('✅ 状态已更新');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const nextStatusMap: Record<string, string[]> = {
    pending: ['confirmed', 'rejected'],
    confirmed: ['in_progress', 'cancelled'],
    in_progress: ['completed'],
    completed: [],
    cancelled: [],
    rejected: [],
  };

  return (
    <div>
      <h1 className="page-title">📝 预约审核管理</h1>

      <div className="filter-bar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">全部状态</option>
          <option value="pending">⏳ 待确认</option>
          <option value="confirmed">✅ 已确认</option>
          <option value="in_progress">🔥 使用中</option>
          <option value="completed">✅ 已完成</option>
          <option value="cancelled">❌ 已取消</option>
          <option value="rejected">🚫 已拒绝</option>
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
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
                <th>用户</th>
                <th>设备</th>
                <th>目的</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 ? (
                <tr>
                  <td colSpan={7}>
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
                      {r.startTime}-{r.endTime}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{r.user?.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {r.user?.phone} &nbsp; {r.user?.apartmentNumber}
                      </div>
                    </td>
                    <td>
                      <div>{r.equipment?.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {r.room?.name}
                      </div>
                    </td>
                    <td style={{ maxWidth: 160, fontSize: 12 }}>{r.purpose}</td>
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
                      <div className="row-actions" style={{ flexWrap: 'wrap' }}>
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
                        {r.status === 'pending' && (
                          <button
                            className="btn-success"
                            style={{ padding: '6px 12px', fontSize: 12 }}
                            onClick={() => setReviewModal(r)}
                          >
                            审核
                          </button>
                        )}
                        {nextStatusMap[r.status]?.map((next) => (
                          <button
                            key={next}
                            className={next === 'completed' ? 'btn-success' : 'btn-secondary'}
                            style={{ padding: '6px 12px', fontSize: 12 }}
                            onClick={() => handleStatusChange(r.id, next)}
                          >
                            →{statusLabels[next]}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {reviewModal && (
        <div className="modal-overlay" onClick={() => setReviewModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">📝 审核预约</div>
            <div style={{ marginBottom: 16 }}>
              <div className="info-row">
                <div className="info-label">预约用户</div>
                <div className="info-value">{reviewModal.user?.name}</div>
              </div>
              <div className="info-row">
                <div className="info-label">预约信息</div>
                <div className="info-value">
                  {reviewModal.date} {reviewModal.startTime}-{reviewModal.endTime}
                </div>
              </div>
              <div className="info-row">
                <div className="info-label">设备/活动室</div>
                <div className="info-value">
                  {reviewModal.equipment?.name} ({reviewModal.room?.name})
                </div>
              </div>
              <div className="info-row">
                <div className="info-label">使用目的</div>
                <div className="info-value">{reviewModal.purpose}</div>
              </div>
            </div>
            <div className="form-group">
              <label>管理员备注（可选）</label>
              <textarea
                rows={2}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="审核意见或注意事项..."
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setReviewModal(null)}>
                取消
              </button>
              <button
                className="btn-danger"
                disabled={submitting}
                onClick={() => handleReview('rejected')}
              >
                拒绝
              </button>
              <button
                className="btn-success"
                disabled={submitting}
                onClick={() => handleReview('confirmed')}
              >
                确认通过
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
