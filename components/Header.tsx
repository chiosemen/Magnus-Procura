
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex-1 max-w-lg">
        <div className="relative">
          <input
            type="text"
            placeholder="Search opportunities, suppliers, or documents..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-full bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
          />
          <span className="absolute left-4 top-2.5 text-slate-400">🔍</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-6">
        <div className="relative cursor-pointer">
          <span className="text-xl">🔔</span>
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">3</span>
        </div>
        <div className="h-8 w-[1px] bg-slate-200"></div>
        <button className="text-sm font-medium text-blue-600 hover:text-blue-700">Need Help?</button>
      </div>
    </header>
  );
};

export default Header;
