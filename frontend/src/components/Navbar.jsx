import React from 'react';
import { Shield, FileText, RotateCcw, Lock, BookOpen } from 'lucide-react';

export const Navbar = ({ 
  threatLevel, 
  maskAadhaar, 
  onToggleMaskAadhaar, 
  onOpenDossier, 
  onOpenGuidelines,
  onResetSession 
}) => {
  return (
    <header style={{ 
      background: '#ffffff', 
      borderBottom: '1px solid var(--border-color)', 
      padding: '14px 0', 
      marginBottom: '24px' 
    }}>
      <div className="container" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: '16px' 
      }}>
        
        {/* Left: Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '6px', 
            background: 'var(--primary-light)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--primary)'
          }}>
            <Shield size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 'bold' }}>VeriForge</h1>
              <span className="badge badge-neutral">SIH26188</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              AI Identity & Document Screening System • Ministry of Home Affairs
            </p>
          </div>
        </div>

        {/* Right: Simple Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          
          {/* Workstation Status Badge */}
          <span className={`badge ${
            threatLevel === 'SAFE' ? 'badge-success' : 
            threatLevel === 'CRITICAL' ? 'badge-danger' : 
            threatLevel === 'REVIEW' ? 'badge-warning' : 
            'badge-neutral'
          }`}>
            {threatLevel ? `STATUS: ${threatLevel}` : 'STANDBY'}
          </span>

          {/* Aadhaar Masking Toggle */}
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            fontSize: '0.825rem', 
            cursor: 'pointer',
            padding: '6px 12px',
            background: 'var(--bg-card-alt)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)'
          }}>
            <input 
              type="checkbox" 
              checked={maskAadhaar} 
              onChange={onToggleMaskAadhaar}
              style={{ cursor: 'pointer' }}
            />
            <span>Mask Aadhaar (DPDP Act)</span>
          </label>

          {/* Reset Button */}
          <button 
            onClick={onResetSession}
            className="btn btn-outline btn-sm"
            title="Reset workstation"
          >
            <RotateCcw size={14} /> Reset
          </button>

          {/* Guidelines Handbook */}
          <button 
            onClick={onOpenGuidelines}
            className="btn btn-outline btn-sm"
            title="View official forensic guidelines for Passport, Aadhaar, and Visa"
          >
            <BookOpen size={14} /> Guidelines & Specs
          </button>

          {/* Export Report */}
          <button 
            onClick={onOpenDossier}
            disabled={!threatLevel}
            className="btn btn-primary btn-sm"
            style={{ 
              opacity: !threatLevel ? 0.5 : 1, 
              cursor: !threatLevel ? 'not-allowed' : 'pointer' 
            }}
            title={!threatLevel ? 'Upload a document to export a report' : 'Export Forensic Screening Report'}
          >
            <FileText size={14} /> Export Report
          </button>

        </div>

      </div>
    </header>
  );
};
