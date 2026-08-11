import React, { useState } from 'react';
import { Award, Star, FileText, Sparkles, Check, X, AlertCircle } from 'lucide-react';
import { EvaluationScore } from '../types';

interface CandidateEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  candidatePosition: string;
  initialEvaluation?: EvaluationScore;
  onSaveEvaluation: (evaluation: EvaluationScore) => void;
  onGenerateAIAnalysis?: () => void;
  isAnalyzing?: boolean;
}

export const CandidateEvaluationModal: React.FC<CandidateEvaluationModalProps> = ({
  isOpen,
  onClose,
  candidateName,
  candidatePosition,
  initialEvaluation,
  onSaveEvaluation,
  onGenerateAIAnalysis,
  isAnalyzing,
}) => {
  const [commScore, setCommScore] = useState<number>(initialEvaluation?.communication || 4);
  const [techScore, setTechScore] = useState<number>(initialEvaluation?.technicalSkill || 4);
  const [probScore, setProbScore] = useState<number>(initialEvaluation?.problemSolving || 4);
  const [fitScore, setFitScore] = useState<number>(initialEvaluation?.culturalFit || 4);
  const [notes, setNotes] = useState<string>(initialEvaluation?.notes || '');

  if (!isOpen) return null;

  // Calculate overall score %
  const avgStar = (commScore + techScore + probScore + fitScore) / 4;
  const overallPercent = Math.round((avgStar / 5) * 100);

  const handleSave = () => {
    onSaveEvaluation({
      communication: commScore,
      technicalSkill: techScore,
      problemSolving: probScore,
      culturalFit: fitScore,
      overallScore: overallPercent,
      notes,
    });
    onClose();
  };

  const renderStars = (value: number, onChange: (v: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 text-slate-600 hover:text-amber-400 transition transform hover:scale-110"
          >
            <Star
              className={`w-5 h-5 ${
                star <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">تقييم المرشح: {candidateName}</h3>
            <p className="text-xs text-slate-400">الوظيفة المتقدم لها: {candidatePosition || 'غير محدد'}</p>
          </div>
        </div>

        {/* Overall Score Badge */}
        <div className="mb-6 p-4 bg-gradient-to-r from-amber-500/10 via-slate-800 to-emerald-500/10 border border-slate-700 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">الدرجة الإجمالية للمرشح:</span>
            <span className="text-2xl font-black text-amber-400">{overallPercent}%</span>
          </div>
          <div className="text-right">
            <span className="text-xs bg-amber-500/20 text-amber-300 font-bold px-2.5 py-1 rounded-full border border-amber-500/30">
              {overallPercent >= 85 ? 'مرشح ممتاز ⭐' : overallPercent >= 70 ? 'جيد جداً 👍' : 'تحت المراجعة'}
            </span>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {/* Communication */}
          <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">مهارات التواصل والحديث</span>
              <span className="text-[10px] text-slate-400">وضوح الأفكار والتفاعل المباشر</span>
            </div>
            {renderStars(commScore, setCommScore)}
          </div>

          {/* Technical Skill */}
          <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">الكفاءة الفنية والخبرة</span>
              <span className="text-[10px] text-slate-400">إجابة أسئلة التخصص والخبرات الميدانية</span>
            </div>
            {renderStars(techScore, setTechScore)}
          </div>

          {/* Problem Solving */}
          <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">حل المشكلات والتفكير التحليلي</span>
              <span className="text-[10px] text-slate-400">السرعة البديهية والتصرف في المواقف</span>
            </div>
            {renderStars(probScore, setProbScore)}
          </div>

          {/* Cultural Fit */}
          <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">الملائمة وثقافة العمل</span>
              <span className="text-[10px] text-slate-400">الالتزام بالوقت والمظهر الاحترافي</span>
            </div>
            {renderStars(fitScore, setFitScore)}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-teal-400" />
              <span>ملاحظات المضيف التفصيلية:</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="اكتب ملاحظاتك الانطباعية حول أداء المرشح أثناء المقابلة..."
              className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* AI Generator Option */}
        {onGenerateAIAnalysis && (
          <div className="mb-6 p-3 bg-teal-950/40 border border-teal-500/30 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-400" />
              <div>
                <span className="text-xs font-bold text-teal-300 block">التحليل الذكي بواسطة Gemini AI</span>
                <span className="text-[10px] text-teal-200/70">توليد تقرير تلقائي مستخلص من المقابلة</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onGenerateAIAnalysis}
              disabled={isAnalyzing}
              className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs rounded-lg transition disabled:opacity-50"
            >
              {isAnalyzing ? 'جاري التحليل...' : 'توليد التقرير'}
            </button>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>حفظ التقييم</span>
          </button>
        </div>
      </div>
    </div>
  );
};
