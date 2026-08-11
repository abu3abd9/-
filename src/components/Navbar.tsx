import React from 'react';
import { Video, Lock, Unlock, HardDrive, Settings, HelpCircle, Shield, Award, Download } from 'lucide-react';
import { QualityConfig } from '../types';

interface NavbarProps {
  isHost: boolean;
  onToggleHostAuth: () => void;
  onOpenVault: () => void;
  onOpenSettings: () => void;
  onOpenQuestions: () => void;
  onOpenExportGuide?: () => void;
  qualityConfig: QualityConfig;
  currentRoomId?: string | null;
  onLeaveRoom?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isHost,
  onToggleHostAuth,
  onOpenVault,
  onOpenSettings,
  onOpenQuestions,
  onOpenExportGuide,
  qualityConfig,
  currentRoomId,
  onLeaveRoom
}) => {
  return (
    <header id="main-app-header" className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 space-x-reverse cursor-pointer" onClick={() => onLeaveRoom && onLeaveRoom()}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-950/40">
              <Video className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl text-slate-100 tracking-tight">اجتماع</span>
                <span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded-full">
                  HD {qualityConfig.resolution.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">منصة الاجتماعات المباشرة مع الحفظ التلقائي المحمي</p>
            </div>
          </div>

          {/* Action Links */}
          <div className="flex items-center space-x-2 space-x-reverse">
            {/* Host Only Links */}
            {isHost ? (
              <>
                <button
                  id="nav-btn-recordings-vault"
                  onClick={onOpenVault}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/60 hover:border-emerald-400 transition text-sm font-medium shadow-sm"
                  title="فتح خزنة التسجيلات المحفوظة الخاصة بالمضيف فقط"
                >
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  <span className="hidden md:inline">خزنة التسجيلات</span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded-full">السرية</span>
                </button>

                <button
                  id="nav-btn-question-bank"
                  onClick={onOpenQuestions}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition text-sm font-medium"
                  title="بنك أسئلة المقابلة"
                >
                  <HelpCircle className="w-4 h-4 text-teal-400" />
                  <span>دليل الأسئلة</span>
                </button>
              </>
            ) : null}

            {/* Export / Download Code Button */}
            {onOpenExportGuide && (
              <button
                id="nav-btn-export-guide"
                onClick={onOpenExportGuide}
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-950/60 border border-teal-500/30 text-teal-300 hover:bg-teal-900/60 hover:border-teal-400 transition text-sm font-medium shadow-sm"
                title="طريقة تنزيل وتصدير كود الموقع كاملاً ZIP أو GitHub"
              >
                <Download className="w-4 h-4 text-teal-400" />
                <span>تنزيل الموقع 📦</span>
              </button>
            )}

            {/* Quality & Camera Settings Button */}
            <button
              id="nav-btn-quality-settings"
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition text-sm font-medium"
              title="إعدادات الكاميرا والميكروفون والجودة"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">الجودة والكاميرا</span>
            </button>

            {/* Host Authentication Toggle Pill */}
            <button
              id="nav-btn-host-auth"
              onClick={onToggleHostAuth}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition border shadow-sm ${
                isHost
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {isHost ? (
                <>
                  <Unlock className="w-4 h-4 text-amber-400" />
                  <span>المضيف المعتمد</span>
                  <Shield className="w-3.5 h-3.5 text-amber-400 hidden sm:inline" />
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>دخول المضيف</span>
                </>
              )}
            </button>

            {currentRoomId && onLeaveRoom && (
              <button
                id="nav-btn-leave-room"
                onClick={onLeaveRoom}
                className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium transition"
              >
                مغادرة الغرفة
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
