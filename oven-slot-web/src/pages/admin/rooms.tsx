import { useEffect, useState } from 'react';
import { roomApi, trayApi } from '@/lib/api';
import { trayStatusLabels, traySizeLabels } from '@/lib/store';
import type { ActivityRoom, Tray } from '@/types';

export default function AdminRooms({ user }: { user: any }) {
  const [rooms, setRooms] = useState<ActivityRoom[]>([]);
  const [trays, setTrays] = useState<Tray[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'rooms' | 'trays'>('rooms');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [r, t] = await Promise.all([roomApi.adminList(), trayApi.list()]);
      setRooms(r);
      setTrays(t);
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
      <h1 className="page-title">🏢 活动室与设备</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          className={tab === 'rooms' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setTab('rooms')}
        >
          活动室 / 烤箱
        </button>
        <button
          className={tab === 'trays' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setTab('trays')}
        >
          烤盘库存
        </button>
      </div>

      {tab === 'rooms' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {rooms.map((room) => (
            <div key={room.id} className="card">
              <div className="card-header">
                <div>
                  <div className="card-title" style={{ margin: 0 }}>{room.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                    📍 {room.location} &nbsp;|&nbsp; 🕒 {room.openTime}-{room.closeTime}
                    &nbsp;|&nbsp; 容纳 {room.capacity} 人
                  </div>
                </div>
                <span
                  className="badge"
                  style={{ background: room.isActive ? '#d1fae5' : '#fee2e2',
                    color: room.isActive ? '#065f46' : '#991b1b' }}
                >
                  {room.isActive ? '启用中' : '已停用'}
                </span>
              </div>

              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                🍰 烘焙设备
              </h3>
              <div className="grid grid-cols-2">
                {(!room.equipment || room.equipment.length === 0) ? (
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    暂无设备
                  </div>
                ) : (
                  room.equipment.map((eq) => (
                    <div
                      key={eq.id}
                      style={{
                        padding: 14,
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600 }}>{eq.name}</span>
                        <span
                          className="badge"
                          style={{
                            background:
                              eq.status === 'available'
                                ? '#d1fae5'
                                : eq.status === 'in_use'
                                ? '#dbeafe'
                                : '#fee2e2',
                            color:
                              eq.status === 'available'
                                ? '#065f46'
                                : eq.status === 'in_use'
                                ? '#1e40af'
                                : '#991b1b',
                          }}
                        >
                          {eq.status === 'available'
                            ? '可用'
                            : eq.status === 'in_use'
                            ? '使用中'
                            : eq.status === 'maintenance'
                            ? '维护中'
                            : '已报废'}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        型号：{eq.model}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        序列号：{eq.serialNumber || '--'}
                      </div>
                      <div
                        style={{
                          marginTop: 8,
                          paddingTop: 8,
                          borderTop: '1px dashed var(--border)',
                          fontSize: 12,
                          color: 'var(--primary)',
                        }}
                      >
                        🍳 配套烤盘：{eq.trays?.length || 0} 个
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 20 }}>
            <div className="card-header" style={{ marginLeft: 0, marginRight: 0 }}>
              <div className="card-title" style={{ margin: 0 }}>
                📦 烤盘库存清单 ({trays.length})
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>编号</th>
                  <th>尺寸</th>
                  <th>容量</th>
                  <th>所属烤箱</th>
                  <th>状态</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                {trays.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 500 }}>{t.trayNumber}</td>
                    <td>
                      <span className="badge" style={{ background: 'var(--bg)' }}>
                        {traySizeLabels[t.size]}
                      </span>
                    </td>
                    <td>{t.capacity || '--'}L</td>
                    <td style={{ fontSize: 12 }}>
                      {t.equipment ? t.equipment.name.substring(0, 10) : '--'}
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background:
                            t.status === 'available'
                              ? '#d1fae5'
                              : t.status === 'borrowed'
                              ? '#dbeafe'
                              : t.status === 'lost'
                              ? '#fee2e2'
                              : '#fef3c7',
                          color:
                            t.status === 'available'
                              ? '#065f46'
                              : t.status === 'borrowed'
                              ? '#1e40af'
                              : t.status === 'lost'
                              ? '#991b1b'
                              : '#92400e',
                        }}
                      >
                        {trayStatusLabels[t.status]}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{t.notes || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
