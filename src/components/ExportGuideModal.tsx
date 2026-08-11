import React, { useState } from 'react';
import { Download, Github, FileArchive, FileCode, Check, Copy, Sparkles, ExternalLink, X, HelpCircle } from 'lucide-react';

interface ExportGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportGuideModal: React.FC<ExportGuideModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'الطريقة الأولى: التنزيل المباشر كملف مضغوط (ZIP)',
      desc: 'في أعلى الشاشة الخارجية للمنصة (في شريط Google AI Studio العلوي على اليمين أو اليسار):',
      details: [
        '1. اضغط على زِر القائمة أو الإعدادات ⚙️ (أو قائمة ... الثلاث نقاط).',
        '2. اختر خيار "Export project" أو "Download ZIP".',
        '3. سيتم تنزيل مجلد المشروع كاملاً بجميع ملفات السورس كود برابط واحد!'
      ]
    },
    {
      title: 'الطريقة الثانية: الربط والتصدير الحيي إلى GitHub',
      desc: 'لنقل الكود إلى حسابك في جيت هاب بضغطة زر واحدة:',
      details: [
        '1. اضغط على خيار "Settings" أو "Export".',
        '2. حدد "Export to GitHub".',
        '3. قم بربط حسابك في GitHub وسيتم إنشاء مستودع (Repository) تلقائياً يحتوي كافة ملفات المنصة.'
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 text-slate-100 space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-md">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">طريقة تنزيل وتصدير كود الموقع كاملاً 📦</h2>
            <p className="text-xs text-slate-400">خطوات تنزيل كود منصة "اجتماع" كملف ZIP أو تصديره إلى GitHub</p>
          </div>
        </div>

        <div className="space-y-4">
          {steps.map((step, idx) => (
            <div key={idx} className="p-4 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-2">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>{step.title}</span>
              </h3>
              <p className="text-xs text-slate-300">{step.desc}</p>
              <ul className="text-xs text-slate-400 space-y-1 pr-2 pt-1">
                {step.details.map((d, dIdx) => (
                  <li key={dIdx} className="leading-relaxed">{d}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-center gap-2">
          <HelpCircle className="w-5 h-5 flex-shrink-0" />
          <span>تنبيه: زر التصدير (Export / Download) يوجد في القائمة العلوية لمنصة Google AI Studio نفسها في الزاوية العلوية للمعاينة.</span>
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg"
          >
            فهمت ذلك، إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
