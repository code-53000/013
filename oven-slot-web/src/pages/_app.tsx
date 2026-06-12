import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import LoginPage from '@/pages/login';
import { authStore } from '@/lib/store';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = authStore.getUser();
    setUser(u);
    setIsLoggedIn(!!u);
    setLoading(false);
  }, []);

  const handleLogin = (loggedInUser: any) => {
    authStore.setUser(loggedInUser);
    setUser(loggedInUser);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    authStore.clearUser();
    setUser(null);
    setIsLoggedIn(false);
    router.push('/login');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!isLoggedIn || router.pathname === '/login') {
    if (router.pathname === '/login') {
      return <LoginPage onLogin={handleLogin} />;
    }
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <Component {...pageProps} user={user} />
    </Layout>
  );
}
