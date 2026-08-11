import React, { useState } from 'react';
import { ShieldCheck, Lock, Key, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface HostAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isHostLoggedIn: boolean;
  onAuthenticateHost: (passcode: string) => boolean;
  onLogoutHost: () => void;
  currentPasscode: string;
  onChangePasscode: (newPasscode: string) => void;
}

export const HostAuthModal: React.FC<HostAuthModalProps> = ({
  isOpen,
  onClose,
  isHostLoggedIn,
  onAuthenticateHost,
  onLogoutHost,
  currentPasscode,
  onChangePasscode,
}) => {
  const [inputPin, setInputPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (onAuthenticateHost(inputPin)) {
      setInputPin('');
      onClose();
    } else {
      setErrorMsg('رمز المرور غير صحيح. الرمز الافتراضي هو: 1234');
    }
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin || newPin.trim().length < 4) {
      setErrorMsg('يرجى إدخال رمز مرور مكون من 4 خانات على الأقل');
      return;
    }
    onChangePasscode(newPin.trim());
    setSuccessMsg('تم تحديث رمز مرور المضيف بنجاح');
    setIsChangingPin(false);
    setNewPin('');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-100">
        <button
          id="host-auth-modal-close"
          onClick={onClose}
          className="absolute top-4 left-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">بوابة المضيف (صاحب الموقع)</h3>
            <p className="text-xs text-slate-400">الوصول الحصري للخزنة والتسجيلات التلقائية</p>
          </div>
        </div>

        {isHostLoggedIn ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-200 text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-300">أنت في وضع المضيف حالياً</p>
                <p className="text-xs text-emerald-200/80 mt-1">
                  جميع التسجيلات التلقائية تحفظ في خزنتك الخاصة، وتكون مخفية تماماً عن الزوار والمرشحين.
                </p>
              </div>
            </div>

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-lg">
                {successMsg}
              </div>
            )}

            {!isChangingPin ? (
              <div className="space-y-3">
                <button
                  id="btn-open-change-pin"
                  onClick={() => setIsChangingPin(true)}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium border border-slate-700 transition flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>تغيير رمز مرور المضيف</span>
                </button>

                <button
                  id="btn-logout-host"
                  onClick={() => {
                    onLogoutHost();
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-medium border border-red-500/20 transition flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>القفل والخروج لوضع المرشح</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveNewPin} className="space-y-3 bg-slate-800/60 p-4 rounded-xl border border-slate-700">
                <label className="block text-xs font-medium text-slate-300">رمز المرور الجديد للمضيف:</label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="أدخل 4 أرقام أو رموز..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition"
                  >
                    حفظ الرمز
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsChangingPin(false)}
                    className="px-3 py-2 bg-slate-700 text-slate-300 text-xs rounded-lg"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-slate-200">🔒 ميزة الخصوصية التامة:</p>
              <p>• الزوار والمرشحون لا يستطيعون رؤية التسجيلات أو خيارات التحميل.</p>
              <p>• الرمز الافتراضي للمضيف الجديد هو: <span className="font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">1234</span></p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">أدخل رمز مرور المضيف للتحقق:</label>
              <input
                id="input-host-pin"
                type="password"
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value)}
                placeholder="****"
                autoFocus
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-center text-lg tracking-widest font-mono text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              id="btn-submit-host-pin"
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-sm transition shadow-md shadow-amber-950/30 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>تأكيد ودخول المضيف</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
