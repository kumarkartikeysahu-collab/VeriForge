import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { IngestionPanel } from './components/IngestionPanel';
import { ForensicLens } from './components/ForensicLens';
import { AlgorithmicMatrix } from './components/AlgorithmicMatrix';
import { BiometricVerifier } from './components/BiometricVerifier';
import { ThreatScoreGauge } from './components/ThreatScoreGauge';
import { DossierModal } from './components/DossierModal';
import { GuidelinesModal } from './components/GuidelinesModal';

export default function App() {
  const [activeScenario, setActiveScenario] = useState(null);
  const [maskAadhaar, setMaskAadhaar] = useState(true);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);

  const handleCustomUpload = (customData) => {
    setActiveScenario(customData);
  };

  const handleClearDocument = () => {
    setActiveScenario(null);
  };

  const handleResetSession = () => {
    setActiveScenario(null);
  };

  const handleUpdateBiometrics = (biometricUpdates) => {
    setActiveScenario((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        ...biometricUpdates
      };
      // Re-evaluate threat level if threatScore changed
      if (typeof updated.threatScore === 'number') {
        updated.status = updated.threatScore < 25 ? 'SAFE' : updated.threatScore < 75 ? 'MEDIUM RISK (MANUAL REVIEW)' : 'CRITICAL';
      }
      return updated;
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)', paddingBottom: '32px' }}>
      
      {/* Top Navbar */}
      <Navbar
        threatLevel={activeScenario?.status}
        maskAadhaar={maskAadhaar}
        onToggleMaskAadhaar={() => setMaskAadhaar(!maskAadhaar)}
        onOpenDossier={() => setIsDossierOpen(true)}
        onOpenGuidelines={() => setIsGuidelinesOpen(true)}
        onResetSession={handleResetSession}
      />

      {/* Main 2-Column Workstation */}
      <main className="container" style={{ flex: 1 }}>
        <div className="layout-grid">
          
          {/* Left Column: Document Selection, Preview & Forensic Heatmap */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <IngestionPanel
              activeScenario={activeScenario}
              onCustomUpload={handleCustomUpload}
              onClearDocument={handleClearDocument}
            />

            <ForensicLens
              activeScenario={activeScenario}
              maskAadhaar={maskAadhaar}
            />
          </div>

          {/* Right Column: Risk Score, Algorithmic Checksum & Biometrics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <ThreatScoreGauge
              activeScenario={activeScenario}
            />

            <AlgorithmicMatrix
              activeScenario={activeScenario}
            />

            <BiometricVerifier
              activeScenario={activeScenario}
              onUpdateBiometrics={handleUpdateBiometrics}
            />
          </div>

        </div>
      </main>

      {/* Printable Report Modal */}
      <DossierModal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        activeScenario={activeScenario}
        maskAadhaar={maskAadhaar}
      />

      {/* Forensic Standards & Guidelines Handbook Modal */}
      <GuidelinesModal
        isOpen={isGuidelinesOpen}
        onClose={() => setIsGuidelinesOpen(false)}
      />

      {/* Footer */}
      <footer style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        Smart India Hackathon 2026 • Problem Statement SIH26188 • Ministry of Home Affairs (MHA)
      </footer>

    </div>
  );
}
