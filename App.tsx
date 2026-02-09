import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { StreamCard } from './components/StreamCard';
import { MonitorView } from './components/MonitorView';
import { AddStreamModal } from './components/AddStreamModal';
import { SettingsView } from './components/SettingsView';
import { RecordingsView } from './components/RecordingsView';
import { api } from './services/apiService';
import { Streamer, StreamPlatform, StreamStatus } from './types';
import { Search, Plus, Filter, Bell, Power } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedStreamerId, setSelectedStreamerId] = useState<string | null>(null);
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [systemStatus, setSystemStatus] = useState({ recorder_running: false, active_urls: 0 });

  const activeStreamer = streamers.find(s => s.id === selectedStreamerId);

  // Poll for status and tasks
  useEffect(() => {
    const fetchData = async () => {
      const status = await api.getStatus();
      setSystemStatus(status);
      
      const tasks = await api.getTasks();
      setStreamers(tasks);
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const handleAddStreamer = async (name: string, url: string, platform: StreamPlatform) => {
    await api.addTask(name, url, platform);
    // Refresh list immediately
    const tasks = await api.getTasks();
    setStreamers(tasks);
    setIsModalOpen(false);
  };

  const toggleRecorder = async () => {
    if (systemStatus.recorder_running) {
        await api.stopRecorder();
    } else {
        await api.startRecorder();
    }
    const status = await api.getStatus();
    setSystemStatus(status);
  };

  const filteredStreamers = streamers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.platform.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Render content based on currentView state
  const renderContent = () => {
    if (selectedStreamerId && activeStreamer) {
      return (
        <MonitorView 
          streamer={activeStreamer} 
          onBack={() => setSelectedStreamerId(null)} 
        />
      );
    }

    switch (currentView) {
      case 'settings':
        return <SettingsView />;
      case 'recordings':
        return <RecordingsView />;
      case 'dashboard':
      default:
        return (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Area */}
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">监控大盘总览</h2>
                <p className="text-slate-400 mt-1">金融直播实时合规监测与风险管控平台。</p>
              </div>
              
              <div className="flex items-center gap-4">
                 <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
                    <input 
                      type="text" 
                      placeholder="搜索主播..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-full py-2 pl-10 pr-4 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-64 transition-all"
                    />
                 </div>
                 
                 <button 
                    onClick={toggleRecorder}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold shadow-lg transition-all hover:scale-105 ${
                        systemStatus.recorder_running 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                    }`}
                 >
                    <Power size={18} />
                    {systemStatus.recorder_running ? '停止所有录制' : '启动录制服务'}
                 </button>

                 <button 
                   onClick={() => setIsModalOpen(true)}
                   className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg shadow-cyan-900/50 transition-all hover:scale-105"
                 >
                    <Plus size={18} /> 添加直播
                 </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                  { label: '配置监控任务', value: systemStatus.active_urls || 0, color: 'text-cyan-400', border: 'border-cyan-500/20' },
                  { label: '后台服务状态', value: systemStatus.recorder_running ? 'RUNNING' : 'STOPPED', color: systemStatus.recorder_running ? 'text-emerald-400' : 'text-slate-500', border: 'border-emerald-500/20' },
                  { label: '本地存储占用', value: (systemStatus as any).storage_usage || 'Checking...', color: 'text-purple-400', border: 'border-purple-500/20' },
                  { label: '今日捕获文件', value: '--', color: 'text-slate-400', border: 'border-slate-500/20' }
                ].map((stat, i) => (
                    <div key={i} className={`glass-panel p-4 rounded-xl border ${stat.border}`}>
                        <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">{stat.label}</div>
                        <div className={`text-2xl font-mono font-bold ${stat.color}`}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Streamers Grid */}
            <div className="flex-1 overflow-y-auto pr-2 pb-20">
               <div className="flex items-center gap-2 mb-4 text-sm text-slate-400">
                  <Filter size={14} />
                  <span>当前配置 {filteredStreamers.length} 个目标地址</span>
               </div>
               
               {filteredStreamers.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                     {filteredStreamers.map(streamer => (
                       <StreamCard 
                         key={streamer.id} 
                         streamer={streamer} 
                         onSelect={setSelectedStreamerId} 
                       />
                     ))}
                   </div>
               ) : (
                   <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                       <p>暂无监控配置，请点击右上角添加。</p>
                   </div>
               )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">
      <Sidebar currentView={currentView} onChangeView={(view) => {
        setCurrentView(view);
        setSelectedStreamerId(null);
      }} />

      <main className="ml-64 flex-1 p-8 h-screen overflow-hidden flex flex-col">
        {renderContent()}
      </main>

      {isModalOpen && (
        <AddStreamModal 
          onClose={() => setIsModalOpen(false)} 
          onAdd={handleAddStreamer} 
        />
      )}
    </div>
  );
};

export default App;