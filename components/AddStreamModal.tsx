import React, { useState } from 'react';
import { X, Plus, Link } from 'lucide-react';
import { StreamPlatform } from '../types';

interface AddStreamModalProps {
  onClose: () => void;
  onAdd: (name: string, url: string, platform: StreamPlatform) => void;
}

export const AddStreamModal: React.FC<AddStreamModalProps> = ({ onClose, onAdd }) => {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<StreamPlatform>(StreamPlatform.Douyin);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = url.trim();
    const trimmedName = name.trim();

    if (!trimmedUrl) {
      setError('Please enter a live URL');
      return;
    }

    setError('');
    await onAdd(trimmedName || 'Unknown', trimmedUrl, platform);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">添加新的监控目标</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">平台</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(StreamPlatform).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={`py-2 text-xs rounded border transition-all ${
                    platform === p 
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' 
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">主播名称</label>
             <input 
               type="text" 
               value={name}
               onChange={(e) => setName(e.target.value)}
               placeholder="例如：财经老王_Pro"
               className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
             />
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">直播流地址 (Douyin/TikTok)</label>
             <div className="relative">
                <Link className="absolute left-3 top-2.5 text-slate-500" size={16} />
                <input 
                  type="text" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://v.douyin.com/..."
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 pl-10 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
             </div>
             <p className="text-[10px] text-slate-500 mt-1">系统后台 (DouyinLiveRecorder) 将自动解析此地址。</p>
          </div>

          {error && (
            <div className="text-xs text-red-400">{error}</div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded text-sm text-slate-300 hover:text-white transition-colors">
              取消
            </button>
            <button 
              type="submit" 
              disabled={!url.trim()}
              className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded text-sm font-bold text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-105 transition-all"
            >
              开始监控
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};