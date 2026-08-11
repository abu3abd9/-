import React, { useState, useEffect, useRef } from 'react';
import {
  Video, VideoOff, Mic, MicOff, Monitor, PhoneOff, Settings, Sparkles,
  HardDrive, HelpCircle, FileText, Award, ShieldCheck, User, Radio, Maximize2, Check, RefreshCw,
  Download, Save, CheckCircle2, DownloadCloud
} from 'lucide-react';
import { RoomSession, QualityConfig, EvaluationScore, InterviewQuestion } from '../types';
import { StreamMixer, getSupportedMimeType } from '../lib/recorder';
import { saveRecordingToDB, StoredRecordingRecord } from '../lib/db';
import { CandidateEvaluationModal } from './CandidateEvaluationModal';

interface InterviewRoomProps {
  session: RoomSession;
  isHost: boolean;
  qualityConfig: QualityConfig;
  onLeaveRoom: () => void;
  questions: InterviewQuestion[];
  onOpenVault: () => void;
}

export const InterviewRoom: React.FC<InterviewRoomProps> = ({
  session,
  isHost,
  qualityConfig,
  onLeaveRoom,
  questions,
  onOpenVault,
}) => {
  // Local Media Stream State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const [cameraOn, setCameraOn] = useState<boolean>(true);
  const [micOn, setMicOn] = useState<boolean>(true);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);

  // Recording State (Host Only)
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recorderError, setRecorderError] = useState<string>('');

  // Sidebar Tabs (Host Only)
  const [sidebarTab, setSidebarTab] = useState<'questions' | 'notes' | 'evaluation'>('questions');
  const [notes, setNotes] = useState<string>('');
  const [evaluation, setEvaluation] = useState<EvaluationScore | undefined>(undefined);
  const [isEvalModalOpen, setIsEvalModalOpen] = useState<boolean>(false);

  // Save & Download Modal State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [lastSavedRecord, setLastSavedRecord] = useState<StoredRecordingRecord | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // References
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const mixerRef = useRef<StreamMixer | null>(null);
  const recordingTimerRef = useRef<any>(null);

  // Peer Channel for dual-tab inter-process communication
  const channelRef = useRef<BroadcastChannel | null>(null);

  // 1. Initialize Local Video/Audio Stream
  useEffect(() => {
    let active = true;

    const startMedia = async () => {
      try {
        const constraints: MediaStreamConstraints = {
          video: {
            width: qualityConfig.resolution === '4k' ? 3840 : qualityConfig.resolution === '1080p' ? 1920 : 1280,
            height: qualityConfig.resolution === '4k' ? 2160 : qualityConfig.resolution === '1080p' ? 1080 : 720,
            frameRate: { ideal: qualityConfig.fps },
          },
          audio: {
            echoCancellation: qualityConfig.echoCancellation,
            noiseSuppression: qualityConfig.noiseSuppression,
          },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Failed to get camera/microphone:', err);
        setRecorderError('تعذر فتح الكاميرا أو الميكروفون. يرجى التأكد من السماح بالأذونات للمتصفح.');
      }
    };

    startMedia();

    // BroadcastChannel sync between two tabs
    try {
      const channel = new BroadcastChannel(`room_${session.id}`);
      channelRef.current = channel;

      channel.onmessage = (event) => {
        if (event.data?.type === 'CANDIDATE_READY' && isHost) {
          console.log('Candidate connected to room');
        }
      };

      if (!isHost) {
        channel.postMessage({ type: 'CANDIDATE_READY', name: session.candidateName });
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported:', e);
    }

    return () => {
      active = false;
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
      if (channelRef.current) {
        channelRef.current.close();
      }
      stopRecordingProcess();
    };
  }, [session.id, qualityConfig]);

  // 2. Start Automatic Recording if User is Host
  useEffect(() => {
    if (isHost && localStream && !isRecording) {
      startAutoRecording();
    }
  }, [isHost, localStream]);

  const startAutoRecording = () => {
    try {
      setRecorderError('');
      recordedChunksRef.current = [];

      // Setup StreamMixer compositor for 1080p composite canvas
      const mixer = new StreamMixer({
        width: qualityConfig.resolution === '1080p' ? 1920 : 1280,
        height: qualityConfig.resolution === '1080p' ? 1080 : 720,
        fps: qualityConfig.fps,
        hostName: 'المضيف',
        candidateName: session.candidateName,
        roomTitle: session.title,
      });

      mixerRef.current = mixer;
      mixer.setupVideoSources(localStream, remoteStream);
      mixer.startRenderLoop();

      const mixedStream = mixer.getMixedStream();
      const mimeType = getSupportedMimeType();

      const options: MediaRecorderOptions = {
        mimeType,
        videoBitsPerSecond: qualityConfig.videoBitrate || 4000000,
      };

      const recorder = new MediaRecorder(mixedStream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        await finalizeAndSaveRecording();
      };

      recorder.start(1000); // chunk every second
      setIsRecording(true);

      // Start Recording Timer
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Error starting MediaRecorder:', err);
      setRecorderError('حدث خطأ أثناء إطلاق المحرك للتسجيل التلقائي: ' + (err?.message || ''));
    }
  };

  const stopRecordingProcess = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (mixerRef.current) {
      mixerRef.current.stop();
      mixerRef.current = null;
    }

    setIsRecording(false);
  };

  const triggerVideoDownload = (blob: Blob, mimeType: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (session.candidateName || 'Interview').replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
    a.download = `Ejtema_${safeName}_${dateStr}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const downloadReportTxt = () => {
    const dateFormatted = new Date().toLocaleString('ar-SA');
    const content = `=====================================================
          منصة اجتماع | Ejtema Studio
      تقرير توثيق جلسة المقابلة والتقييم المحفوظ
=====================================================

عنوان الجلسة: ${session.title}
معرف الغرفة: ${session.id}
اسم المرشح: ${session.candidateName}
المسمى الوظيفي: ${session.candidatePosition}
تاريخ المقابلة: ${dateFormatted}
مدة التسجيل: ${Math.floor(recordingSeconds / 60)} دقيقة و ${recordingSeconds % 60} ثانية

-----------------------------------------------------
[1] ملاحظات المضيف المباشرة:
-----------------------------------------------------
${notes || 'لا توجد ملاحظات مدونة أثناء الجلسة.'}

-----------------------------------------------------
[2] التقييم الرقمي للمرشح:
-----------------------------------------------------
- التواصل والعرض: ${evaluation?.communication || 0}/100
- المهارات التقنية: ${evaluation?.technicalSkill || 0}/100
- حل المشكلات: ${evaluation?.problemSolving || 0}/100
- التوافق الثقافي والمهني: ${evaluation?.culturalFit || 0}/100
-----------------------------------------------------
النتيجة الإجمالية النهائي: ${evaluation?.overallScore || 0}%

ملاحظات التقييم:
${evaluation?.notes || 'لم تتم إضافة ملاحظات تفصيلية.'}

=====================================================
تم الحفظ والإنشاء بواسطة نظام اجتماع HD السري
=====================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Report_${session.candidateName.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const finalizeAndSaveRecording = async (): Promise<StoredRecordingRecord | null> => {
    if (recordedChunksRef.current.length === 0) return null;

    const mimeType = getSupportedMimeType();
    const blob = new Blob(recordedChunksRef.current, { type: mimeType });
    const sizeMB = blob.size / (1024 * 1024);

    const record: StoredRecordingRecord = {
      id: 'REC-' + Date.now(),
      roomId: session.id,
      title: session.title,
      candidateName: session.candidateName,
      candidatePosition: session.candidatePosition,
      createdAt: Date.now(),
      durationSeconds: recordingSeconds,
      fileSizeMB: Math.round(sizeMB * 10) / 10,
      resolution: qualityConfig.resolution.toUpperCase(),
      mimeType,
      videoBlob: blob,
      evaluation,
    };

    try {
      await saveRecordingToDB(record);
      setLastSavedRecord(record);
      console.log('Successfully saved recording to IndexedDB vault!');
      return record;
    } catch (err) {
      console.error('Failed to save recording to IndexedDB:', err);
      return null;
    }
  };

  const handleManualSaveAndDownload = async () => {
    if (recordedChunksRef.current.length === 0) {
      setSaveToast('جاري بدء معالجة الحفظ، يرجى الانتظار بضع ثوانٍ...');
      setTimeout(() => setSaveToast(null), 3000);
      return;
    }

    const rec = await finalizeAndSaveRecording();
    const mimeType = getSupportedMimeType();
    const blob = new Blob(recordedChunksRef.current, { type: mimeType });
    triggerVideoDownload(blob, mimeType);

    setSaveToast('تم حفظ التسجيل في الخزنة وتنزيل ملف الفيديو مباشر بنجاح! 🚀');
    setTimeout(() => setSaveToast(null), 4000);
    setIsSaveModalOpen(true);
  };

  // Toggle Controls
  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraOn(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);

        screenStream.getVideoTracks()[0].onended = () => {
          if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
          }
          setIsScreenSharing(false);
        };
      } catch (e) {
        console.warn('Screen share canceled or error:', e);
      }
    } else {
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
      }
      setIsScreenSharing(false);
    }
  };

  const handleEndMeeting = async () => {
    if (isHost && isRecording) {
      stopRecordingProcess();
      await finalizeAndSaveRecording();
      setIsSaveModalOpen(true);
    } else {
      onLeaveRoom();
    }
  };

  // Timer Formatter
  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainderSecs = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${remainderSecs < 10 ? '0' : ''}${remainderSecs}`;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Meeting Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
              <span>{session.title}</span>
              <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                {session.id}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              المرشح: <span className="text-slate-200 font-semibold">{session.candidateName}</span> ({session.candidatePosition})
            </p>
          </div>
        </div>

        {/* HOST ONLY: Hidden Recording Badge & Actions */}
        {isHost ? (
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-full text-xs font-mono font-bold">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>تسجيل تلقائي HD: {formatTimer(recordingSeconds)}</span>
              <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-200">سري للمضيف</span>
            </div>

            {/* Direct Save & Download Button */}
            <button
              onClick={handleManualSaveAndDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-lg text-xs font-bold transition shadow-md"
              title="حفظ وتنزيل التسجيل الحالي فوراً على جهازك"
            >
              <Download className="w-4 h-4" />
              <span>حفظ وتنزيل الفيديو</span>
            </button>

            <button
              onClick={onOpenVault}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition"
              title="فتح الخزنة واستعراض المقابلات السابقة"
            >
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span>الخزنة السريّة</span>
            </button>
          </div>
        ) : (
          /* CANDIDATE VIEW: Clean, Simple Status */
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" />
            <span>جلسة مقابلة معتمدة ومباشرة</span>
          </div>
        )}
      </div>

      {/* Main Grid: Video Stage + (Host Sidebar if Host) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 max-w-7xl mx-auto w-full">
        {/* Video Canvas Stage (3 columns on large screens) */}
        <div className={`${isHost ? 'lg:col-span-3' : 'lg:col-span-4'} flex flex-col space-y-4`}>
          {recorderError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl">
              {recorderError}
            </div>
          )}

          <div className="relative flex-1 min-h-[420px] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
            {/* Split Screen Video Layout */}
            <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
              {/* Host Video Box */}
              <div className="relative aspect-video md:aspect-auto bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 group">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${!isScreenSharing ? 'transform -scale-x-100' : ''}`}
                />
                {!cameraOn && (
                  <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-slate-500 space-y-2">
                    <VideoOff className="w-10 h-10" />
                    <span className="text-xs">الكاميرا مغلقة</span>
                  </div>
                )}
                {/* Name Badge Overlay */}
                <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isHost ? 'أنت (المضيف)' : session.candidateName}</span>
                </div>
              </div>

              {/* Candidate / Remote Video Box */}
              <div className="relative aspect-video md:aspect-auto bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 group">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!remoteStream && (
                  <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-slate-400 space-y-2 p-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-1">
                      <User className="w-8 h-8" />
                    </div>
                    <span className="text-sm font-bold text-slate-300">
                      {isHost ? session.candidateName : 'المضيف (صاحب العمل)'}
                    </span>
                    <span className="text-xs text-slate-500 max-w-xs">
                      {isHost
                        ? 'في انتظار دخول المرشح عبر الرابط...'
                        : 'الكاميرا والصوت متصلان ومستعدان للمقابلة'}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-teal-400" />
                  <span>{isHost ? session.candidateName : 'المضيف'}</span>
                </div>
              </div>
            </div>

            {/* Bottom Floating Control Bar */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
              <button
                onClick={toggleMic}
                className={`p-3 rounded-full transition ${
                  micOn ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-red-500 text-white shadow-lg shadow-red-950/50'
                }`}
                title={micOn ? 'كتم الميكروفون' : 'تشغيل الميكروفون'}
              >
                {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              <button
                onClick={toggleCamera}
                className={`p-3 rounded-full transition ${
                  cameraOn ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-red-500 text-white shadow-lg shadow-red-950/50'
                }`}
                title={cameraOn ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'}
              >
                {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              <button
                onClick={toggleScreenShare}
                className={`p-3 rounded-full transition ${
                  isScreenSharing ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title="مشاركة الشاشة"
              >
                <Monitor className="w-5 h-5" />
              </button>

              {/* End Call Button */}
              <button
                onClick={handleEndMeeting}
                className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full text-xs transition shadow-lg shadow-red-950/50 flex items-center gap-2"
                title="إنهاء الاجتماع"
              >
                <PhoneOff className="w-4 h-4" />
                <span>إنهاء الاجتماع</span>
              </button>
            </div>
          </div>
        </div>

        {/* HOST ONLY SIDEBAR: Questions, Notes & Scoring */}
        {isHost && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col space-y-4 shadow-xl">
            {/* Sidebar Tab Header */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setSidebarTab('questions')}
                className={`flex-1 py-2 rounded-lg transition ${
                  sidebarTab === 'questions' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                الأسئلة
              </button>
              <button
                onClick={() => setSidebarTab('notes')}
                className={`flex-1 py-2 rounded-lg transition ${
                  sidebarTab === 'notes' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                الملاحظات
              </button>
              <button
                onClick={() => setSidebarTab('evaluation')}
                className={`flex-1 py-2 rounded-lg transition ${
                  sidebarTab === 'evaluation' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                التقييم
              </button>
            </div>

            {/* Questions Tab */}
            {sidebarTab === 'questions' && (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <h4 className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>أسئلة المقابلة المقترحة:</span>
                  <span className="text-[10px] text-teal-400 font-mono">{questions.length} سؤال</span>
                </h4>
                {questions.map((q) => (
                  <div key={q.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 hover:border-slate-700 transition">
                    <span className="text-[10px] bg-slate-800 text-teal-300 font-mono px-1.5 py-0.5 rounded">
                      {q.category}
                    </span>
                    <p className="text-xs font-bold text-slate-200">{q.question}</p>
                    {q.expectedAnswer && (
                      <p className="text-[10px] text-slate-400">💡 {q.expectedAnswer}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Notes Tab */}
            {sidebarTab === 'notes' && (
              <div className="flex-1 flex flex-col space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                  <FileText className="w-4 h-4 text-teal-400" />
                  <span>ملاحظات المقابلة المباشرة:</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="اكتب ملاحظاتك الانطباعية حول إجابات وأداء المرشح أثناء الجلسة..."
                  className="flex-1 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 resize-none min-h-[220px]"
                />
                <span className="text-[10px] text-slate-500">تحفظ هذه الملاحظات مع فيديو التسجيل تلقائياً</span>
              </div>
            )}

            {/* Evaluation Tab */}
            {sidebarTab === 'evaluation' && (
              <div className="flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>تقييم أداء المرشح المباشر:</span>
                  </h4>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>الدرجة الحالية:</span>
                      <span className="font-bold text-amber-400 font-mono">
                        {evaluation ? `${evaluation.overallScore}%` : 'لم يتم التقاط الدرجة بعد'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsEvalModalOpen(true)}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Award className="w-4 h-4" />
                  <span>فتح بطاقة تقييم المرشح</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed top-20 right-1/2 transform translate-x-1/2 z-50 bg-emerald-500 text-slate-950 px-6 py-3 rounded-2xl font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce border border-emerald-300">
          <CheckCircle2 className="w-5 h-5" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Candidate Evaluation Modal */}
      <CandidateEvaluationModal
        isOpen={isEvalModalOpen}
        onClose={() => setIsEvalModalOpen(false)}
        candidateName={session.candidateName}
        candidatePosition={session.candidatePosition}
        initialEvaluation={evaluation}
        onSaveEvaluation={(score) => setEvaluation(score)}
      />

      {/* Save Completion Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 text-slate-100 space-y-5 shadow-2xl relative">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-xl font-black text-slate-100">تم حفظ وتوثيق المقابلة بنجاح!</h3>
              <p className="text-xs text-slate-400">
                تم تخزين مقطع الفيديو عالي الدقة وتقارير التقييم بأمان في خزنتك المحلية المشفرة.
              </p>
            </div>

            {/* Session Brief Card */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">المرشح:</span>
                <span className="font-bold text-slate-200">{session.candidateName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">الوظيفة:</span>
                <span className="font-semibold text-teal-400">{session.candidatePosition}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">مدة التسجيل:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {Math.floor(recordingSeconds / 60)} دقيقة و {recordingSeconds % 60} ثانية
                </span>
              </div>
            </div>

            {/* Save Actions */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => {
                  if (recordedChunksRef.current.length > 0) {
                    const mimeType = getSupportedMimeType();
                    const blob = new Blob(recordedChunksRef.current, { type: mimeType });
                    triggerVideoDownload(blob, mimeType);
                  } else if (lastSavedRecord) {
                    triggerVideoDownload(lastSavedRecord.videoBlob, lastSavedRecord.mimeType);
                  }
                }}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>تنزيل ملف الفيديو مباشر (MP4 / WebM)</span>
              </button>

              <button
                onClick={downloadReportTxt}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4 text-teal-400" />
                <span>تنزيل التقرير والملاحظات (ملف نصي)</span>
              </button>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => {
                    setIsSaveModalOpen(false);
                    onOpenVault();
                  }}
                  className="py-2.5 bg-slate-950 hover:bg-slate-800 text-emerald-400 font-semibold text-xs rounded-xl border border-slate-800 transition flex items-center justify-center gap-1.5"
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>فتح الخزنة</span>
                </button>

                <button
                  onClick={() => {
                    setIsSaveModalOpen(false);
                    onLeaveRoom();
                  }}
                  className="py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-xs rounded-xl border border-red-500/20 transition flex items-center justify-center gap-1.5"
                >
                  <PhoneOff className="w-3.5 h-3.5" />
                  <span>مغادرة الغرفة</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
