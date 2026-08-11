import React, { useState, useEffect } from 'react';
import { Video, User, Briefcase, Key, PlusCircle, ArrowLeft, Camera, Mic, ShieldCheck, CheckCircle2, Copy, Sparkles } from 'lucide-react';
import { RoomSession } from '../types';

interface RoomJoinProps {
  isHost: boolean;
  onRequestHostAuth: () => void;
  onJoinRoom: (session: RoomSession, isHostUser: boolean) => void;
  initialRoomCode?: string;
}

export const RoomJoin: React.FC<RoomJoinProps> = ({
  isHost,
  onRequestHostAuth,
  onJoinRoom,
  initialRoomCode = '',
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');

  // Create Form State
  const [candidateName, setCandidateName] = useState('');
  const [candidatePosition, setCandidatePosition] = useState('');
  const [roomTitle, setRoomTitle] = useState('');

  // Join Form State
  const [joinCode, setJoinCode] = useState(initialRoomCode);
  const [guestName, setGuestName] = useState('');

  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (initialRoomCode) {
      setActiveTab('join');
      setJoinCode(initialRoomCode);
    }
  }, [initialRoomCode]);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim()) return;

    const randomCode = 'INT-' + Math.floor(1000 + Math.random() * 9000);
    const session: RoomSession = {
      id: randomCode,
      title: roomTitle.trim() || `مقابلة ${candidateName.trim()}`,
      candidateName: candidateName.trim(),
      candidatePosition: candidatePosition.trim() || 'وظيفة عامة',
      createdAt: Date.now(),
      hostPasscode: '1234',
      status: 'active',
      recordingQuality: '1080p',
    };

    onJoinRoom(session, true);
  };

  const handleJoinExistingRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !guestName.trim()) return;

    const cleanCode = joinCode.trim().toUpperCase();
    const session: RoomSession = {
      id: cleanCode,
      title: `مقابلة مباشرة - ${cleanCode}`,
      candidateName: guestName.trim(),
      candidatePosition: 'مرشح',
      createdAt: Date.now(),
      hostPasscode: '1234',
      status: 'active',
      recordingQuality: '1080p',
    };

    onJoinRoom(session, isHost);
  };

  const shareableUrl = `${window.location.origin}${window.location.pathname}?room=${joinCode || 'INT-1234'}`;

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Hero Welcome Header */}
      <div className="text-center mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>منصة المقابلات الشخصية عالية الدقة HD</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
          اجتماعات مقابلة فورية مع التسجيل التلقائي المحمي
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          افتح الكاميرا وابدأ الاجتماع المباشر بأعلى دقة وصوت نقي. تحفظ المقابلات تلقائياً في خزنة المضيف السرية دون أن تظهر للزوار.
        </p>
      </div>

      {/* Main Container Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Tab Selection */}
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 mb-8 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'create'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>إنشاء جلسة مقابلة (للمضيف)</span>
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'join'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>الانضمام بالرابط (للمرشح)</span>
          </button>
        </div>

        {/* Create Room Form (Host) */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateRoom} className="space-y-6 max-w-xl mx-auto">
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>اسم المرشح المتوقع للمقابلة: *</span>
                </label>
                <input
                  type="text"
                  required
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="مثال: أحمد محمد علي"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-teal-400" />
                    <span>المسمى الوظيفي:</span>
                  </label>
                  <input
                    type="text"
                    value={candidatePosition}
                    onChange={(e) => setCandidatePosition(e.target.value)}
                    placeholder="مثال: مطور برمجيات كامل"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-amber-400" />
                    <span>عنوان الجلسة:</span>
                  </label>
                  <input
                    type="text"
                    value={roomTitle}
                    onChange={(e) => setRoomTitle(e.target.value)}
                    placeholder="مقابلة تقييم المهارات"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Host Privacy Guarantee Banner */}
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-200/90 leading-relaxed">
                <p className="font-bold text-emerald-300 mb-1">الضمانة الأمنية للمضيف:</p>
                <p>
                  بمجرد دخولك للغرفة، سيبدأ تسجيل الصوت والفيديو بأعلى جودة تلقائياً.
                  التسجيل يُحفظ في خزنتك الخاصة ولا يظهر للمرشح إطلاقاً.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-extrabold rounded-2xl text-base transition shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2"
            >
              <Video className="w-5 h-5" />
              <span>بدء غرفة المقابلة والتسجيل التلقائي</span>
            </button>
          </form>
        )}

        {/* Join Existing Room Form (Candidate / Guest) */}
        {activeTab === 'join' && (
          <form onSubmit={handleJoinExistingRoom} className="space-y-6 max-w-xl mx-auto">
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>رمز الغرفة (Room Code): *</span>
                </label>
                <input
                  type="text"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="مثال: INT-8924"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono tracking-wider text-white uppercase focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-teal-400" />
                  <span>اسمك الكامل للدخول: *</span>
                </label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="أدخل اسمك الكريم..."
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {/* Quick Link Share Helper */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-400 truncate dir-ltr">
                {shareableUrl}
              </span>
              <button
                type="button"
                onClick={copyShareLink}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg font-medium transition flex items-center gap-1 shrink-0"
              >
                {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'تم النسخ' : 'نسخ الرابط'}</span>
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-extrabold rounded-2xl text-base transition shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2"
            >
              <Video className="w-5 h-5" />
              <span>دخول غرفة المقابلة المباشرة</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
