import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { reservationApi, cleaningApi } from '@/lib/api';
import { phaseLabels } from '@/lib/store';
import type { Reservation, CleaningRecord } from '@/types';

export default function CleaningPage({ user }: { user: any }) {
  const router = useRouter();
  const { reservationId, phase } = router.query;
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [reservationList, setReservationList] = useState<Reservation[]>([]);
  const [reservationListLoading, setReservationListLoading] = useState(true);
  const [selectedPhase, setSelectedPhase] = useState<'before' | 'after'>(
    phase === 'after' ? 'after' : 'before',
  );
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<CleaningRecord[]>([]);
  const [score, setScore] = useState<number>(0);
  const [scoreNote, setScoreNote] = useState('');
  const [scoreModal, setScoreModal] = useState<CleaningRecord | null>(null);

  useEffect(() => {
    loadMyReservations();
    loadHistory();
  }, []);

  useEffect(() => {
    if (reservationId) {
      loadDetail();
    }
  }, [reservationId]);

  const loadMyReservations = async () => {
    try {
      const data = await reservationApi.list({ userId: user.id });
      const usable = data.filter((r) =>
        ['confirmed', 'in_progress', 'completed'].includes(r.status),
      );
      setReservationList(usable);
      if (reservationId) {
        const r = usable.find((x) => x.id === reservationId);
        if (r) setSelectedReservation(r);
      }
    } finally {
      setReservationListLoading(false);
    }
  };

  const loadDetail = async () => {
    try {
      const data = await reservationApi.get(reservationId as string);
      setSelectedReservation(data);
      if (data.cleaningRecords) {
        setHistory(data.cleaningRecords);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await cleaningApi.list();
      const mine = data.filter((r) => r.userId === user.id);
      setHistory(mine);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    if (!selectedReservation) {
      alert('请选择关联的预约');
      return;
    }
    if (!notes.trim()) {
      alert('请填写清洁备注');
      return;
    }
    setSubmitting(true);
    try {
      await cleaningApi.submit({
        reservationId: selectedReservation.id,
        userId: user.id,
        phase: selectedPhase,
        notes: notes.trim(),
      });
      alert('✅ 清洁记录已提交！');
      setNotes('');
      loadDetail();
      loadHistory();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleScore = async () => {
    if (!scoreModal) return;
    if (score === 0) {
      alert('请选择评分');
      return;
    }
    try {
      await cleaningApi.score({
        cleaningRecordId: scoreModal.id,
        scoredBy: user.id,
        score,
        scoreNote: scoreNote.trim() || undefined,
      });
      alert('✅ 评分完成！');
      setScoreModal(null);
      setScore(0);
      setScoreNote('');
      loadDetail();
      loadHistory();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const unscoredAfterRecords = history.filter(
    (r) => r.phase === 'after' && (r.score === undefined || r.score === null),
  );

  return (
    <div>
      <h1 className="page-title">🧹 清洁登记</h1>

      <div className="grid grid-cols-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">📝 登记清洁</div>
          </div>

          <div className="form-group">
            <label>选择关联预约</label>
            <select
              value={selectedReservation?.id || ''}
              onChange={(e) => {
                const r = reservationList.find((x) => x.id === e.target.value);
                setSelectedReservation(r || null);
              }}
            >
              <option value="">-- 请选择预约 --</option>
              {reservationListLoading ? (
                <option disabled>加载中...</option>
              ) : (
                reservationList.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.date} {r.startTime}-{r.endTime} - {r.purpose.substring(0, 20)}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="form-group">
            <label>清洁阶段</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className={selectedPhase === 'before' ? 'btn-primary' : 'btn-secondary'}
                onClick={() => setSelectedPhase('before')}
              >
                🧽 使用前
              </button>
              <button
                className={selectedPhase === 'after' ? 'btn-primary' : 'btn-secondary'}
                onClick={() => setSelectedPhase('after')}
              >
                ✨ 使用后
              </button>
            </div>
            <div className="hint-text">
              {selectedPhase === 'before'
                ? '使用前请检查烤箱、烤盘是否干净，记录当前状态'
                : '使用后请彻底清洁，拍照留证，管理员将根据清洁情况评分'}
            </div>
          </div>

          <div className="form-group">
            <label>清洁备注</label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={selectedPhase === 'before'
                ? '例：烤箱内壁干净无油污，烤盘已清洗擦干，设备运转正常...'
                : '例：已擦拭烤箱内壁，烤盘已清洗，台面已整理...'}
            />
            <div className="hint-text">{notes.length}/500</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn-primary"
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? '提交中...' : '✅ 提交清洁记录'}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              📋 我的清洁记录
              {unscoredAfterRecords.length > 0 && (
                <span
                  style={{
                    marginLeft: 10,
                    fontSize: 12,
                    background: '#fef3c7',
                    padding: '3px 10px',
                    borderRadius: 999,
                    color: '#92400e',
                  }}
                >
                  待评分：{unscoredAfterRecords.length}
                </span>
              )}
            </div>
          </div>

          {history.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🧹</div>
              <div>暂无清洁记录</div>
            </div>
          ) : (
            <div
              style={{
                maxHeight: 480,
                overflowY: 'auto',
              }}
            >
              {history.map((record) => (
                <div
                  key={record.id}
                  style={{
                    padding: 14,
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    marginBottom: 10,
                  }}
                >
                  <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                    <span
                      className="badge"
                      style={{
                        background:
                          record.phase === 'before' ? '#dbeafe' : '#fce7f3',
                        color:
                          record.phase === 'before' ? '#1e40af' : '#9d174d',
                      }}
                    >
                      {phaseLabels[record.phase]}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {new Date(record.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, marginBottom: 8, lineHeight: 1.6 }}>
                    {record.notes}
                  </div>
                  {record.score !== undefined && record.score !== null && (
                    <div
                      style={{
                        padding: 8,
                        background: '#fff7ed',
                        borderRadius: 6,
                        fontSize: 13,
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>
                      ⭐ 评分：{record.score}/10
                    </span>
                    {record.scoreNote && (
                      <div style={{ marginTop: 4, color: 'var(--text-secondary)' }}>
                      评语：{record.scoreNote}
                    </div>
                  )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {scoreModal && (
        <div className="modal-overlay" onClick={() => setScoreModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">⭐ 清洁评分</div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>
                清洁记录备注：
              </div>
              <div
                style={{
                  padding: 12,
                  background: 'var(--bg)',
                  borderRadius: 6,
                  fontSize: 13,
                }}
              >
                {scoreModal.notes}
              </div>
            </div>
            <div className="form-group">
              <label>选择评分 (0-10)</label>
              <div className="score-stars">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <span
                    key={n}
                    className={`star ${score >= n ? 'filled' : ''}`}
                    onClick={() => setScore(n)}
                  >
                    ★
                  </span>
                ))}
              </div>
              <div className="hint-text">
                当前评分：{score}/10 &nbsp;&nbsp; 0=极差，10=非常满意
              </div>
            </div>
            <div className="form-group">
              <label>评分备注（可选）</label>
              <textarea
                rows={2}
                value={scoreNote}
                onChange={(e) => setScoreNote(e.target.value)}
                placeholder="对这次清洁的简单评价..."
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setScoreModal(null)}>
                取消
              </button>
              <button className="btn-primary" onClick={handleScore}>
                提交评分
              </button>
            </div>
          </div>
        </div>
        )}
    </div>
  );
}
