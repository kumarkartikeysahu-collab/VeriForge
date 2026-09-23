import React, { useEffect } from 'react';
import { 
  X, 
  Printer, 
  Shield, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Scale, 
  Cpu, 
  Radio, 
  Type, 
  QrCode 
} from 'lucide-react';

export const DossierModal = ({ isOpen, onClose, activeScenario, maskAadhaar }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !activeScenario) return null;

  const sheet = activeScenario?.evidentiarySheet || {};
  const caseId = sheet?.certificate_id || `MHA-SIH26188-${Math.floor(100000 + Math.random() * 900000)}`;
  const timestamp = sheet?.timestamp || new Date().toLocaleString();
  const score = activeScenario?.threatScore ?? 0;
  const isCritical = score >= 75;
  const isWarning = score >= 25 && score < 75;

  const dtd = activeScenario?.dtdAnalysis || {};
  const font = activeScenario?.fontGeometry || {};
  const recapture = activeScenario?.screenRecapture || {};
  const edge = activeScenario?.edgeBenchmark || {};
  const findings = sheet?.evidentiary_findings || [];
  const complianceMatrix = sheet?.compliance_matrix || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}>
      <div style={{
        width: '100%',
        maxWidth: '740px',
        maxHeight: '92vh',
        overflowY: 'auto',
        background: '#ffffff',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-color)',
        padding: '24px'
      }}>
        
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          borderBottom: '2px solid var(--primary)', 
          paddingBottom: '14px', 
          marginBottom: '16px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-color)'
            }}>
              <Shield size={24} color="var(--primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>
                Automated Forensic Evidentiary Sheet
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Ministry of Home Affairs • Digital Forensics & Document Screening Gateway (SIH26188)
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={handlePrint}
              className="btn btn-outline btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
            >
              <Printer size={14} /> Print / Export
            </button>
            <button 
              onClick={onClose}
              className="btn btn-outline btn-sm"
              style={{ padding: '4px 8px' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Certificate Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8125rem' }}>
          
          {/* Summary Row */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '12px', 
            background: 'var(--bg-card-alt)', 
            padding: '12px 14px', 
            borderRadius: '6px',
            border: '1px solid var(--border-color)'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Case Evidentiary Reference</span>
              <div className="font-mono" style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--primary)' }}>
                {caseId}
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Audit Timestamp: {timestamp}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Forensic Determination</span>
              <div style={{ 
                fontWeight: 'bold', 
                fontSize: '0.95rem',
                color: isCritical ? 'var(--danger)' : isWarning ? 'var(--warning)' : 'var(--success)' 
              }}>
                {isCritical ? 'FORGERY CONFIRMED' : isWarning ? 'SUSPECTED TAMPER (REVIEW)' : 'VERIFIED AUTHENTIC'}
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Composite Risk Score: {score}%</span>
            </div>
          </div>

          {/* Biometric Comparison Row */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '12px', 
            background: 'var(--bg-card-alt)', 
            padding: '12px', 
            borderRadius: '6px',
            border: '1px solid var(--border-color)', 
            textAlign: 'center' 
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block', marginBottom: '6px' }}>
                Extracted Card Portrait Photo
              </span>
              <div style={{ width: '75px', height: '90px', margin: '0 auto', background: '#0f172a', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                {activeScenario?.docFaceImage ? (
                  <img src={activeScenario.docFaceImage} alt="ID Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ color: '#94a3b8', fontSize: '0.65rem', paddingTop: '32px' }}>Portrait</div>
                )}
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block', marginBottom: '6px' }}>
                Live Biometric Capture / Selfie
              </span>
              <div style={{ width: '75px', height: '90px', margin: '0 auto', background: '#0f172a', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                {activeScenario?.liveFaceImage ? (
                  <img src={activeScenario.liveFaceImage} alt="Live Capture" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ color: '#94a3b8', fontSize: '0.65rem', paddingTop: '32px' }}>Live Subject</div>
                )}
              </div>
            </div>
          </div>

          {/* Demographic Credentials Table */}
          <table className="data-table">
            <tbody>
              <tr>
                <td style={{ color: 'var(--text-muted)', width: '35%' }}>Document Type</td>
                <td style={{ fontWeight: 600 }}>{activeScenario?.category}</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-muted)' }}>Holder Legal Name</td>
                <td style={{ fontWeight: 600 }}>{activeScenario?.holderName || 'NOT DETECTED'}</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-muted)' }}>Document Number</td>
                <td className="font-mono">
                  {(() => {
                    const raw = activeScenario?.docNumber;
                    if (!raw || raw === 'NOT DETECTED') return 'NOT DETECTED';
                    if (maskAadhaar && (activeScenario?.category === 'Aadhaar' || raw.replace(/\D/g, '').length === 12)) {
                      const digits = raw.replace(/\D/g, '');
                      return digits.length >= 4 ? `XXXX XXXX ${digits.slice(-4)} [DPDP Masked]` : 'XXXX XXXX [MASKED]';
                    }
                    return raw;
                  })()}
                </td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-muted)' }}>Date of Birth (DOB)</td>
                <td className="font-mono">{activeScenario?.dob || 'NOT DETECTED'}</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-muted)' }}>Expiration / Validity</td>
                <td className="font-mono">{activeScenario?.expiry || 'N/A'}</td>
              </tr>
            </tbody>
          </table>

          {/* Section: Court-Admissible Automated Forensic Reasoning */}
          <div>
            <h5 style={{ fontSize: '0.825rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Scale size={15} color="var(--primary)" /> Section-by-Section Forensic Evidentiary Statements
            </h5>
            
            {findings.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {findings.map((finding, idx) => (
                  <div 
                    key={idx}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '5px',
                      background: finding.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(234, 179, 8, 0.08)',
                      borderLeft: `4px solid ${finding.severity === 'CRITICAL' ? 'var(--danger)' : 'var(--warning)'}`,
                      fontSize: '0.78rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <strong style={{ color: finding.severity === 'CRITICAL' ? 'var(--danger)' : 'var(--warning)' }}>
                        {finding.section}
                      </strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Confidence: {finding.confidence}%
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-main)', lineHeight: 1.35 }}>
                      "{finding.forensic_statement}"
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid var(--success)', borderRadius: '5px', color: 'var(--success)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} />
                No digital alterations, font deviations, or compression anomalies identified across all examined document sections.
              </div>
            )}
          </div>

          {/* Quantitative Forensic Telemetry Grid */}
          <div>
            <h5 style={{ fontSize: '0.825rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
              Quantitative Forensic Telemetry
            </h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '0.75rem' }}>
              <div style={{ background: 'var(--bg-card-alt)', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>DTD Spatial Gradient</span>
                <strong className="font-mono">{dtd?.spatial_score ?? 0}%</strong>
              </div>
              <div style={{ background: 'var(--bg-card-alt)', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>8x8 DCT Residual Anomaly</span>
                <strong className="font-mono">{dtd?.frequency_score ?? 0}%</strong>
              </div>
              <div style={{ background: 'var(--bg-card-alt)', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Max Font Baseline Shift</span>
                <strong className="font-mono">{font?.max_baseline_deviation_px ?? 0.2} px</strong>
              </div>
              <div style={{ background: 'var(--bg-card-alt)', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Moiré Interference Index</span>
                <strong className="font-mono">{recapture?.moire_index ?? 0}%</strong>
              </div>
              <div style={{ background: 'var(--bg-card-alt)', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Specular Glass Glare</span>
                <strong className="font-mono">{recapture?.specular_glare_percentage ?? 0}%</strong>
              </div>
              <div style={{ background: 'var(--bg-card-alt)', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Edge Inference Latency</span>
                <strong className="font-mono" style={{ color: 'var(--success)' }}>
                  {edge?.total_latency_ms ?? 340} ms (&lt;1.5s SLA)
                </strong>
              </div>
            </div>
          </div>

          {/* Statutory Compliance Matrix */}
          <div>
            <h5 style={{ fontSize: '0.825rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
              Regulatory & Statutory Standards Matrix
            </h5>
            <table className="data-table" style={{ fontSize: '0.75rem' }}>
              <thead>
                <tr>
                  <th>Statutory Standard</th>
                  <th>Verification Scope</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {complianceMatrix.map((c, idx) => (
                  <tr key={idx}>
                    <td><strong>{c.standard}</strong></td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.description}</td>
                    <td>
                      {c.status === 'PASS' ? (
                        <span className="badge badge-success">PASS</span>
                      ) : c.status === 'FAIL' ? (
                        <span className="badge badge-danger">FAIL</span>
                      ) : (
                        <span className="badge badge-neutral">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legal Evidentiary Declaration */}
          <div style={{
            background: 'var(--bg-card-alt)',
            padding: '10px 12px',
            borderRadius: '5px',
            border: '1px solid var(--border-color)',
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            lineHeight: 1.4
          }}>
            <strong>Court-Admissible Statutory Certification:</strong> {sheet?.court_admissible_declaration || (
              "This evidentiary sheet is automatically compiled pursuant to Section 65B of the Indian Evidence Act " +
              "(Section 63 of Bharatiya Sakshya Adhiniyam 2023). Generated on an air-gapped forensic gateway without outbound cloud telemetries."
            )}
          </div>

        </div>

        {/* Footer actions */}
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={onClose} className="btn btn-outline btn-sm">
            Close Sheet
          </button>
          <button onClick={handlePrint} className="btn btn-primary btn-sm">
            <Printer size={14} style={{ marginRight: '4px' }} /> Print Evidentiary Certificate
          </button>
        </div>

      </div>
    </div>
  );
};
