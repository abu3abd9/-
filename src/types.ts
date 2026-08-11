export type UserRole = 'host' | 'candidate';

export type VideoResolution = '720p' | '1080p' | '4k';

export interface QualityConfig {
  resolution: VideoResolution;
  fps: number;
  videoBitrate: number; // e.g. 4000000 for 4Mbps HD
  audioBitrate: number; // e.g. 128000 for 128kbps
  autoRecord: boolean;
  echoCancellation: boolean;
  noiseSuppression: boolean;
}

export interface InterviewQuestion {
  id: string;
  category: string;
  question: string;
  expectedAnswer?: string;
}

export interface Candidate {
  id: string;
  name: string;
  email?: string;
  position: string;
  createdAt: number;
}

export interface EvaluationScore {
  communication: number; // 1 to 5
  technicalSkill: number;
  problemSolving: number;
  culturalFit: number;
  overallScore: number; // 0 - 100
  notes: string;
}

export interface SavedRecording {
  id: string;
  roomId: string;
  title: string;
  candidateName: string;
  candidatePosition: string;
  createdAt: number;
  durationSeconds: number;
  fileSizeMB: number;
  resolution: string;
  blobUrl?: string; // Runtime URL created from IndexedDB blob
  mimeType: string;
  aiAnalysis?: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    score: number;
    recommendation: 'accepted' | 'rejected' | 'second_round';
  };
  evaluation?: EvaluationScore;
}

export interface RoomSession {
  id: string;
  title: string;
  candidateName: string;
  candidatePosition: string;
  createdAt: number;
  hostPasscode: string;
  status: 'waiting' | 'active' | 'ended';
  recordingQuality: VideoResolution;
}
