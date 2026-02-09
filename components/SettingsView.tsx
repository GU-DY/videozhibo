import React, { useState } from 'react';
import { SystemConfig } from '../types';
import { Save, Server, Globe, Folder, Shield, Cpu } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [config, setConfig] = useState<SystemConfig>({
    cookies: 'odin_tt=...; sessionid=...',
    quality: 'origin',
    format: 'ts',
    proxy: '',
    maxConcurrent: 5,
    savePath: '/downloads/recordings'
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1500);
  };

  return (
    <div className="animate-in fade-in duration-500 h-full overflow-y-auto pb-20">
      <div className="mb-8 border-b border-slate-800 pb-4">
        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <SettingsIcon /> 系统与录制配置
        </h2>
        <p className="text-slate-400 mt-2">配置 DouyinLiveRecorder 核心参数与网络设置</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Core Recording Settings */}
        <div className="glass-panel p-6 rounded-xl border border-slate-700/50">
          <h3 className="text-lg font-bold text-cyan-400 mb-6 flex items-center gap-2">
            <Cpu size={20} /> 核心录制参数
          </h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">录制画质 (Quality)</label>
              <div className="grid grid-cols-4 gap-2">
                {['origin', 'uhd', 'hd', 'sd'].map((q) => (
                  <button
                    key={q}
                    onClick={() => setConfig({ ...config, quality: q as any })}
                    className={`py-2 text-xs font-mono rounded border transition-all ${
                      config.quality === q
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                        : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'
                    }`}
                  >
                    {q.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">输出格式 (Format)</label>
              <div className="grid grid-cols-3 gap-2">
                {['ts', 'mp4', 'flv'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setConfig({ ...config, format: f as any })}
                    className={`py-2 text-xs font-mono rounded border transition-all ${
                      config.format === f
                        ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                        : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'
                    }`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">最大并发任务数</label>
              <input 
                type="number"
                value={config.maxConcurrent}
                onChange={(e) => setConfig({...config, maxConcurrent: parseInt(e.target.value)})}
                className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">存储路径</label>
              <div className="relative">
                <Folder className="absolute left-3 top-3 text-slate-500" size={16} />
                <input 
                  type="text"
                  value={config.savePath}
                  onChange={(e) => setConfig({...config, savePath: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-3 pl-10 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Network & Auth Settings */}
        <div className="space-y-8">
            <div className="glass-panel p-6 rounded-xl border border-slate-700/50">
                <h3 className="text-lg font-bold text-emerald-400 mb-6 flex items-center gap-2">
                    <Shield size={20} /> 认证与网络 (Cookie & Proxy)
                </h3>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Douyin/TikTok Cookie (用于获取高清流)</label>
                        <textarea 
                            value={config.cookies}
                            onChange={(e) => setConfig({...config, cookies: e.target.value})}
                            rows={4}
                            className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-xs font-mono text-slate-300 focus:border-emerald-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">HTTP Proxy</label>
                        <div className="relative">
                            <Globe className="absolute left-3 top-3 text-slate-500" size={16} />
                            <input 
                                type="text"
                                placeholder="http://127.0.0.1:7890"
                                value={config.proxy}
                                onChange={(e) => setConfig({...config, proxy: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded p-3 pl-10 text-white font-mono text-sm focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-cyan-900/50 transition-all hover:scale-105"
                >
                    {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
                    {isSaving ? '正在应用配置...' : '保存并重启服务'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

const SettingsIcon = () => (
    <div className="w-10 h-10 rounded bg-cyan-500/20 flex items-center justify-center text-cyan-400">
        <Server size={24} />
    </div>
);