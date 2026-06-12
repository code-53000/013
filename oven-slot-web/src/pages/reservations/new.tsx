import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { roomApi, reservationApi } from '@/lib/api';
import type { ActivityRoom, Equipment, RoomSlotResponse } from '@/types';

const todayStr = () => {
  const d = new Date();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

export default function NewReservationPage({ user }: { user: any }) {
  const router = useRouter();
  const [rooms, setRooms] = useState<ActivityRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [date, setDate] = useState(todayStr());
  const [slotData, setSlotData] = useState<RoomSlotResponse | null>(null);
  const [selectedStart, setSelectedStart] = useState('');
  const [selectedEnd, setSelectedEnd] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const equipmentList = useMemo(() => {
    const room = rooms.find((r) => r.id === selectedRoomId);
    return room?.equipment || [];
  }, [rooms, selectedRoomId]);

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    if (selectedRoomId && selectedEquipmentId && date) {
      loadSlots();
    }
  }, [selectedRoomId, selectedEquipmentId, date]);

  const loadRooms = async () => {
    try {
      const data = await roomApi.list();
      setRooms(data);
      if (data.length > 0) {
        setSelectedRoomId(data[0].id);
        if (data[0].equipment && data[0].equipment.length > 0) {
          setSelectedEquipmentId(data[0].equipment[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async () => {
    setSlotsLoading(true);
    try {
      const data = await reservationApi.getSlots(
        selectedRoomId,
        selectedEquipmentId,
        date,
      );
      setSlotData(data);
      setSelectedStart('');
      setSelectedEnd('');
    } catch (err: any) {
      console.error(err);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleSlotClick = (startTime: string, endTime: string, available: boolean) => {
    if (!available) return;

    if (!selectedStart) {
      setSelectedStart(startTime);
      setSelectedEnd(endTime);
      return;
    }

    const startMin = timeToMin(selectedStart);
    const endMin = timeToMin(selectedEnd);
    const clickMin = timeToMin(startTime);

    if (clickMin < startMin) {
      const slots = slotData?.slots || [];
      const hasGap = slots.some(
        (s) =>
          timeToMin(s.startTime) >= clickMin &&
          timeToMin(s.startTime) < startMin &&
          !s.available,
      );
      if (hasGap) {
        setSelectedStart(startTime);
        setSelectedEnd(endTime);
      } else {
        setSelectedStart(startTime);
      }
    } else if (clickMin >= endMin) {
      const slots = slotData?.slots || [];
      const hasGap = slots.some(
        (s) =>
          timeToMin(s.startTime) >= endMin &&
          timeToMin(s.endTime) <= clickMin + 30 &&
          !s.available,
      );
      if (hasGap) {
        setSelectedStart(startTime);
        setSelectedEnd(endTime);
      } else {
        setSelectedEnd(timeToMin(endTime) > clickMin + 30 ? endTime : addMin(endTime, 30));
      }
    } else {
      setSelectedStart(startTime);
      setSelectedEnd(endTime);
    }
  };

  const handleSubmit = async () => {
    if (!selectedStart || !selectedEnd) {
      alert('请选择预约时段');
      return;
    }
    if (!purpose.trim()) {
      alert('请填写使用目的');
      return;
    }
    setSubmitting(true);
    try {
      await reservationApi.create({
        userId: user.id,
        roomId: selectedRoomId,
        equipmentId: selectedEquipmentId,
        date,
        startTime: selectedStart,
        endTime: selectedEnd,
        purpose: purpose.trim(),
      });
      alert('✅ 预约申请已提交，等待管理员确认！');
      router.push('/reservations');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
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
      <h1 className="page-title">📅 预约烤箱</h1>

      <div className="grid grid-cols-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">1️⃣ 选择活动室</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => {
                  setSelectedRoomId(room.id);
                  setSelectedEquipmentId(room.equipment?.[0]?.id || '');
                }}
                className={`room-select-card ${selectedRoomId === room.id ? 'selected' : ''}`}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{room.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  📍 {room.location} &nbsp; 🕒 {room.openTime}-{room.closeTime}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">2️⃣ 选择设备 & 日期</div>
          </div>
          <div className="form-group">
            <label>烤箱设备</label>
            <div>
              {equipmentList.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  该活动室暂无可用设备
                </div>
              ) : (
                equipmentList.map((eq) => (
                  <span
                    key={eq.id}
                    className={`equipment-chip ${selectedEquipmentId === eq.id ? 'selected' : ''}`}
                    onClick={() => setSelectedEquipmentId(eq.id)}
                  >
                    {eq.name}
                  </span>
                ))
              )}
            </div>
          </div>
          <div className="form-group">
            <label>预约日期</label>
            <input
              type="date"
              value={date}
              min={todayStr()}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8 }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
              💡 已选时段：
            </div>
            <div style={{ fontWeight: 600 }}>
              {selectedStart && selectedEnd
                ? `${date} ${selectedStart} - ${selectedEnd}`
                : '请在右侧时段表中选择（可点击首尾时间扩展范围）'}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">3️⃣ 选择时段（绿色可点，灰色已预约）</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={loadSlots} disabled={slotsLoading}>
              {slotsLoading ? '加载中...' : '🔄 刷新时段'}
            </button>
          </div>
        </div>

        {slotsLoading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="loading-spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : (
          <div className="slot-grid">
            {(slotData?.slots || []).map((slot, idx) => {
              const sMin = timeToMin(slot.startTime);
              const selSMin = timeToMin(selectedStart);
              const selEMin = timeToMin(selectedEnd);
              const inRange =
                sMin >= selSMin && sMin < selEMin && slot.available;
              const isStart = selectedStart === slot.startTime;
              const isEnd =
                selectedEnd && timeToMin(selectedEnd) - 30 === sMin;

              return (
                <div
                  key={idx}
                  onClick={() =>
                    handleSlotClick(slot.startTime, slot.endTime, slot.available)
                  }
                  className={`slot-item ${
                    slot.available
                      ? isStart || isEnd
                        ? 'selected'
                        : inRange
                        ? 'selected-range'
                        : 'available'
                      : 'booked'
                  }`}
                >
                  {slot.startTime}
                  <div style={{ fontSize: 10, opacity: 0.7 }}>
                    ~{slot.endTime}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">4️⃣ 填写使用目的并提交</div>
        </div>
        <div className="form-group">
          <label>使用目的（200字以内）</label>
          <textarea
            rows={3}
            value={purpose}
            maxLength={200}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="例：给家人做生日蛋糕、社区活动烤饼干、周末家庭披萨聚会等"
          />
          <div className="hint-text">{purpose.length}/200</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            className="btn-secondary"
            onClick={() => router.push('/reservations')}
          >
            取消
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '提交中...' : '✅ 提交预约申请'}
          </button>
        </div>
      </div>
    </div>
  );
}

function timeToMin(t: string): number {
  if (!t) return -1;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function addMin(t: string, add: number): string {
  const total = timeToMin(t) + add;
  const h = Math.floor(total / 60).toString().padStart(2, '0');
  const m = (total % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}
