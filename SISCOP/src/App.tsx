import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/navigation/Navbar';
import { Dashboard } from './components/dashboard/Dashboard';
import { GdaModule } from './components/gda/GdaModule';
import { GidModule } from './components/gid/GidModule';
import { PopModule } from './components/pop/PopModule';
import { AuditLogModal } from './components/logs/AuditLogModal';
import { LoginModal } from './components/auth/LoginModal';
import { BackupManagerModal } from './components/backup/BackupManagerModal';
import { SetupModal } from './components/setup/SetupModal';
import { AboutModal } from './components/about/AboutModal';
import { FichaCadastralModal } from './components/gid/FichaCadastralModal';

const AppContent: React.FC = () => {
  const {
    currentView,
    currentUser,
    fichaModalCard,
    fichaModalMode,
    isFichaModalOpen,
    closeFichaModal,
    updateCard,
    openFichaModal,
  } = useApp();
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  // If not logged in, require login modal
  if (!currentUser) {
    return <LoginModal isMandatory={true} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Fixed Navigation Bar */}
      <Navbar
        onOpenLogs={() => setShowLogsModal(true)}
        onOpenLogin={() => setShowLoginModal(true)}
        onOpenBackup={() => setShowBackupModal(true)}
        onOpenSetup={() => setShowSetupModal(true)}
        onOpenAbout={() => setShowAboutModal(true)}
      />

      {/* Main View Router */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {currentView === 'DASHBOARD' && (
          <Dashboard
            onOpenLogs={() => setShowLogsModal(true)}
            onOpenBackup={() => setShowBackupModal(true)}
          />
        )}
        {currentView === 'GDA' && <GdaModule />}
        {currentView === 'GID' && <GidModule />}
        {currentView === 'POP' && <PopModule />}
      </main>

      {/* About Modal (Sobre SISCOP) */}
      {showAboutModal && (
        <AboutModal
          isOpen={showAboutModal}
          onClose={() => setShowAboutModal(false)}
        />
      )}

      {/* Setup da Plataforma Modal */}
      {showSetupModal && (
        <SetupModal
          isOpen={showSetupModal}
          onClose={() => setShowSetupModal(false)}
        />
      )}

      {/* Audit Logs & Report Modal */}
      {showLogsModal && <AuditLogModal onClose={() => setShowLogsModal(false)} />}

      {/* System Backup Manager Modal */}
      {showBackupModal && (
        <BackupManagerModal
          isOpen={showBackupModal}
          onClose={() => setShowBackupModal(false)}
        />
      )}

      {/* Optional Operator Switching / Login Modal */}
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} isMandatory={false} />
      )}

      {/* Ficha Cadastral Oficial do Associado */}
      {isFichaModalOpen && fichaModalCard && (
        <FichaCadastralModal
          isOpen={isFichaModalOpen}
          onClose={closeFichaModal}
          card={fichaModalCard}
          initialMode={fichaModalMode}
          onSave={(updated) => {
            updateCard(updated.id, updated);
            openFichaModal(updated, 'VIEW');
          }}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
