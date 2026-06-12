import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi, reservationApi, cleaningApi } from '@/lib/api';
import { statusLabels, statusColors, violationSeverityLabels } from '@/lib/store';
import type { Reservation, ViolationRecord, CleaningRecord } from '@/types';

export default function AdminDashboard({ user }: { user: any }) {
  const [stats, setStats] = useState<any>({});
  const [pendingReservations, setPendingReservations] = useState<Reservation[]>([]);
  const [violations, setViolations] = useState<ViolationRecord[]>([]);
  const [unscoredCleaning, setUnscoredCleaning] = useState<CleaningRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [s, pr, vr, cr] = await Promise.all([
        adminApi.getStats(),
        reservationApi.list({ status: 'pending' }),
        adminApi.getViolations({ isResolved: 'false' }),
        cleaningApi.list({ onlyUnscored: 'true' }),
      ]);
      setStats(s);
      setPendingReservations(pr);
      setViolations(vr);
      setUnscoredCleaning(cr.slice(0, 5));
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

  return (
    <div>
      <h1 className="page-title">📊 管理仪表盘</h1>

      <div className="grid grid-cols-3" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-card-label">⏳ 待确认预约</div>
          <div className="stat-card-value" style={{ color: 'var(--warning)' }}>
            {stats.pendingReservations || 0}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">📅 今日预约数</div>
          <div className="stat-card-value" style={{ color: 'var(--info)' }}>
            {stats.todayReservations || 0}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">⚠️ 未处理违规</div>
          <div className="stat-card-value" style={{ color: 'var(--danger)' }}>
            {stats.unresolvedViolations || 0}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-card-label">📋 总预约数</div>
          <div className="stat-card-value">{stats.totalReservations || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">👥 活跃用户数</div>
          <div className="stat-card-value">{stats.totalUsers || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">🔥 可用设备数</div>
          <div className="stat-card-value" style={{ color: 'var(--success)' }}>
            {stats.totalEquipment || 0}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3">
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <div className="card-title">⏳ 待确认预约</div>
            <Link href="/admin/reservations" style={{ color: 'var(--primary)', fontSize: 13 }}>
              全部处理 →
            </Link>
          </div>
          {pendingReservations.length === 0 ? (
            <div className="empty-state" style={{ padding: 30 }}>
              <div className="empty-state-icon">🎉</div>
              <div>暂无待确认预约</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>日期</th>
                  <th>时段</th>
                  <th>用户</th>
                  <th>目的</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {pendingReservations.slice(0, 6).map((r) => (
                  <tr key={r.id}>
                    <td>{r.date}</td>
                    <td>{r.startTime}-{r.endTime}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{r.user?.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {r.user?.phone}
                      </div>
                    </td>
                    <td style={{ maxWidth: 150, fontSize: 12 }}>{r.purpose}</td>
                    <td>
                      <div className="row-actions">
                        <Link
                          href={`/admin/reservations`}
                          style={{
                            padding: '6px 12px',
                            background: 'var(--primary)',
                            color: 'white',
                            borderRadius: 6,
                            fontSize: 12,
                          }}
                        >
                          去处理
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">⚠️ 未处理违规</div>
            <Link href="/admin/violations" style={{ color: 'var(--primary)', fontSize: 13 }}>
              全部 →
            </Link>
          </div>
          {violations.length === 0 ? (
            <div className="empty-state" style={{ padding: 30 }}>
              <div className="empty-state-icon">✅</div>
              <div>暂无未处理违规</div>
            </div>
          ) : (
            <div>
              {violations.slice(0, 5).map((v) => (
                <div
                  key={v.id}
                  style={{
                    padding: 12,
                    borderBottom: '1px dashed var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{v.user?.name}</span>
                    <span
                      className="badge"
                      style={{
                        background:
                          v.severity === 'high'
                            ? '#fee2e2'
                            : v.severity === 'medium'
                            ? '#fef3c7'
                            : '#d1fae5',
                        color:
                          v.severity === 'high'
                            ? '#991b1b'
                            : v.severity === 'medium'
                            ? '#92400e'
                            : '#065f46',
                      }}
                    >
                      {violationSeverityLabels[v.severity]}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {v.description.substring(0, 30)}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div className="card-title">⭐ 待评分清洁记录</div>
        </div>
        {unscoredCleaning.length === 0 ? (
          <div className="empty-state" style={{ padding: 30 }}>
            <div className="empty-state-icon">🧼</div>
            <div>暂无待评分的清洁记录</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>用户</th>
                <th>预约日期</th>
                <th>备注</th>
                <th>提交时间</th>
              </tr>
            </thead>
            <tbody>
              {unscoredCleaning.map((c) => (
                <tr key={c.id}>
                  <td>{c.user?.name}</td>
                  <td>{c.reservation?.date || '--'}</td>
                  <td style={{ maxWidth: 200, fontSize: 13 }}>{c.notes}</td>
                  <td>{new Date(c.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
