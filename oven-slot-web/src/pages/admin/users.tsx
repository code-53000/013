import { useEffect, useState } from 'react';
import { adminApi, cleaningApi } from '@/lib/api';
import type { User } from '@/types';

export default function AdminUsers({ user }: { user: any }) {
  const [users, setUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [statsMap, setStatsMap] = useState<Record<string, any>>({});

  useEffect(() => {
    loadData();
  }, [roleFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUsers(roleFilter || undefined);
      setUsers(data);
      const stats: Record<string, any> = {};
      await Promise.all(
        data.map(async (u) => {
          try {
            const s = await cleaningApi.getUserStats(u.id);
            stats[u.id] = s;
          } catch {}
        }),
      );
      setStatsMap(stats);
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
      <h1 className="page-title">👥 用户管理</h1>

      <div className="filter-bar">
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">全部用户</option>
          <option value="resident">居民</option>
          <option value="admin">管理员</option>
        </select>
        <button className="btn-secondary" onClick={loadData}>
          🔄 刷新
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>姓名</th>
              <th>手机号</th>
              <th>门牌号</th>
              <th>角色</th>
              <th>违规次数</th>
              <th>清洁评分</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const stats = statsMap[u.id];
              return (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td>{u.phone}</td>
                  <td style={{ fontSize: 13 }}>{u.apartmentNumber || '--'}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: u.role === 'admin' ? '#dbeafe' : 'var(--bg)',
                        color: u.role === 'admin' ? '#1e40af' : 'var(--text-secondary)',
                      }}
                    >
                      {u.role === 'admin' ? '管理员' : '居民'}
                    </span>
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background:
                          u.violationCount > 0 ? '#fee2e2' : '#d1fae5',
                        color:
                          u.violationCount > 0 ? '#991b1b' : '#065f46',
                      }}
                    >
                      {u.violationCount} 次
                    </span>
                  </td>
                  <td>
                    {stats && stats.totalRecords > 0 ? (
                      <div>
                        <span style={{ fontWeight: 600 }}>⭐ {stats.averageScore?.toFixed(1)}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 4 }}>
                          ({stats.totalRecords}次)
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                        暂无记录
                      </span>
                    )}
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: u.isActive ? '#d1fae5' : '#fee2e2',
                        color: u.isActive ? '#065f46' : '#991b1b',
                      }}
                    >
                      {u.isActive ? '活跃' : '停用'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
