import React, { useState, useEffect } from 'react';
import {
  HardDrive, Play, Download, Trash2, Sparkles, Search, Filter,
  Calendar, Clock, User, Award, CheckCircle2, AlertTriangle, FileText, X, Video, ShieldAlert
} from 'lucide-react';
import { StoredRecordingRecord, getAllRecordingsFromDB, deleteRecordingFromDB, updateRecordingDetailsInDB } from '../lib/db';
import { SavedRecording } from '../types';

interface RecordingsVaultProps {
  isOpen: boolean;
  onClose: () => void;
  isHost: boolean;
  onRequestHostLogin: () => void;
}

export const RecordingsVault: React.FC<RecordingsVaultProps> = ({
  isOpen,
  onClose,
  isHost,
  onRequestHostLogin,
}) => {
  const [recordings, setRecordings] = useState<StoredRecordingRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeVideo, setActiveVideo] = useState<{ record: StoredRecordingRecord; url: string } | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<StoredRecordingRecord | null>(null);

  const fetchRecordings = async () => {
    setLoading(true);
    try {
      const records = await getAllRecordingsFromDB();
      setRecordings(records);
    } catch (err) {
      console.error('Failed to load recordings from IndexedDB:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isHost) {
      fetchRecordings();
    }
  }, [isOpen, isHost]);

  if (!isOpen) return null;

  // If candidate tries to open vault without host auth
  if (!isHost) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-center space-y-4 text-slate-100 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold">وصول محمي ومحجوب</h3>
          <p className="text-xs text-slate-400">
            خزنة التسجيلات متاحة فقط للمضيف (صاحب الموقع). المرشحون والزوار ليس لديهم صلاحية لاستعراض التسجيلات.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
            >
              إغلاق
            </button>
            <button
              onClick={() => {
                onClose();
                onRequestHostLogin();
              }}
              className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
            >
              دخول المضيف
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`هل أنت تأكد من حذف تسجيل المقابلة الخاص بالمرشح "${name}"؟`)) {
      await deleteRecordingFromDB(id);
      fetchRecordings();
    }
  };

  const handleDownload = (rec: StoredRecordingRecord) => {
    const url = URL.createObjectURL(rec.videoBlob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (rec.candidateName || 'Interview').replace(/\s+/g, '_');
    const dateStr = new Date(rec.createdAt).toISOString().slice(0, 10);
    a.download = `Interview_${safeName}_${dateStr}.${rec.mimeType.includes('mp4') ? 'mp4' : 'webm'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const handleDownloadReport = (rec: StoredRecordingRecord) => {
    const dateFormatted = new Date(rec.createdAt).toLocaleString('ar-SA');
    const content = `=====================================================
        منصة اجتماع | Ejtema Studio
    تقرير توثيق جلسة المقابلة والتقييم المحفوظ
=====================================================

معرف التسجيل: ${rec.id}
عنوان الجلسة: ${rec.title}
اسم المرشح: ${rec.candidateName || 'غير محدد'}
المسمى الوظيفي: ${rec.candidatePosition || 'غير محدد'}
تاريخ التسجيل: ${dateFormatted}
دقة الفيديو: ${rec.resolution || '1080p'}
حجم الملف: ${rec.fileSizeMB} ميجابايت
مدة الفيديو: ${Math.floor(rec.durationSeconds / 60)} دقيقة و ${Math.floor(rec.durationSeconds % 60)} ثانية

-----------------------------------------------------
[1] تقييم الذكاء الاصطناعي (إن وجد):
-----------------------------------------------------
النتيجة الذكية: ${rec.aiAnalysis?.score || 'غير محلل بعد'}%
الملخص: ${rec.aiAnalysis?.summary || 'لا يوجد ملخص آلي.'}

نقاط القوة:
${rec.aiAnalysis?.strengths?.map((s) => `- ${s}`).join('\n') || '- غير متوفرة'}

نقاط التطوير:
${rec.aiAnalysis?.weaknesses?.map((w) => `- ${w}`).join('\n') || '- غير متوفرة'}

-----------------------------------------------------
[2] تقييم المضيف الرقمي:
-----------------------------------------------------
- التواصل والعرض: ${rec.evaluation?.communication || 0}/100
- المهارات التقنية: ${rec.evaluation?.technicalSkill || 0}/100
- حل المشكلات: ${rec.evaluation?.problemSolving || 0}/100
- التوافق الثقافي والمهني: ${rec.evaluation?.culturalFit || 0}/100
-----------------------------------------------------
النتيجة الإجمالية النهائي: ${rec.evaluation?.overallScore || 0}%

ملاحظات التقييم:
${rec.evaluation?.notes || 'لم تتم إضافة ملاحظات.'}

=====================================================
تم حفظ وتصدير هذا التقرير من خزنة اجتماع السرية
=====================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (rec.candidateName || 'Interview').replace(/\s+/g, '_');
    a.download = `Ejtema_Report_${safeName}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const handlePlayVideo = (rec: StoredRecordingRecord) => {
    const url = URL.createObjectURL(rec.videoBlob);
    setActiveVideo({ record: rec, url });
  };

  const handleAnalyzeAI = async (rec: StoredRecordingRecord) => {
    setAnalyzingId(rec.id);
    try {
      const response = await fetch('/api/analyze-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateName: rec.candidateName,
          position: rec.candidatePosition,
          durationMinutes: Math.ceil(rec.durationSeconds / 60),
          notes: rec.evaluation?.notes || 'تم إجراء المقابلة وحفظ الفيديو التلقائي بنجاح.',
        }),
      });

      const data = await response.json();
      if (data) {
        await updateRecordingDetailsInDB(rec.id, {
          aiAnalysis: {
            summary: data.summary,
            strengths: data.strengths || [],
            weaknesses: data.weaknesses || [],
            score: data.score || 85,
            recommendation: data.recommendation || 'accepted',
          },
        });
        await fetchRecordings();
      }
    } catch (err) {
      console.error('AI Analysis Error:', err);
    } finally {
      setAnalyzingId(null);
    }
  };

  const filtered = recordings.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      (r.candidateName && r.candidateName.toLowerCase().includes(term)) ||
      (r.candidatePosition && r.candidatePosition.toLowerCase().includes(term)) ||
      (r.title && r.title.toLowerCase().includes(term))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full p-6 shadow-2xl relative text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100">خزنة التسجيلات السرية المحفوظة</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  خاص للمضيف فقط
                </span>
              </div>
              <p className="text-xs text-slate-400">يتم حفظ تسجيلات المقابلات تلقائياً بجودة عالية هنا وتظل مخفية عن والمرشحين</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="my-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث باسم المرشح أو الوظيفة..."
              className="w-full pr-9 pl-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>عدد التسجيلات:</span>
            <span className="font-bold text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {recordings.length} فيديو
            </span>
          </div>
        </div>

        {/* Recordings Grid / Table */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {loading ? (
            <div className="text-center py-16 text-slate-500 text-xs">جاري تحميل التسجيلات المحفوظة...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl">
              <Video className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">لا توجد تسجيلات حتى الآن</p>
              <p className="text-xs text-slate-500 mt-1">عند بدء أي مقابلة جديدة كـ "مضيف"، سينشئ النظام حليفة تسجيل وتُحفظ هنا تلقائياً.</p>
            </div>
          ) : (
            filtered.map((rec) => {
              const minutes = Math.floor(rec.durationSeconds / 60);
              const seconds = Math.floor(rec.durationSeconds % 60);
              const dateFormatted = new Date(rec.createdAt).toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={rec.id}
                  className="p-4 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  {/* Left Metadata */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-100">{rec.candidateName || 'مرشح'}</span>
                      <span className="text-xs bg-slate-800 text-teal-300 px-2 py-0.5 rounded font-mono">
                        {rec.candidatePosition || 'مقابلة وظيفة'}
                      </span>
                      <span className="text-[10px] bg-slate-800/80 text-slate-400 font-mono px-2 py-0.5 rounded">
                        {rec.resolution || '1080p FHD'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{dateFormatted}</span>
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{minutes}:{seconds < 10 ? '0' : ''}{seconds}</span>
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        الحجم: {rec.fileSizeMB.toFixed(1)} ميجابايت
                      </span>
                    </div>

                    {/* AI Tag */}
                    {rec.aiAnalysis && (
                      <div className="mt-2 p-2 bg-teal-950/40 border border-teal-500/20 rounded-lg text-xs text-teal-200">
                        <div className="flex items-center gap-1.5 font-bold text-teal-300">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>النتيجة الذكية: {rec.aiAnalysis.score}% - {rec.aiAnalysis.recommendation === 'accepted' ? 'قبول' : 'مراجعة'}</span>
                        </div>
                        <p className="line-clamp-1 text-[11px] text-teal-200/80 mt-0.5">{rec.aiAnalysis.summary}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      onClick={() => handlePlayVideo(rec)}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1 shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      <span>مشاهدة</span>
                    </button>

                    <button
                      onClick={() => handleDownload(rec)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition flex items-center gap-1"
                      title="تحميل فيديو المقابلة مباشرة بأعلى جودة"
                    >
                      <Download className="w-3.5 h-3.5 text-teal-400" />
                      <span>تنزيل الفيديو</span>
                    </button>

                    <button
                      onClick={() => handleDownloadReport(rec)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition flex items-center gap-1"
                      title="تنزيل التقرير والملاحظات المكتوبة كملف نصي"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>تنزيل التقرير</span>
                    </button>

                    {!rec.aiAnalysis && (
                      <button
                        onClick={() => handleAnalyzeAI(rec)}
                        disabled={analyzingId === rec.id}
                        className="px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-medium rounded-lg transition flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                        <span>{analyzingId === rec.id ? 'جاري التحليل...' : 'تحليل الذكاء الاصطناعي'}</span>
                      </button>
                    )}

                    {rec.aiAnalysis && (
                      <button
                        onClick={() => setActiveReport(rec)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium rounded-lg transition flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>عرض التقرير</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(rec.id, rec.candidateName)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition"
                      title="حذف التسجيل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Video Player Modal */}
        {activeVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-4 shadow-2xl relative text-slate-100 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h4 className="font-bold text-sm text-slate-100">
                    استعراض تسجيل مقابلة: {activeVideo.record.candidateName}
                  </h4>
                  <span className="text-xs text-slate-400">الدقة: {activeVideo.record.resolution}</span>
                </div>
                <button
                  onClick={() => {
                    URL.revokeObjectURL(activeVideo.url);
                    setActiveVideo(null);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-800">
                <video src={activeVideo.url} controls autoPlay className="w-full h-full object-contain" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => handleDownload(activeVideo.record)}
                  className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>تنزيل الملف المباشر HD</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Report Viewer */}
        {activeReport && activeReport.aiAnalysis && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100 space-y-4">
              <button
                onClick={() => setActiveReport(null)}
                className="absolute top-4 left-4 p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100">تقرير تقييم الذكاء الاصطناعي (Gemini)</h3>
                  <p className="text-xs text-slate-400">المرشح: {activeReport.candidateName}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">النتيجة المحسوبة:</span>
                  <span className="text-lg font-black text-amber-400 font-mono">{activeReport.aiAnalysis.score}%</span>
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-slate-300 mb-1">الملخص العام:</h5>
                  <p className="text-xs text-slate-300 leading-relaxed">{activeReport.aiAnalysis.summary}</p>
                </div>

                {activeReport.aiAnalysis.strengths?.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold text-emerald-400 mb-1">نقاط القوة المميزة:</h5>
                    <ul className="text-xs text-slate-300 space-y-0.5 list-disc list-inside">
                      {activeReport.aiAnalysis.strengths.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeReport.aiAnalysis.weaknesses?.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold text-amber-400 mb-1">مجالات التحسين:</h5>
                    <ul className="text-xs text-slate-300 space-y-0.5 list-disc list-inside">
                      {activeReport.aiAnalysis.weaknesses.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
