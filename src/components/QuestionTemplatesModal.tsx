import React, { useState } from 'react';
import { HelpCircle, Code, Users, Briefcase, Plus, Trash2, X, Check } from 'lucide-react';
import { InterviewQuestion } from '../types';

interface QuestionTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: InterviewQuestion[];
  onAddQuestion: (q: Omit<InterviewQuestion, 'id'>) => void;
  onDeleteQuestion: (id: string) => void;
}

export const DEFAULT_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'q1',
    category: 'عامة',
    question: 'عرفنا بنفسك وأبرز المحطات في مسيرتك المهنية والتحديات التي واجهتها؟',
    expectedAnswer: 'إجابة تسلسلية تركز على الإنجازات والتعلم من الأخطاء',
  },
  {
    id: 'q2',
    category: 'عامة',
    question: 'لماذا ترغب في الانضمام لفريقنا بالذات، وما الميزة التنافسية التي تضيفها؟',
    expectedAnswer: 'إظهار معرفة بالشركة ورغبة صادقة في التطور',
  },
  {
    id: 'q3',
    category: 'تقنية',
    question: 'كيف تتعامل مع مشكلات الأداء أو الضغط وساعات العمل الحرجة؟',
    expectedAnswer: 'تنظيم الأولويات واستخدام التحليل البرمجي والمنطقي',
  },
  {
    id: 'q4',
    category: 'قيادية',
    question: 'صف موقفاً اختلفت فيه في الرأي مع مديرك أو زميلك وكيف حللت الموقف؟',
    expectedAnswer: 'المرونة والتواصل الدبلوماسي القائم على الأدلة والبراهين',
  },
];

export const QuestionTemplatesModal: React.FC<QuestionTemplatesModalProps> = ({
  isOpen,
  onClose,
  questions,
  onAddQuestion,
  onDeleteQuestion,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [newCat, setNewCat] = useState<string>('عامة');
  const [newQuestionText, setNewQuestionText] = useState<string>('');
  const [newExpected, setNewExpected] = useState<string>('');

  if (!isOpen) return null;

  const categories = ['الكل', ...Array.from(new Set(questions.map((q) => q.category)))];

  const filtered = selectedCategory === 'الكل'
    ? questions
    : questions.filter((q) => q.category === selectedCategory);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;

    onAddQuestion({
      category: newCat,
      question: newQuestionText.trim(),
      expectedAnswer: newExpected.trim(),
    });

    setNewQuestionText('');
    setNewExpected('');
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
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">دليل بنك الأسئلة للمقابلة</h3>
            <p className="text-xs text-slate-400">أسئلة توجيهية للمضيف للاستعانة بها أثناء المقابلة المباشرة</p>
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex flex-wrap gap-2 mb-5 pb-3 border-b border-slate-800">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedCategory === cat
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Questions List */}
        <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-1">
          {filtered.map((q) => (
            <div
              key={q.id}
              className="p-3 bg-slate-950 border border-slate-800 rounded-xl relative group hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="inline-block text-[10px] bg-slate-800 text-teal-300 px-2 py-0.5 rounded font-mono mb-1">
                    {q.category}
                  </span>
                  <p className="text-xs font-bold text-slate-100">{q.question}</p>
                  {q.expectedAnswer && (
                    <p className="text-[11px] text-slate-400 mt-1">💡 الإجابة المتوقعة: {q.expectedAnswer}</p>
                  )}
                </div>
                <button
                  onClick={() => onDeleteQuestion(q.id)}
                  className="p-1 text-slate-500 hover:text-red-400 transition"
                  title="حذف السؤال"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Question Form */}
        <form onSubmit={handleAdd} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
          <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-teal-400" />
            <span>إضافة سؤال جديد لبنك الأسئلة:</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              placeholder="التصنيف (مثال: تقنية)"
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
            />
            <input
              type="text"
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              placeholder="السؤال..."
              className="sm:col-span-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
            />
          </div>

          <input
            type="text"
            value={newExpected}
            onChange={(e) => setNewExpected(e.target.value)}
            placeholder="ملاحظة الإجابة المتوقعة (اختياري)..."
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
          />

          <button
            type="submit"
            className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة للبنك</span>
          </button>
        </form>
      </div>
    </div>
  );
};
