import React, { useState, useEffect, useRef } from 'react';
import { Settings, Camera, Mic, Sliders, Check, X, Sparkles, MonitorPlay } from 'lucide-react';
import { QualityConfig, VideoResolution } from '../types';

interface QualitySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: QualityConfig;
  onUpdateConfig: (newConfig: QualityConfig) => void;
}

export const QualitySettingsModal: React.FC<QualitySettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
}) => {
  const [resolution, setResolution] = useState<VideoResolution>(config.resolution);
  const [fps, setFps] = useState<number>(config.fps);
  const [videoBitrate, setVideoBitrate] = useState<number>(config.videoBitrate);
  const [echoCancellation, setEchoCancellation] = useState<boolean>(config.echoCancellation);
  const [noiseSuppression, setNoiseSuppression] = useState<boolean>(config.noiseSuppression);

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [previewError, setPreviewError] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      if (previewStream) {
        previewStream.getTracks().forEach((track) => track.stop());
        setPreviewStream(null);
      }
      return;
    }

    // Start preview stream
    let isMounted = true;
    const startPreview = async () => {
      try {
        setPreviewError('');
        const constraints: MediaStreamConstraints = {
          video: {
            width: resolution === '4k' ? 3840 : resolution === '1080p' ? 1920 : 1280,
            height: resolution === '4k' ? 2160 : resolution === '1080p' ? 1080 : 720,
            frameRate: { ideal: fps },
          },
          audio: {
            echoCancellation,
            noiseSuppression,
          },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (isMounted) {
          setPreviewStream(stream);
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = stream;
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('Camera preview error:', err);
          setPreviewError('تعذر الوصول للكاميرا للتجربة المباشرة. يرجى التأكد من منح الإذن.');
        }
      }
    };

    startPreview();

    return () => {
      isMounted = false;
      if (previewStream) {
        previewStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, resolution, fps, echoCancellation, noiseSuppression]);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateConfig({
      ...config,
      resolution,
      fps,
      videoBitrate,
      echoCancellation,
      noiseSuppression,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">إعدادات جودة الصوت والكاميرا والتسجيل</h3>
            <p className="text-xs text-slate-400">تخصيص دقة البث والتسجيل للحصول على أعلى نقاء واستقرار</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Settings Column */}
          <div className="space-y-5">
            {/* Resolution Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <MonitorPlay className="w-4 h-4 text-emerald-400" />
                <span>دقة التسجيل والفيديو (Resolution):</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '720p', label: '720p HD', desc: 'متوازنة' },
                  { id: '1080p', label: '1080p FHD', desc: 'الأفضل موصى بها' },
                  { id: '4k', label: '4K UHD', desc: 'فائقة جداً' },
                ].map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => setResolution(res.id as VideoResolution)}
                    className={`p-2.5 rounded-xl border text-center transition ${
                      resolution === res.id
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs">{res.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{res.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Frame Rate */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-teal-400" />
                <span>معدل الإطارات (FPS):</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 30, label: '30 إطار/ثانية (سلس قياسي)' },
                  { value: 60, label: '60 إطار/ثانية (سلاسة فائقة)' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setFps(item.value)}
                    className={`p-2.5 rounded-xl border text-center text-xs transition ${
                      fps === item.value
                        ? 'bg-teal-500/10 border-teal-500 text-teal-300 font-bold'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Video Bitrate */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>معدل ترميز التسجيل (Bitrate):</span>
              </label>
              <select
                value={videoBitrate}
                onChange={(e) => setVideoBitrate(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-teal-400"
              >
                <option value={2500000}>جودة قياسية (2.5 Mbps) - حجم ملف صغير</option>
                <option value={4000000}>جودة عالية ممتازة (4.0 Mbps) - الموصى بها</option>
                <option value={6000000}>جودة فائقة جداً (6.0 Mbps) - أعلى تفاصيل</option>
              </select>
            </div>

            {/* Audio Filters */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={echoCancellation}
                  onChange={(e) => setEchoCancellation(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-teal-500 focus:ring-0"
                />
                <Mic className="w-3.5 h-3.5 text-slate-400" />
                <span>إلغاء صدى الصوت (Echo Cancellation)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={noiseSuppression}
                  onChange={(e) => setNoiseSuppression(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-teal-500 focus:ring-0"
                />
                <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                <span>تصفية الضوضاء والضجيج الخلفي (Noise Suppression)</span>
              </label>
            </div>
          </div>

          {/* Camera Preview Column */}
          <div className="flex flex-col justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>معاينة الكاميرا المباشرة:</span>
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  مباشر
                </span>
              </div>

              <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                {previewError && (
                  <p className="absolute text-center text-xs text-red-400 p-3 bg-slate-950/90 rounded-lg max-w-[90%]">
                    {previewError}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">ملاحظة الكفاءة والجودة:</p>
              <p>يتم استخدام محرك MediaRecorder المطور برمز VP9/VP8 للحصول على أفضل جودة صورة وصوت نقي مع حماية متكاملة.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm transition flex items-center gap-2 shadow-md shadow-emerald-950/40"
          >
            <Check className="w-4 h-4" />
            <span>حفظ وتطبيق الإعدادات</span>
          </button>
        </div>
      </div>
    </div>
  );
};
