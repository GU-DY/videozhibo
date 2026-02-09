import { Streamer, ChatMessage } from '../types';
import { MOCK_TRANSCRIPTS } from '../constants';

// Simulates generating a stream of chat/transcript messages
export const generateMockMessage = (streamerId: string): ChatMessage => {
  const randomText = MOCK_TRANSCRIPTS[Math.floor(Math.random() * MOCK_TRANSCRIPTS.length)];
  return {
    id: Math.random().toString(36).substr(2, 9),
    user: `User_${Math.floor(Math.random() * 1000)}`,
    text: randomText,
    timestamp: Date.now(),
    isComplianceRisk: randomText.includes("guaranteed") || randomText.includes("moon")
  };
};

// Simulates fetching status from the Python/Go backend
export const checkStreamStatus = async (streamer: Streamer): Promise<Streamer> => {
  // In a real app, this would fetch from the DouyinLiveRecorder API
  // Here we just randomly fluctuate viewers
  const fluctuation = Math.floor(Math.random() * 200) - 100;
  return {
    ...streamer,
    viewers: Math.max(0, streamer.viewers + fluctuation)
  };
};
