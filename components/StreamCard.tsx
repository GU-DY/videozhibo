import React from 'react';
import { Streamer, StreamStatus } from '../types';
import { Play, Square, Video, AlertTriangle } from 'lucide-react';

interface StreamCardProps {
  streamer: Streamer;
  onSelect: (id: string) => void;
}

const getStatusLabel = (status: StreamStatus) => {
  switch (status) {
    case StreamStatus.Live: return '直播中';
    case StreamStatus.Offline: return '离线';
    case StreamStatus.Recording: return '录制中';
    case StreamStatus.Error: return '异常';
    default: return status;
  }
};

const getRiskLabel = (level: string) => {
    switch(level) {
        case 'HIGH': return '高风险';
        case 'MEDIUM': return '中风险';
        case 'LOW': return '低风险';
        default: return level;
    }
}

export const StreamCard: React.FC<StreamCardProps> = ({ streamer, onSelect }) => {
  const isLive = streamer.status === StreamStatus.Live || streamer.status === StreamStatus.Recording;
  const viewers = Number.isFinite(streamer.viewers) ? streamer.viewers : 0;
  const displayName = streamer.name || 'Unknown';
  
  return (
    <div 
      className="glass-panel rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all duration-300 group cursor-pointer relative"
      onClick={() => onSelect(streamer.id)}
    >
      {/* Header / Cover */}
      <div className="h-24 bg-gradient-to-r from-slate-800 to-slate-900 relative">
        <div className="absolute top-3 right-3 flex gap-2">
            <span className={`px-2 py-0.5 text-xs font-bold rounded flex items-center gap-1 ${
                isLive ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-700 text-slate-400'
            }`}>
                {isLive ? <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" /> : null}
                {getStatusLabel(streamer.status)}
            </span>
        </div>
      </div>

      {/* Avatar & Info */}
      <div className="px-5 pb-5 relative">
        <div className="absolute -top-16 left-5">
           <img 
             src={streamer.avatar} 
             alt={streamer.name} 
             className={`w-16 h-16 rounded-xl border-2 object-cover ${
                 isLive ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'border-slate-700'
             }`}
           />
        </div>
        
        <div className="mt-12 flex justify-between items-start">
            <div>
                <h3 className="font-bold text-white text-lg group-hover:text-cyan-400 transition-colors">
                    {displayName}
                </h3>
                <p className="text-slate-400 text-xs mt-1 flex items-center gap-1">
                    <Video size={12} /> {streamer.platform}
                </p>
            </div>
            <div className="text-right">
                <div className="text-xs text-slate-400">在线人数</div>
                <div className="font-mono text-cyan-400 font-bold">
                    {viewers.toLocaleString()}
                </div>
            </div>
        </div>

        {/* Risk Assessment Badge */}
        <div className="mt-4 flex items-center justify-between p-2 rounded bg-slate-800/50 border border-slate-700">
            <span className="text-xs text-slate-400">AI 风险评估</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                streamer.riskLevel === 'HIGH' ? 'text-red-400 bg-red-500/10' :
                streamer.riskLevel === 'MEDIUM' ? 'text-yellow-400 bg-yellow-500/10' :
                'text-emerald-400 bg-emerald-500/10'
            }`}>
                {getRiskLabel(streamer.riskLevel)}
            </span>
        </div>

        {/* Actions */}
        <div className="mt-4 grid grid-cols-2 gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="flex items-center justify-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 py-1.5 rounded text-xs border border-cyan-500/20 transition-colors">
                <Play size={12} /> 进入监控
            </button>
             <button className="flex items-center justify-center gap-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 py-1.5 rounded text-xs transition-colors">
                <Square size={12} /> 停止录制
            </button>
        </div>
      </div>
    </div>
  );
};
