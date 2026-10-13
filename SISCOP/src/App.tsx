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
import { ErrorBoundary } from './components/common/ErrorBoundary';

const AppContent: React.FC = () => {
  const {
    currentView,
    currentUser,
    cards,
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

            // Se for Plano Familiar, replicar localização física e número do plano para os dependentes
            const isFam = updated.category === 'PLANO_FAMILIAR' || updated.planType === 'FAMILIAR';
            if (isFam && updated.isTitular) {
              const dependents = cards.filter((c) => c.familyHeadId === updated.id);
              dependents.forEach((dep, idx) => {
                const depUpdates: Partial<typeof updated> = {};
                if (updated.physicalArchiveLocation !== undefined) {
                  depUpdates.physicalArchiveLocation = updated.physicalArchiveLocation;
                }
                if (updated.controlNumber) {
                  const typedNum = updated.controlNumber.trim();
                  if (/-\d+$/.test(typedNum)) {
                    const base = typedNum.replace(/-\d+$/, '').trim();
                    depUpdates.controlNumber = `${base}-${String(idx + 2).padStart(2, '0')}`;
                  } else {
                    depUpdates.controlNumber = typedNum;
                  }
                }
                if (Object.keys(depUpdates).length > 0) {
                  updateCard(dep.id, depUpdates);
                }
              });
            }

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
      <ErrorBoundary fallbackTitle="SISCOP • Praça de Esportes">
        <AppContent />
      </ErrorBoundary>
    </AppProvider>
  );
}
