export enum StreamPlatform {
  Douyin = 'Douyin',
  TikTok = 'TikTok',
  Kuaishou = 'Kuaishou'
}

export enum StreamStatus {
  Live = 'LIVE',
  Offline = 'OFFLINE',
  Recording = 'RECORDING',
  Error = 'ERROR'
}

export interface Streamer {
  id: string;
  name: string;
  platform: StreamPlatform;
  url: string;
  status: StreamStatus;
  avatar: string;
  viewers: number;
  lastAnalysis?: AnalysisResult;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  tags: string[];
}

export interface ChatMessage {
  id: string;
  user: string;
  text: string;
  timestamp: number;
  isComplianceRisk?: boolean;
}

export interface AnalysisResult {
  timestamp: number;
  summary: string;
  sentimentScore: number; // 0 to 100
  riskScore: number; // 0 to 100
  complianceIssues: string[];
  investmentAdviceDetected: boolean;
}

export interface ChartDataPoint {
  time: string;
  sentiment: number;
  viewers: number;
}

export interface Recording {
  id: string;
  streamerName: string;
  platform: StreamPlatform;
  startTime: string;
  duration: string;
  size: string;
  path: string;
  riskCount: number;
}

export interface SystemConfig {
  cookies: string;
  quality: 'origin' | 'uhd' | 'hd' | 'sd';
  format: 'ts' | 'mp4' | 'flv';
  proxy: string;
  maxConcurrent: number;
  savePath: string;
}