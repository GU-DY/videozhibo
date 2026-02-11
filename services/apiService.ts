import { Streamer, StreamPlatform, StreamStatus, Recording } from '../types';
import { MOCK_STREAMERS, MOCK_RECORDINGS } from '../constants';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://127.0.0.1:8000/api';
const useMock = (import.meta as any).env?.VITE_USE_MOCK === 'true';

export const api = {
  // System Status
  getStatus: async () => {
    try {
      const res = await fetch(`${API_BASE}/status`);
      if (!res.ok) throw new Error('Status fetch failed');
      return await res.json();
    } catch (e) {
      if (useMock) {
        // Return safe default/demo state silently
        return { 
          recorder_running: false, 
          active_urls: MOCK_STREAMERS.length,
          storage_usage: '12.5 GB (Demo Data)'
        };
      }
      return { recorder_running: false, active_urls: 0, storage_usage: '0 B' };
    }
  },

  // Control Recorder
  startRecorder: async () => {
    try {
      const res = await fetch(`${API_BASE}/recorder/start`, { method: 'POST' });
      if (!res.ok) throw new Error('Start failed');
      return res.json();
    } catch (e) {
      if (useMock) {
        console.info("[Demo Mode] Backend not connected. Simulating start.");
        return { message: "Demo: Recorder started" };
      }
      throw e;
    }
  },

  stopRecorder: async () => {
    try {
      const res = await fetch(`${API_BASE}/recorder/stop`, { method: 'POST' });
      if (!res.ok) throw new Error('Stop failed');
      return res.json();
    } catch (e) {
      if (useMock) {
        console.info("[Demo Mode] Backend not connected. Simulating stop.");
        return { message: "Demo: Recorder stopped" };
      }
      throw e;
    }
  },

  // Tasks (Streamers)
  getTasks: async (): Promise<Streamer[]> => {
    try {
      const res = await fetch(`${API_BASE}/tasks`);
      if (!res.ok) throw new Error('Tasks fetch failed');
      const data = await res.json();
      
      return data.map((t: any) => ({
        id: t.id,
        name: t.name,
        url: t.url,
        platform: t.platform === 'Douyin'
          ? StreamPlatform.Douyin
          : t.platform === 'Kuaishou'
            ? StreamPlatform.Kuaishou
            : StreamPlatform.TikTok,
        status: t.status === 'RECORDING' ? StreamStatus.Recording : StreamStatus.Offline,
        avatar: `https://ui-avatars.com/api/?name=${t.name}&background=random`,
        viewers: 0, 
        riskLevel: 'LOW',
        tags: []
      }));
    } catch (e) {
      if (useMock) {
        return MOCK_STREAMERS;
      }
      return [];
    }
  },

  addTask: async (name: string, url: string, platform: string) => {
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url, platform })
      });
      if (!res.ok) throw new Error('Add task failed');
      return res.json();
    } catch (e) {
      if (useMock) {
        console.info("[Demo Mode] Backend not connected. Task addition simulated.");
        return { message: "Demo: Task added" };
      }
      throw e;
    }
  },

  // Recordings
  getRecordings: async (): Promise<Recording[]> => {
    try {
      const res = await fetch(`${API_BASE}/recordings`);
      if (!res.ok) throw new Error('Recordings fetch failed');
      return await res.json();
    } catch (e) {
      if (useMock) {
        return MOCK_RECORDINGS;
      }
      return [];
    }
  }
};
