import React from 'react';
import { LayoutDashboard, Radio, Settings, Database } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const menuItems = [
    { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard },
    { id: 'recordings', label: '录像归档', icon: Database },
    { id: 'settings', label: '录制配置', icon: Settings },
  ];

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 h-screen flex flex-col fixed left-0 top-0 z-10">
      {/* Logo Area: Adjusted padding and gap to fix overlap and position */}
      <div className="px-6 py-8 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 shrink-0">
          <Radio className="text-white w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-white font-bold text-xl tracking-wider leading-tight">FinStream</h1>
          <p className="text-[10px] text-slate-400 font-mono tracking-wide mt-0.5">金融卫士系统</p>
        </div>
      </div>

      <nav className="flex-1 px-4 mt-2 space-y-2">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} className={isActive ? 'animate-pulse' : ''} />
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-lg p-3 text-xs text-slate-400 border border-slate-700">
          <div className="flex justify-between mb-1">
            <span>系统状态</span>
            <span className="text-emerald-400">在线</span>
          </div>
          <div className="flex justify-between">
            <span>DouyinRecorder</span>
            <span className="text-emerald-400">v2.4.1</span>
          </div>
        </div>
      </div>
    </div>
  );
};