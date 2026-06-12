import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';

interface LayoutProps {
  user: any;
  onLogout: () => void;
  children: ReactNode;
}

export default function Layout({ user, onLogout, children }: LayoutProps) {
  const router = useRouter();
  const isAdmin = user?.role === 'admin';

  const residentMenu = [
    { href: '/', label: '🏠 首页概览' },
    { href: '/reservations/new', label: '📅 预约烤箱' },
    { href: '/reservations', label: '📋 我的预约' },
    { href: '/trays', label: '🍳 烤盘借用' },
    { href: '/cleaning', label: '🧹 清洁登记' },
  ];

  const adminMenu = [
    { href: '/admin', label: '📊 管理仪表盘' },
    { href: '/admin/reservations', label: '📝 预约审核' },
    { href: '/admin/violations', label: '⚠️ 违规管理' },
    { href: '/admin/rooms', label: '🏢 活动室设备' },
    { href: '/admin/users', label: '👥 用户管理' },
  ];

  const menu = isAdmin ? adminMenu : residentMenu;

  return (
    <div className="layout">
      <header className="header">
        <h1>
          <span>🍰</span>
          <span>社区共享烤箱预约系统</span>
        </h1>
        <div className="header-user">
          <div>
            <span>{isAdmin ? '👨‍💼' : '👤'}</span>
            <span style={{ marginLeft: 6 }}>{user?.name}</span>
            {isAdmin && (
              <span
                style={{
                  marginLeft: 8,
                  background: 'rgba(255,255,255,0.2)',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 12,
                }}
              >
                管理员
              </span>
            )}
          </div>
          <button onClick={onLogout}>退出</button>
        </div>
      </header>
      <div className="main-layout">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            {menu.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={router.pathname === item.href ? 'active' : ''}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
