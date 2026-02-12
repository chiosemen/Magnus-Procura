import React from 'react';

import type { AuthUser } from '@shared-types/index';

interface HeaderProps {
  user: AuthUser;
  onLogout: () => Promise<void>;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
      <div>
        <p className="text-xs font-semibold text-slate-500">Authenticated User</p>
        <p className="text-sm font-bold text-slate-900">
          {user.username} • {user.role}
        </p>
      </div>
      <button
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
        onClick={onLogout}
      >
        Sign Out
      </button>
    </header>
  );
};

export default Header;
