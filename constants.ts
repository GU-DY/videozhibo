import { Streamer, StreamPlatform, StreamStatus, Recording } from './types';

export const MOCK_STREAMERS: Streamer[] = [
  {
    id: '1',
    name: '币圈一哥_Live',
    platform: StreamPlatform.TikTok,
    url: 'https://tiktok.com/@cryptoking',
    status: StreamStatus.Live,
    avatar: 'https://picsum.photos/100/100?random=1',
    viewers: 12500,
    riskLevel: 'HIGH',
    tags: ['加密货币', '高风险', '喊单']
  },
  {
    id: '2',
    name: '每日财经观察',
    platform: StreamPlatform.Douyin,
    url: 'https://douyin.com/dailyfinance',
    status: StreamStatus.Recording,
    avatar: 'https://picsum.photos/100/100?random=2',
    viewers: 45000,
    riskLevel: 'LOW',
    tags: ['股市', '投教', '宏观经济']
  },
  {
    id: '3',
    name: '科技投资前沿',
    platform: StreamPlatform.Douyin,
    url: 'https://douyin.com/techinvest',
    status: StreamStatus.Offline,
    avatar: 'https://picsum.photos/100/100?random=3',
    viewers: 0,
    riskLevel: 'MEDIUM',
    tags: ['科技股', 'IPO', '深度分析']
  }
];

export const MOCK_TRANSCRIPTS = [
  "家人们听我说，这个币马上就要起飞了，保证翻100倍！",
  "投资有风险，入市需谨慎，大家一定要做好自己的研究。",
  "从K线图来看，目前的阻力位在4500点左右。",
  "我听到内部消息说CEO要辞职了，赶紧抛售！",
  "这不构成投资建议，仅仅是娱乐分享。",
  "美联储刚刚宣布降息，这对科技股是个重大利好。",
  "加入我的VIP群，带你精准逃顶抄底，绝不亏损。",
  "让我们一起来看看这家公司的季度财报数据。"
];

export const MOCK_RECORDINGS: Recording[] = [
  {
    id: 'rec_001',
    streamerName: '币圈一哥_Live',
    platform: StreamPlatform.TikTok,
    startTime: '2023-10-24 20:00:00',
    duration: '02:15:30',
    size: '4.2 GB',
    path: '/data/recordings/tiktok_cryptoking_20231024.ts',
    riskCount: 12
  },
  {
    id: 'rec_002',
    streamerName: '每日财经观察',
    platform: StreamPlatform.Douyin,
    startTime: '2023-10-23 09:30:00',
    duration: '04:00:00',
    size: '8.5 GB',
    path: '/data/recordings/douyin_dailyfinance_20231023.ts',
    riskCount: 0
  },
  {
    id: 'rec_003',
    streamerName: '股市黑嘴_曝光',
    platform: StreamPlatform.Douyin,
    startTime: '2023-10-22 14:00:00',
    duration: '01:30:00',
    size: '2.1 GB',
    path: '/data/recordings/douyin_scammer_20231022.mp4',
    riskCount: 45
  }
];