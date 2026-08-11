// High-Quality Canvas & Audio Stream Compositor for MediaRecorder

export interface StreamMixerOptions {
  width: number;
  height: number;
  fps: number;
  hostName: string;
  candidateName: string;
  roomTitle: string;
}

export class StreamMixer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private audioCtx: AudioContext | null = null;
  private audioDestination: MediaStreamAudioDestinationNode | null = null;
  private animFrameId: number | null = null;
  private width: number;
  private height: number;
  private hostVideo: HTMLVideoElement | null = null;
  private candidateVideo: HTMLVideoElement | null = null;
  private options: StreamMixerOptions;

  constructor(options: StreamMixerOptions) {
    this.options = options;
    this.width = options.width;
    this.height = options.height;

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext('2d')!;
  }

  public setupVideoSources(hostStream: MediaStream | null, candidateStream: MediaStream | null) {
    if (hostStream) {
      this.hostVideo = document.createElement('video');
      this.hostVideo.srcObject = hostStream;
      this.hostVideo.muted = true;
      this.hostVideo.play().catch(() => {});
    }

    if (candidateStream) {
      this.candidateVideo = document.createElement('video');
      this.candidateVideo.srcObject = candidateStream;
      this.candidateVideo.muted = true;
      this.candidateVideo.play().catch(() => {});
    }

    // Mix audio tracks using Web Audio API
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
        this.audioDestination = this.audioCtx.createMediaStreamDestination();

        if (hostStream && hostStream.getAudioTracks().length > 0) {
          const source = this.audioCtx.createMediaStreamSource(new MediaStream([hostStream.getAudioTracks()[0]]));
          source.connect(this.audioDestination);
        }

        if (candidateStream && candidateStream.getAudioTracks().length > 0) {
          const source = this.audioCtx.createMediaStreamSource(new MediaStream([candidateStream.getAudioTracks()[0]]));
          source.connect(this.audioDestination);
        }
      }
    } catch (err) {
      console.warn('Audio mixing setup warning:', err);
    }
  }

  public startRenderLoop() {
    const draw = () => {
      // Clear canvas background
      this.ctx.fillStyle = '#0f172a'; // slate-900
      this.ctx.fillRect(0, 0, this.width, this.height);

      const halfWidth = this.width / 2;

      // Draw Host Video (Left)
      if (this.hostVideo && this.hostVideo.readyState >= 2) {
        this.ctx.drawImage(this.hostVideo, 0, 0, halfWidth, this.height);
      } else {
        // Placeholder
        this.ctx.fillStyle = '#1e293b';
        this.ctx.fillRect(0, 0, halfWidth, this.height);
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.font = 'bold 28px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.options.hostName + ' (المضيف)', halfWidth / 2, this.height / 2);
      }

      // Draw Divider
      this.ctx.strokeStyle = '#334155';
      this.ctx.lineWidth = 4;
      this.ctx.beginPath();
      this.ctx.moveTo(halfWidth, 0);
      this.ctx.lineTo(halfWidth, this.height);
      this.ctx.stroke();

      // Draw Candidate Video (Right)
      if (this.candidateVideo && this.candidateVideo.readyState >= 2) {
        this.ctx.drawImage(this.candidateVideo, halfWidth, 0, halfWidth, this.height);
      } else {
        // Placeholder
        this.ctx.fillStyle = '#1e293b';
        this.ctx.fillRect(halfWidth, 0, halfWidth, this.height);
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.font = 'bold 28px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.options.candidateName + ' (المرشح)', halfWidth + halfWidth / 2, this.height / 2);
      }

      // Draw Name Badges (Bottom Overlay)
      this.drawBadge(30, this.height - 60, `المضيف: ${this.options.hostName}`, '#0284c7');
      this.drawBadge(halfWidth + 30, this.height - 60, `المرشح: ${this.options.candidateName}`, '#10b981');

      // Top Status Bar Overlay
      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      this.ctx.fillRect(0, 0, this.width, 50);

      this.ctx.fillStyle = '#f8fafc';
      this.ctx.font = '600 20px sans-serif';
      this.ctx.textAlign = 'right';
      this.ctx.fillText(this.options.roomTitle || 'جلسة مقابلة مباشرة', this.width - 30, 32);

      this.ctx.fillStyle = '#10b981';
      this.ctx.beginPath();
      this.ctx.arc(40, 25, 8, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#cbd5e1';
      this.ctx.font = '16px sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.fillText('تسجيل عالي الدقة HD 1080p', 60, 30);

      this.animFrameId = requestAnimationFrame(draw);
    };

    draw();
  }

  private drawBadge(x: number, y: number, text: string, color: string) {
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, 280, 40, 8);
    this.ctx.fill();

    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, 6, 40);

    this.ctx.fillStyle = '#f8fafc';
    this.ctx.font = 'bold 16px sans-serif';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(text, x + 260, y + 25);
  }

  public getMixedStream(): MediaStream {
    const canvasStream = this.canvas.captureStream(this.options.fps || 30);
    const mixedStream = new MediaStream();

    // Add composite video track
    canvasStream.getVideoTracks().forEach((track) => mixedStream.addTrack(track));

    // Add merged audio track if present
    if (this.audioDestination && this.audioDestination.stream.getAudioTracks().length > 0) {
      mixedStream.addTrack(this.audioDestination.stream.getAudioTracks()[0]);
    }

    return mixedStream;
  }

  public stop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
    }
  }
}

export function getSupportedMimeType(): string {
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4'
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return 'video/webm';
}
