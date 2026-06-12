import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { trayApi, reservationApi } from '@/lib/api';
import {
  trayStatusLabels,
  traySizeLabels,
  borrowStatusLabels,
} from '@/lib/store';
import type { Tray, TrayBorrowRecord, Reservation } from '@/types';

export default function TraysPage({ user }: { user: any }) {
  const router = useRouter();
  const { reservationId } = router.query;
  const [tab, setTab] = useState<'available' | 'my'>('available');
  const [availableTrays, setAvailableTrays] = useState<Tray[]>([]);
  const [selectedTrayIds, setSelectedTrayIds] = useState<string[]>([]);
  const [myBorrows, setMyBorrows] = useState<TrayBorrowRecord[]>([]);
  const [myBorrowLoading, setMyBorrowLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [returnModal, setReturnModal] = useState<TrayBorrowRecord[]>([]);
  const [returnNote, setReturnNote] = useState('完好无损');
  const [condition, setCondition] = useState('完好');

  useEffect(() => {
    loadData();
  }, [tab]);

  useEffect(() => {
    if (reservationId) {
      loadReservation();
    }
  }, [reservationId]);

  const loadData = () => {
    tab === 'available' ? loadAvailable() : loadMyBorrows();
  };

  const loadAvailable = async () => {
    setMyBorrowLoading(true);
    try {
      const data = await trayApi.getAvailable();
      setAvailableTrays(data);
    } finally {
      setMyBorrowLoading(false);
    }
  };

  const loadMyBorrows = async () => {
    setMyBorrowLoading(true);
    try {
      const data = await trayApi.getUserBorrows(user.id);
      setMyBorrows(data || []);
    } finally {
      setMyBorrowLoading(false);
    }
  };

  const loadReservation = async () => {
    try {
      const data = await reservationApi.get(reservationId as string);
      setReservation(data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTray = (id: string) => {
    setSelectedTrayIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleBorrow = async () => {
    if (selectedTrayIds.length === 0) {
      alert('请至少选择一个烤盘');
      return;
    }
    setSubmitting(true);
    try {
      const res = await trayApi.borrow({
        userId: user.id,
        trayIds: selectedTrayIds,
        reservationId: reservationId,
        conditionAtBorrow: condition,
      });
      alert(`✅ 成功借出 ${res.records?.length || 0} 个烤盘！`);
      setSelectedTrayIds([]);
      loadAvailable();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = async () => {
    if (returnModal.length === 0) {
      alert('请选择要归还的烤盘');
      return;
    }
    if (!returnNote.trim()) {
      alert('请填写归还状态说明');
      return;
    }
    setSubmitting(true);
    try {
      await trayApi.return({
        borrowRecordIds: returnModal.map((r) => r.id),
        conditionAtReturn: returnNote,
      });
      alert('✅ 归还成功！');
      setReturnModal([]);
      setReturnNote('完好无损');
      loadMyBorrows();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkLost = async (record: TrayBorrowRecord) => {
    if (!confirm(`确定要标记烤盘丢失吗？此操作不可撤销。`)) return;
    try {
      await trayApi.markLost(record.id);
      alert('✅ 已标记为丢失');
      loadMyBorrows();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const activeBorrows = myBorrows.filter(
    (r) => r.status === 'borrowed' || r.status === 'overdue',
  );

  return (
    <div>
      <h1 className="page-title">🍳 烤盘借用</h1>

      {reservation && (
        <div
          className="card"
          style={{ marginBottom: 20, background: '#fef3c7', border: '1px solid #fde68a' }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            📎 关联预约：{reservation.date} {reservation.startTime}-
            {reservation.endTime} - {reservation.purpose}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            设备：{reservation.equipment?.name}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          className={tab === 'available' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setTab('available')}
        >
          可借用烤盘
        </button>
        <button
          className={tab === 'my' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setTab('my')}
        >
          我的借还记录
          {activeBorrows.length > 0 && (
            <span
              style={{
                background: 'var(--danger)',
                padding: '2px 8px',
                borderRadius: 999,
                marginLeft: 6,
              }}
            >
              {activeBorrows.length}
            </span>
          )}
        </button>
      </div>

      {tab === 'available' ? (
        <div className="card">
          <div className="card-header">
            <div className="card-title">选择烤盘（可多选）</div>
            <div className="row-actions">
              <button className="btn-secondary" onClick={loadAvailable}>
                🔄 刷新
              </button>
              <button
                className="btn-primary"
                disabled={submitting || selectedTrayIds.length === 0}
                onClick={handleBorrow}
              >
                {submitting ? '提交中...' : `借 出 (${selectedTrayIds.length})`}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>借出时烤盘状态</label>
            <input
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="例如：完好、干净、无明显使用痕迹等"
            />
          </div>

          {myBorrowLoading ? (
            <div style={{ padding: 20, textAlign: 'center' }}>
              <div className="loading-spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : availableTrays.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🍳</div>
              <div>暂无可借用的烤盘</div>
            </div>
          ) : (
            <div className="grid grid-cols-3">
              {availableTrays.map((tray) => (
                <div
                  key={tray.id}
                  className={`tray-checkbox ${selectedTrayIds.includes(tray.id) ? 'checked' : ''}`}
                  onClick={() => toggleTray(tray.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedTrayIds.includes(tray.id)}
                    onChange={() => toggleTray(tray.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{tray.trayNumber}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {traySizeLabels[tray.size]}
                      {tray.capacity ? ` · ${tray.capacity}L` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 20 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <div className="card-title" style={{ margin: 0 }}>
                我的借还记录
              </div>
              {activeBorrows.length > 0 && (
                <button className="btn-primary" onClick={() => setReturnModal(activeBorrows)}>
                  ✅ 一键归还所有
                </button>
              )}
            </div>

            {myBorrowLoading ? (
              <div style={{ padding: 20, textAlign: 'center' }}>
                <div className="loading-spinner" style={{ margin: '0 auto' }} />
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>烤盘</th>
                    <th>状态</th>
                    <th>借出时间</th>
                    <th>应归还</th>
                    <th>实际归还</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {myBorrows.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state" style={{ padding: 40 }}>
                          <div className="empty-state-icon">📭</div>
                          <div>暂无借还记录</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    myBorrows.map((record) => (
                      <tr key={record.id}>
                        <td>
                          <div style={{ fontWeight: 500 }}>
                            {record.tray?.trayNumber || '--'}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            {record.tray && traySizeLabels[record.tray.size]}
                          </div>
                        </td>
                        <td>
                          <span
                            className="status-badge"
                            style={{
                              background:
                                record.status === 'returned'
                                  ? '#d1fae5'
                                  : record.status === 'overdue'
                                  ? '#fee2e2'
                                  : record.status === 'lost'
                                  ? '#f3f4f6'
                                  : '#fef3c7',
                              color:
                                record.status === 'returned'
                                  ? '#065f46'
                                  : record.status === 'overdue'
                                  ? '#991b1b'
                                  : record.status === 'lost'
                                  ? '#374151'
                                  : '#92400e',
                            }}
                          >
                            {borrowStatusLabels[record.status]}
                          </span>
                        </td>
                        <td>{new Date(record.borrowedAt).toLocaleString()}</td>
                        <td>
                          {record.dueReturnAt
                            ? new Date(record.dueReturnAt).toLocaleString()
                            : '--'}
                        </td>
                        <td>
                          {record.returnedAt
                            ? new Date(record.returnedAt).toLocaleString()
                            : '--'}
                        </td>
                        <td>
                          <div className="row-actions">
                            {(record.status === 'borrowed' ||
                              record.status === 'overdue') && (
                              <>
                                <button
                                  className="btn-success"
                                  style={{ padding: '6px 12px', fontSize: 12 }}
                                  onClick={() => setReturnModal([record])}
                                >
                                  归还
                                </button>
                                <button
                                  className="btn-danger"
                                  style={{ padding: '6px 12px', fontSize: 12 }}
                                  onClick={() => handleMarkLost(record)}
                                >
                                  丢失
                                </button>
                              </>
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
      )}

      {returnModal.length > 0 && (
        <div className="modal-overlay" onClick={() => setReturnModal([])}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">✅ 归还烤盘</div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>
                即将归还以下烤盘：
              </div>
              {returnModal.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: '8px 12px',
                    background: 'var(--bg)',
                    borderRadius: 6,
                    marginBottom: 6,
                    fontSize: 13,
                  }}
                >
                  🍳 {r.tray?.trayNumber} -{' '}
                  {r.tray && traySizeLabels[r.tray.size]}
                </div>
              ))}
            </div>
            <div className="form-group">
              <label>归还时状态说明</label>
              <textarea
                rows={3}
                value={returnNote}
                onChange={(e) => setReturnNote(e.target.value)}
                placeholder="请描述烤盘归还时的状态"
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setReturnModal([])}>
                取消
              </button>
              <button
                className="btn-primary"
                disabled={submitting}
                onClick={handleReturn}
              >
                {submitting ? '提交中...' : '确认归还'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
