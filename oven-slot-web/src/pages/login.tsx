import { useState } from 'react';
import { userApi } from '@/lib/api';

interface LoginPageProps {
  onLogin: (user: any) => void;
}

const PRESET_USERS = [
  { phone: '13800000000', name: '物业管理员 (管理员)', role: 'admin' },
  { phone: '13800000001', name: '张阿姨', role: 'resident' },
  { phone: '13800000002', name: '李姐', role: 'resident' },
  { phone: '13800000003', name: '王先生', role: 'resident' },
  { phone: '13800000004', name: '赵妈妈', role: 'resident' },
  { phone: '13800000005', name: '陈叔叔', role: 'resident' },
];

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [showName, setShowName] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!phone.trim()) {
      setError('请输入手机号');
      return;
    }
    if (!/^1\d{10}$/.test(phone.trim())) {
      setError('请输入正确的手机号');
      return;
    }
    if (showName && !name.trim()) {
      setError('新用户请输入姓名');
      return;
    }
    setLoading(true);
    try {
      const user = await userApi.login(phone.trim(), name.trim() || undefined);
      onLogin(user);
    } catch (err: any) {
      if (err.message.includes('needRegister') || err.message.includes('404')) {
        setShowName(true);
        setError('未找到该手机号，请填写姓名完成注册');
      } else {
        setError(err.message || '登录失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const quickSelect = (p: string) => {
    setPhone(p);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">🍰</div>
          <h1>社区共享烤箱预约系统</h1>
          <p>蛋糕、披萨、饼干……大家一起快乐烘焙！</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>手机号</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号"
              maxLength={11}
            />
          </div>

          {showName && (
            <div className="form-group">
              <label>姓名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入您的姓名"
              />
            </div>
          )}

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: 16 }}
            disabled={loading}
          >
            {loading ? '登录中...' : '登 录 / 注 册'}
          </button>
        </form>

        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
            💡 快速登录（预置账号演示）：
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PRESET_USERS.map((u) => (
              <button
                key={u.phone}
                type="button"
                className="equipment-chip"
                onClick={() => quickSelect(u.phone)}
              >
                {u.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
