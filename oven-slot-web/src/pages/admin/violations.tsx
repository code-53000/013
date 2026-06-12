import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { adminApi, reservationApi } from '@/lib/api';
import {
  violationTypeLabels,
  violationSeverityLabels,
} from '@/lib/store';
import type { ViolationRecord, User, Reservation } from '@/types';

export default function AdminViolations({ user }: { user: any }) {
  const router = useRouter();
  const [violations, setViolations] = useState<ViolationRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');
  const [resolvedFilter, setResolvedFilter] = useState('false');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    userId: '',
    reservationId: '',
    type: 'dirty_after_use',
    severity: 'low',
    description: '',
  });
  const [resolveModal, setResolveModal] = useState<ViolationRecord | null>(null);
  const [resolveForm, setResolveForm] = useState({
    resolutionNote: '',
    resolutionAction: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [userReservations, setUserReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    loadData();
    loadUsers();
  }, [severityFilter, resolvedFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (severityFilter) params.severity = severityFilter;
      if (resolvedFilter !== '') params.isResolved = resolvedFilter;
      const data = await adminApi.getViolations(params);
      setViolations(data);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await adminApi.getUsers('resident');
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUserChange = async (userId: string) => {
    setCreateForm((prev) => ({ ...prev, userId, reservationId: '' }));
    try {
      const data = await reservationApi.list({ userId });
      setUserReservations(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async () => {
    if (!createForm.userId) {
      alert('请选择用户');
      return;
    }
    if (!createForm.description.trim()) {
      alert('请填写违规描述');
      return;
    }
    setSubmitting(true);
    try {
      await adminApi.createViolation({
        ...createForm,
        reportedBy: user.id,
        description: createForm.description.trim(),
      });
      alert('✅ 违规记录已创建');
      setShowCreate(false);
      setCreateForm({
        userId: '',
        reservationId: '',
        type: 'dirty_after_use',
        severity: 'low',
        description: '',
      });
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async () => {
    if (!resolveModal) return;
    if (!resolveForm.resolutionNote.trim() || !resolveForm.resolutionAction.trim()) {
      alert('请填写处理备注和处理措施');
      return;
    }
    setSubmitting(true);
    try {
      await adminApi.resolveViolation(resolveModal.id, {
        resolutionNote: resolveForm.resolutionNote.trim(),
        resolutionAction: resolveForm.resolutionAction.trim(),
      });
      alert('✅ 违规已处理');
      setResolveModal(null);
      setResolveForm({ resolutionNote: '', resolutionAction: '' });
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="page-title" style={{ margin: 0 }}>⚠️ 违规管理</h1>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          + 记录违规
        </button>
      </div>

      <div className="filter-bar">
        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
          <option value="">全部严重程度</option>
          <option value="low">一般</option>
          <option value="medium">较严重</option>
          <option value="high">严重</option>
        </select>
        <select value={resolvedFilter} onChange={(e) => setResolvedFilter(e.target.value)}>
          <option value="">全部状态</option>
          <option value="false">未处理</option>
          <option value="true">已处理</option>
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
                <th>时间</th>
                <th>用户</th>
                <th>类型</th>
                <th>严重度</th>
                <th>描述</th>
                <th>关联预约</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {violations.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state" style={{ padding: 40 }}>
                      <div className="empty-state-icon">🎉</div>
                      <div>暂无违规记录</div>
                    </div>
                  </td>
                </tr>
              ) : (
                violations.map((v) => (
                  <tr key={v.id}>
                    <td style={{ fontSize: 12 }}>
                      {new Date(v.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{v.user?.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {v.user?.phone}
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'var(--bg)' }}>
                        {violationTypeLabels[v.type]}
                      </span>
                    </td>
                    <td>
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
                    </td>
                    <td style={{ maxWidth: 200, fontSize: 13 }}>{v.description}</td>
                    <td>
                      {v.reservation ? (
                        <span
                          style={{ cursor: 'pointer', color: 'var(--primary)', fontSize: 12 }}
                          onClick={() => router.push(`/reservations/${v.reservation!.id}`)}
                        >
                          {v.reservation.date}
                        </span>
                      ) : (
                        '--'
                      )}
                    </td>
                    <td>
                      {v.isResolved ? (
                        <span
                          className="badge"
                          style={{ background: '#d1fae5', color: '#065f46' }}
                        >
                          ✅ 已处理
                        </span>
                      ) : (
                        <span
                          className="badge"
                          style={{ background: '#fee2e2', color: '#991b1b' }}
                        >
                          ⏳ 待处理
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        {!v.isResolved && (
                          <button
                            className="btn-success"
                            style={{ padding: '6px 12px', fontSize: 12 }}
                            onClick={() => setResolveModal(v)}
                          >
                            处理
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

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">⚠️ 记录违规情况</div>
            <div className="form-group">
              <label>违规用户 *</label>
              <select value={createForm.userId} onChange={(e) => handleUserChange(e.target.value)}>
                <option value="">-- 请选择用户 --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.phone}) - {u.apartmentNumber}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>关联预约（可选）</label>
              <select
                value={createForm.reservationId || ''}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, reservationId: e.target.value }))
                }
              >
                <option value="">-- 不关联 --</option>
                {userReservations.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.date} {r.startTime}-{r.endTime} {r.purpose.substring(0, 15)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2">
              <div className="form-group">
                <label>违规类型</label>
                <select
                  value={createForm.type}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, type: e.target.value }))
                  }
                >
                  {Object.entries(violationTypeLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>严重程度</label>
                <select
                  value={createForm.severity}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, severity: e.target.value }))
                  }
                >
                  {Object.entries(violationSeverityLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>违规描述 *</label>
              <textarea
                rows={3}
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="请详细描述违规情况..."
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCreate(false)}>
                取消
              </button>
              <button className="btn-primary" disabled={submitting} onClick={handleCreate}>
                {submitting ? '提交中...' : '提交记录'}
              </button>
            </div>
          </div>
        </div>
      )}

      {resolveModal && (
        <div className="modal-overlay" onClick={() => setResolveModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">✅ 处理违规</div>
            <div style={{ marginBottom: 16, padding: 12, background: 'var(--bg)', borderRadius: 8 }}>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>
                {resolveModal.user?.name} - {violationTypeLabels[resolveModal.type]}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {resolveModal.description}
              </div>
            </div>
            <div className="form-group">
              <label>处理备注 *</label>
              <textarea
                rows={2}
                value={resolveForm.resolutionNote}
                onChange={(e) =>
                  setResolveForm((prev) => ({ ...prev, resolutionNote: e.target.value }))
                }
                placeholder="处理经过说明..."
              />
            </div>
            <div className="form-group">
              <label>处理措施 *</label>
              <input
                value={resolveForm.resolutionAction}
                onChange={(e) =>
                  setResolveForm((prev) => ({ ...prev, resolutionAction: e.target.value }))
                }
                placeholder="如：警告通知、扣除积分、暂停使用资格等"
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setResolveModal(null)}>
                取消
              </button>
              <button className="btn-success" disabled={submitting} onClick={handleResolve}>
                {submitting ? '提交中...' : '确认处理'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
