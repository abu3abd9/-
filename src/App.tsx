import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HostAuthModal } from './components/HostAuthModal';
import { QualitySettingsModal } from './components/QualitySettingsModal';
import { QuestionTemplatesModal, DEFAULT_QUESTIONS } from './components/QuestionTemplatesModal';
import { RecordingsVault } from './components/RecordingsVault';
import { RoomJoin } from './components/RoomJoin';
import { InterviewRoom } from './components/InterviewRoom';
import { AIChatAssistant } from './components/AIChatAssistant';
import { ExportGuideModal } from './components/ExportGuideModal';
import { QualityConfig, RoomSession, InterviewQuestion } from './types';

export default function App() {
  // Host Passcode & Role State
  const [hostPasscode, setHostPasscode] = useState<string>('1234');
  const [isHost, setIsHost] = useState<boolean>(true); // Default true for creator, can lock/unlock

  // Modal Visibility States
  const [isHostAuthOpen, setIsHostAuthOpen] = useState<boolean>(false);
  const [isVaultOpen, setIsVaultOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isQuestionsOpen, setIsQuestionsOpen] = useState<boolean>(false);
  const [isExportGuideOpen, setIsExportGuideOpen] = useState<boolean>(false);

  // Quality Configuration
  const [qualityConfig, setQualityConfig] = useState<QualityConfig>({
    resolution: '1080p',
    fps: 30,
    videoBitrate: 4000000, // 4Mbps for HD crisp quality
    audioBitrate: 128000,
    autoRecord: true,
    echoCancellation: true,
    noiseSuppression: true,
  });

  // Active Session & Questions
  const [currentSession, setCurrentSession] = useState<RoomSession | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>(DEFAULT_QUESTIONS);
  const [urlRoomCode, setUrlRoomCode] = useState<string>('');

  // Check URL parameters for direct join links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setUrlRoomCode(roomParam);
      // If candidate joined via shared link, default role to Candidate view
      setIsHost(false);
    }
  }, []);

  // Host Auth Handlers
  const handleAuthenticateHost = (passcode: string): boolean => {
    if (passcode === hostPasscode) {
      setIsHost(true);
      return true;
    }
    return false;
  };

  const handleLogoutHost = () => {
    setIsHost(false);
  };

  const handleChangePasscode = (newPasscode: string) => {
    setHostPasscode(newPasscode);
  };

  const handleJoinRoom = (session: RoomSession, isHostUser: boolean) => {
    setIsHost(isHostUser);
    setCurrentSession(session);
  };

  const handleLeaveRoom = () => {
    setCurrentSession(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Header Navbar */}
      <Navbar
        isHost={isHost}
        onToggleHostAuth={() => setIsHostAuthOpen(true)}
        onOpenVault={() => {
          if (isHost) {
            setIsVaultOpen(true);
          } else {
            setIsHostAuthOpen(true);
          }
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenQuestions={() => setIsQuestionsOpen(true)}
        onOpenExportGuide={() => setIsExportGuideOpen(true)}
        qualityConfig={qualityConfig}
        currentRoomId={currentSession?.id}
        onLeaveRoom={handleLeaveRoom}
      />

      {/* Main App Content View */}
      <main className="flex-1 flex flex-col">
        {currentSession ? (
          <InterviewRoom
            session={currentSession}
            isHost={isHost}
            qualityConfig={qualityConfig}
            onLeaveRoom={handleLeaveRoom}
            questions={questions}
            onOpenVault={() => setIsVaultOpen(true)}
          />
        ) : (
          <RoomJoin
            isHost={isHost}
            onRequestHostAuth={() => setIsHostAuthOpen(true)}
            onJoinRoom={handleJoinRoom}
            initialRoomCode={urlRoomCode}
          />
        )}
      </main>

      {/* Modals & Dialogs */}
      <HostAuthModal
        isOpen={isHostAuthOpen}
        onClose={() => setIsHostAuthOpen(false)}
        isHostLoggedIn={isHost}
        onAuthenticateHost={handleAuthenticateHost}
        onLogoutHost={handleLogoutHost}
        currentPasscode={hostPasscode}
        onChangePasscode={handleChangePasscode}
      />

      <QualitySettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={qualityConfig}
        onUpdateConfig={(newConfig) => setQualityConfig(newConfig)}
      />

      <QuestionTemplatesModal
        isOpen={isQuestionsOpen}
        onClose={() => setIsQuestionsOpen(false)}
        questions={questions}
        onAddQuestion={(q) =>
          setQuestions((prev) => [...prev, { ...q, id: 'q_' + Date.now() }])
        }
        onDeleteQuestion={(id) =>
          setQuestions((prev) => prev.filter((q) => q.id !== id))
        }
      />

      <RecordingsVault
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        isHost={isHost}
        onRequestHostLogin={() => {
          setIsVaultOpen(false);
          setIsHostAuthOpen(true);
        }}
      />

      <ExportGuideModal
        isOpen={isExportGuideOpen}
        onClose={() => setIsExportGuideOpen(false)}
      />

      {/* Floating AI Assistant Widget */}
      <AIChatAssistant />
    </div>
  );
}
