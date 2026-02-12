import React, { useEffect, useState } from 'react';

import BuyerPortal from './components/BuyerPortal';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import Sidebar from './components/Sidebar';
import SupplierPortal from './components/SupplierPortal';
import { authService } from './services/auth';
import { ApiError } from './services/api';
import type { AuthUser } from '@shared-types/index';

type ActiveView = 'supplier' | 'buyer';

const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('supplier');

  useEffect(() => {
    const load = async () => {
      try {
        const session = await authService.getSession();
        setUser(session);
        setActiveView(session.role === 'BUYER' ? 'buyer' : 'supplier');
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const handleLogin = async (username: string, password: string): Promise<void> => {
    try {
      const session = await authService.login(username, password);
      setUser(session);
      setActiveView(session.role === 'BUYER' ? 'buyer' : 'supplier');
      setAuthError(null);
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setAuthError(caughtError.message);
        return;
      }

      setAuthError('Login failed');
    }
  };

  const handleLogout = async (): Promise<void> => {
    await authService.logout();
    setUser(null);
    setAuthError(null);
  };

  if (isLoading) {
    return <div className="min-h-screen grid place-items-center">Loading session...</div>;
  }

  if (user == null) {
    return <LandingPage onSubmit={handleLogin} errorMessage={authError} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar role={user.role} activeView={activeView} setActiveView={setActiveView} />
      <main className="ml-64 min-h-screen flex flex-col">
        <Header user={user} onLogout={handleLogout} />
        <div className="flex-1 overflow-y-auto">
          {activeView === 'supplier' ? <SupplierPortal /> : <BuyerPortal />}
        </div>
      </main>
    </div>
  );
};

export default App;
