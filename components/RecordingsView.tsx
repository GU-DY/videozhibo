import React, { useState, useEffect } from 'react';
import { api } from '../services/apiService';
import { Recording } from '../types';
import { Play, Download, Trash2, FileVideo, AlertTriangle, Search } from 'lucide-react';

export const RecordingsView: React.FC = () => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const fetchRecs = async () => {
        const data = await api.getRecordings();
        setRecordings(data);
    };
    fetchRecs();
  }, []);

  const filtered = recordings.filter(r => 
    r.streamerName.includes(searchTerm) || r.id.includes(searchTerm)
  );

  return (
    <div className="animate-in fade-in duration-500 h-full flex flex-col">
      <div className="mb-6 flex justify-between items-end">
        <div>
           <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
             <FileVideo className="text-purple-400" size={32} /> 录像归档库
           </h2>
           <p className="text-slate-400 mt-2">查看本地 '{api ? 'downloads' : ''}' 目录下的录制文件。</p>
        </div>
        <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="文件名搜索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-full py-2 pl-10 pr-4 text-sm focus:border-purple-500 focus:outline-none w-64"
            />
        </div>
      </div>

      <div className="flex-1 glass-panel rounded-xl overflow-hidden border border-slate-700/50 flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 text-slate-400 text-xs uppercase border-b border-slate-700">
                  <th className="p-4 font-bold">文件名</th>
                  <th className="p-4 font-bold">归属文件夹</th>
                  <th className="p-4 font-bold">创建时间</th>
                  <th className="p-4 font-bold">文件大小</th>
                  <th className="p-4 font-bold">AI 风险标记</th>
                  <th className="p-4 font-bold text-right">操作</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-800">
                {filtered.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="p-4 font-mono text-slate-300 break-all max-w-xs">{rec.id}</td>
                    <td className="p-4">
                      <div className="font-bold text-white">{rec.streamerName}</div>
                    </td>
                    <td className="p-4 text-slate-400">
                      <div>{rec.startTime}</div>
                    </td>
                    <td className="p-4 font-mono text-cyan-400">{rec.size}</td>
                    <td className="p-4">
                        <div className="text-emerald-500 text-xs flex items-center gap-1 opacity-50">
                          暂无分析
                        </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-cyan-500/20 text-cyan-400 rounded transition-colors" title="播放">
                          <Play size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-10">
                  <FileVideo size={48} className="mb-4 opacity-20" />
                  <p>未在 downloads 目录找到视频文件</p>
              </div>
          )}
      </div>
    </div>
  );
};