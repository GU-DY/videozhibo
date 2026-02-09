import React, { useEffect, useState, useRef } from 'react';
import { Streamer, ChatMessage, AnalysisResult, StreamStatus } from '../types';
import { generateMockMessage } from '../services/mockRecorderService';
import { analyzeTranscript } from '../services/geminiService';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { AlertTriangle, ShieldCheck, Zap, Terminal, Activity, BrainCircuit } from 'lucide-react';

interface MonitorViewProps {
  streamer: Streamer;
  onBack: () => void;
}

export const MonitorView: React.FC<MonitorViewProps> = ({ streamer, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chartData, setChartData] = useState<{ time: string, risk: number, sentiment: number }[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Simulate incoming live chat/transcript
  useEffect(() => {
    const interval = setInterval(() => {
      if (streamer.status === StreamStatus.Offline) return;
      
      const newMsg = generateMockMessage(streamer.id);
      setMessages(prev => {
        const updated = [...prev, newMsg];
        if (updated.length > 50) return updated.slice(updated.length - 50); // keep last 50
        return updated;
      });

      // Auto scroll
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [streamer]);

  // Handle AI Analysis Trigger
  const handleAnalyze = async () => {
    if (isAnalyzing || messages.length === 0) return;
    setIsAnalyzing(true);

    // Take last 10 messages as context
    const transcriptText = messages.slice(-10).map(m => m.text).join(" ");
    
    const result = await analyzeTranscript(transcriptText, streamer.name);
    setLatestAnalysis(result);
    
    // Update chart
    const timeLabel = new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });
    setChartData(prev => [
      ...prev.slice(-19), // Keep last 20 points
      { time: timeLabel, risk: result.riskScore, sentiment: result.sentimentScore }
    ]);

    setIsAnalyzing(false);
  };

  // Auto-analyze every 15 seconds if live
  useEffect(() => {
    const interval = setInterval(() => {
      if (messages.length > 5) handleAnalyze();
    }, 15000);
    return () => clearInterval(interval);
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
                ← 返回
            </button>
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    {streamer.name} <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">{streamer.platform}</span>
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    直播时长: 04:22:10
                    <span className="mx-2">|</span>
                    录制状态: <span className="text-emerald-400">进行中 (TS/1080p)</span>
                </div>
            </div>
        </div>
        <div className="flex gap-2">
             <div className="px-4 py-2 rounded bg-slate-800 border border-slate-700 text-right">
                 <div className="text-xs text-slate-400">实时风险指数</div>
                 <div className={`text-xl font-mono font-bold ${
                     (latestAnalysis?.riskScore || 0) > 70 ? 'text-red-500' : 'text-emerald-400'
                 }`}>
                     {latestAnalysis?.riskScore ?? '--'}
                 </div>
             </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        
        {/* Left Column: Video Placeholder & Charts */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
            {/* Video Player Area */}
            <div className="aspect-video bg-black rounded-xl border border-slate-700 relative overflow-hidden group">
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-0">
                    <p className="text-slate-500 flex flex-col items-center gap-2">
                        <Activity className="animate-pulse" size={48} />
                        <span>直播信号模拟 (DouyinLiveRecorder)</span>
                    </p>
                </div>
                {/* Overlay UI */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent flex justify-between items-end">
                    <div className="flex gap-4 text-xs font-mono text-cyan-400">
                        <span>码率: 4500kbps</span>
                        <span>帧率: 60</span>
                        <span>丢帧: 0</span>
                    </div>
                </div>
            </div>

            {/* Real-time Charts */}
            <div className="flex-1 glass-panel rounded-xl p-4 min-h-[250px] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-200 flex items-center gap-2">
                        <Activity size={16} className="text-cyan-400" />
                        实时情感与风险分析趋势
                    </h3>
                    <div className="flex gap-4 text-xs">
                        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-cyan-400 rounded-sm"></div> 情感指数</span>
                        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> 风险指数</span>
                    </div>
                </div>
                <div className="flex-1 w-full h-full min-h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <XAxis dataKey="time" stroke="#475569" fontSize={10} tick={{fill: '#94a3b8'}} />
                            <YAxis domain={[0, 100]} stroke="#475569" fontSize={10} tick={{fill: '#94a3b8'}} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#e2e8f0' }}
                                itemStyle={{ fontSize: '12px' }}
                            />
                            <ReferenceLine y={80} label="高风险警戒线" stroke="red" strokeDasharray="3 3" opacity={0.5} />
                            <Line type="monotone" dataKey="sentiment" name="情感指数" stroke="#22d3ee" strokeWidth={2} dot={false} activeDot={{r: 4, fill:'#fff'}} animationDuration={500} />
                            <Line type="monotone" dataKey="risk" name="风险指数" stroke="#ef4444" strokeWidth={2} dot={false} animationDuration={500} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Right Column: AI Analysis & Logs */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 min-h-0">
            
            {/* AI Insights Panel */}
            <div className="glass-panel rounded-xl p-5 border-t-2 border-t-purple-500 shadow-lg shadow-purple-500/10">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <BrainCircuit size={18} className="text-purple-400" />
                        Gemini AI 智能洞察
                    </h3>
                    {isAnalyzing && <span className="text-xs text-purple-400 animate-pulse">分析中...</span>}
                </div>
                
                {latestAnalysis ? (
                    <div className="space-y-3">
                         <div className="p-3 rounded bg-slate-800/50 border border-slate-700">
                             <p className="text-xs text-slate-300 leading-relaxed">
                                 {latestAnalysis.summary}
                             </p>
                         </div>
                         
                         {latestAnalysis.complianceIssues.length > 0 && (
                             <div className="space-y-1">
                                 <p className="text-xs font-bold text-red-400 uppercase tracking-wide">合规风险标记</p>
                                 {latestAnalysis.complianceIssues.map((issue, idx) => (
                                     <div key={idx} className="flex items-center gap-2 text-xs text-red-300 bg-red-900/20 px-2 py-1 rounded border border-red-500/20">
                                         <AlertTriangle size={10} /> {issue}
                                     </div>
                                 ))}
                             </div>
                         )}

                         <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-700">
                            <span className="text-slate-400">检测到投资建议:</span>
                            <span className={`font-bold ${latestAnalysis.investmentAdviceDetected ? 'text-red-400' : 'text-slate-500'}`}>
                                {latestAnalysis.investmentAdviceDetected ? '是' : '否'}
                            </span>
                         </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-500 text-xs italic">
                        等待获取足够的直播文本数据进行分析...
                    </div>
                )}
            </div>

            {/* Transcript / Chat Log */}
            <div className="flex-1 glass-panel rounded-xl flex flex-col overflow-hidden min-h-[300px]">
                <div className="p-3 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <Terminal size={14} className="text-emerald-400" /> 实时语音转录
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono">REC: 00:04:12</span>
                </div>
                <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-xs"
                >
                    {messages.map((msg) => (
                        <div key={msg.id} className={`p-2 rounded ${
                            msg.isComplianceRisk ? 'bg-red-500/10 border-l-2 border-red-500' : 'hover:bg-slate-800/50'
                        }`}>
                            <div className="flex justify-between opacity-50 mb-1">
                                <span className="text-cyan-600">{msg.user}</span>
                                <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-slate-300">{msg.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};