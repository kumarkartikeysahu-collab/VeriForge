import React, { useState, useEffect } from 'react';
import { X, BookOpen, FileText, Shield, CheckCircle2, AlertCircle, ExternalLink, Lock, Layers, Cpu, Sparkles, Scale, Activity } from 'lucide-react';

export const GuidelinesModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('passport'); // 'passport' | 'aadhaar' | 'visa' | 'spatial_gradient'

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        backdropFilter: 'blur(2px)'
      }}>
      <div style={{
        width: '100%',
        maxWidth: '820px',
        maxHeight: '88vh',
        background: '#ffffff',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-card-alt)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <BookOpen size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                Forensic Screening & Identity Guidelines
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Official Specifications & Compliance Standards • Ministry of Home Affairs (MHA)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-outline btn-sm"
            style={{ padding: '5px 8px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          background: '#ffffff',
          padding: '0 20px',
          overflowX: 'auto'
        }}>
          {[
            { id: 'passport', label: '1. Passport (ICAO Doc 9303 TD3)' },
            { id: 'aadhaar', label: '2. Aadhaar (UIDAI & DPDP Act)' },
            { id: 'visa', label: '3. Visa (ICAO Doc 9303 Part 7)' },
            { id: 'spatial_gradient', label: '4. Spatial Gradient & DTD Forensics' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 16px',
                fontSize: '0.825rem',
                fontWeight: activeTab === tab.id ? 600 : 500,
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                background: 'none',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          fontSize: '0.825rem',
          lineHeight: '1.55',
          color: 'var(--text-main)'
        }}>

          {/* TAB 1: PASSPORT GUIDELINES */}
          {activeTab === 'passport' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'var(--primary-light)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px 16px' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--primary)', display: 'block', marginBottom: '2px' }}>
                  Standard: ICAO Doc 9303 Part 3 & Part 4 (Machine Readable Travel Documents)
                </span>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  Governs size TD3 standard travel booklets for the Republic of India and all ICAO signatory nations.
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>
                  A. Dimensions & Geometric Standards
                </h4>
                <table className="data-table" style={{ marginBottom: '12px' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '35%', color: 'var(--text-muted)' }}>Nominal Dimensions</td>
                      <td><strong>125.0 mm × 88.0 mm (TD3)</strong>, rounded corners (radius 3.18 mm ± 0.25 mm)</td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--text-muted)' }}>Visual Inspection Zone (VIZ)</td>
                      <td>Top 70% of bio-data page: Holder Portrait, Surname, Given Names, Nationality, DOB, Sex, Place of Birth</td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--text-muted)' }}>Machine Readable Zone (MRZ)</td>
                      <td>Bottom 23.2 mm band containing <strong>2 lines of 44 monospaced OCR-B characters</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>
                  B. MRZ Algorithmic Validation Matrix (Modulo-10 Weight 7-3-1)
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Check digits are mathematically computed using recurring weighting vector [7, 3, 1]. Character values: 0-9 correspond to 0-9, A-Z correspond to 10-35, filler '&lt;' counts as 0.
                </p>
                <div style={{ background: 'var(--bg-card-alt)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', border: '1px solid var(--border-color)', marginBottom: '8px' }}>
                  Line 1: P&lt;IND[SURNAME]&lt;&lt;[GIVEN_NAMES]&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;<br/>
                  Line 2: [DocNo(9)][CD1][Nationality(3)][DOB(6)][CD2][Sex(1)][Expiry(6)][CD3][PersonalNo(14)][CD4][CompositeCD]
                </div>
                <ul style={{ paddingLeft: '20px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <li><strong>Doc Number Check (Pos 10):</strong> Modulo-10 weight on characters 1 to 9.</li>
                  <li><strong>DOB Check (Pos 20):</strong> Modulo-10 weight on YYMMDD (characters 14 to 19).</li>
                  <li><strong>Expiry Check (Pos 28):</strong> Modulo-10 weight on YYMMDD (characters 22 to 27).</li>
                  <li><strong>Composite Check (Pos 44):</strong> Validates concatenation of Doc No + CD1 + DOB + CD2 + Expiry + CD3 + Personal No + CD4.</li>
                </ul>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>
                  C. Physical & Digital Forensics Checklist
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ padding: '10px', background: 'var(--bg-card-alt)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <strong>1. Photo Specifications</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      35 mm × 45 mm, 70-80% face height (31-36 mm), front view, neutral expression, plain white/off-white background.
                    </div>
                  </div>
                  <div style={{ padding: '10px', background: 'var(--bg-card-alt)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <strong>2. Security Printing & UV</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Rainbow guilloche background patterns, intaglio tactile print, dual-color UV fluorescent threads (365 nm excitation).
                    </div>
                  </div>
                  <div style={{ padding: '10px', background: 'var(--bg-card-alt)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <strong>3. Optically Variable Features</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Color-shifting Optical Variable Ink (OVI) on Ashoka emblem, secondary ghost portrait laser-perforated through laminate.
                    </div>
                  </div>
                  <div style={{ padding: '10px', background: 'var(--bg-card-alt)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <strong>4. Electronic Chip (e-Passport)</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      ISO/IEC 14443 contactless smart chip storing signed biometric hash (DG1 MRZ, DG2 Face photo) verified via CSCA PKI.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AADHAAR GUIDELINES */}
          {activeTab === 'aadhaar' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#f0fdf4', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-sm)', padding: '12px 16px' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--success)', display: 'block', marginBottom: '2px' }}>
                  Standard: UIDAI Security Architecture & DPDP Act 2023 Compliance
                </span>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  Governs 12-digit Indian National Identity verification, cryptographic QR verification, and statutory redaction requirements.
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>
                  A. Format & Mathematical Verhoeff Checksum
                </h4>
                <table className="data-table" style={{ marginBottom: '12px' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '35%', color: 'var(--text-muted)' }}>Number Architecture</td>
                      <td><strong>12 numeric digits</strong>, presented formatted in 3 blocks of 4: <code>XXXX XXXX 1234</code></td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--text-muted)' }}>Verhoeff Algorithm</td>
                      <td>
                        The 12th digit is calculated via the <strong>Verhoeff algorithm (Dihedral group D5)</strong>. It detects 100% of single-digit substitutions and 100% of adjacent digit transpositions.
                      </td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--text-muted)' }}>Permutation Matrices</td>
                      <td>Uses multiplication table <code>d(j,k)</code> and inverse permutation table <code>p(pos, val)</code>. Numbers starting with 0 or 1 are invalid.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>
                  B. Digital Personal Data Protection (DPDP) Act Redaction Rules
                </h4>
                <div style={{ background: 'var(--bg-card-alt)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Lock size={16} color="var(--primary)" />
                    <strong>Mandatory 8-Digit Masking Rule (UIDAI Circular & DPDP Act Section 6)</strong>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                    Any non-statutory entity or verification operator ingesting physical or scanned copies of Aadhaar cards <strong>MUST completely obscure or black out the first 8 digits</strong> (`XXXX XXXX [LAST_4]`). Only the last 4 digits may remain visible.
                  </p>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>
                  C. Cryptographic Secure QR Code Verification
                </h4>
                <ul style={{ paddingLeft: '20px', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li><strong>2048-Bit RSA Digital Signature:</strong> Secure QR contains byte stream compressed with gzip/deflate, signed with UIDAI private key.</li>
                  <li><strong>Decompressed Structure:</strong> Contains reference ID, Name, DOB, Gender, Masked Aadhaar Number, Address text, and low-res JPEG photo.</li>
                  <li><strong>Tamper Detection:</strong> If visual details on the card face do not match the cryptographically decrypted QR payload, document is flagged as <strong>CRITICAL FORGERY</strong>.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: VISA GUIDELINES */}
          {activeTab === 'visa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'var(--warning-light)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius-sm)', padding: '12px 16px' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--warning)', display: 'block', marginBottom: '2px' }}>
                  Standard: ICAO Doc 9303 Part 7 (Machine Readable Visas - MRV)
                </span>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  Defines international specifications for Format-A and Format-B machine-readable entry visas and travel authorizations.
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>
                  A. MRV Classification & Dimensions
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ padding: '12px', background: 'var(--bg-card-alt)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <strong style={{ color: 'var(--primary)' }}>MRV-A (Format-A / Standard Full Size)</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      • Nominal Size: <strong>80.0 mm × 120.0 mm</strong><br/>
                      • Fits standard passport page completely<br/>
                      • MRZ: <strong>2 lines of 44 characters</strong> (OCR-B)<br/>
                      • First character of MRZ is always <code>V</code>
                    </div>
                  </div>
                  <div style={{ padding: '12px', background: 'var(--bg-card-alt)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <strong style={{ color: 'var(--primary)' }}>MRV-B (Format-B / Compact Size)</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      • Nominal Size: <strong>74.0 mm × 105.0 mm</strong><br/>
                      • Used for smaller passport visa foils<br/>
                      • MRZ: <strong>2 lines of 36 characters</strong> (OCR-B)<br/>
                      • First character of MRZ is always <code>V</code>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>
                  B. MRV Checksum Structure (ICAO 9303 Part 7)
                </h4>
                <div style={{ background: 'var(--bg-card-alt)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', border: '1px solid var(--border-color)', marginBottom: '8px' }}>
                  Line 1: V&lt;[IssuingState(3)][Surname]&lt;&lt;[GivenNames]&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;<br/>
                  Line 2 (MRV-A): [VisaNo(9)][CD1][Nationality(3)][DOB(6)][CD2][Sex(1)][Expiry(6)][CD3][Optional(16)]
                </div>
                <ul style={{ paddingLeft: '20px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <li><strong>Visa Number Check (Pos 10):</strong> Modulo-10 weight 7-3-1 on 9-character visa document number.</li>
                  <li><strong>DOB Check (Pos 20):</strong> Modulo-10 weight on YYMMDD date of birth.</li>
                  <li><strong>Expiry Check (Pos 28):</strong> Modulo-10 weight on YYMMDD visa expiration date.</li>
                </ul>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>
                  C. Visa Foil Security & Anti-Tampering Features
                </h4>
                <ul style={{ paddingLeft: '20px', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li><strong>Self-Destructive Security Adhesive:</strong> High-tack hot-melt adhesive that disintegrates or damages the passport page if an attempt is made to peel and transplant the visa foil.</li>
                  <li><strong>Diffractive Optical Variable Image Device (DOVID / Kinegram):</strong> Metallized rainbow hologram overlay partially overlapping holder photo and visa details.</li>
                  <li><strong>Chemical Sensitizing & UV Ink:</strong> Solvent-sensitive reactive ink that discolors upon contact with chemical bleaching agents or falsification solvents.</li>
                  <li><strong>Number of Entries & Duration:</strong> Strict verification between single-entry ('01'), double-entry ('02'), and multiple-entry ('MULT') with stay limits.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: SPATIAL GRADIENT & DTD FORENSICS (SIH26188) */}
          {activeTab === 'spatial_gradient' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Introduction Banner */}
              <div style={{
                background: 'var(--primary-light)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Layers size={18} color="var(--primary)" />
                  <strong style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>
                    Dual-Stream Tampered Text Network (DTD / FFDN) Guidelines
                  </strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-main)', lineHeight: 1.45 }}>
                  The Spatial Gradient Engine detects digital inpainting, character tampering, and photo splicing by evaluating the directional rate of pixel intensity changes ($\nabla I$) across document security substrates. Unlike classical Error Level Analysis (ELA), it remains robust against social media re-compression (e.g., WhatsApp/Telegram).
                </p>
              </div>

              {/* Section A: Mathematical Formulation */}
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Cpu size={15} color="var(--primary)" /> A. Mathematical & Algorithmic Formulation
                </h4>
                <div style={{ background: 'var(--bg-card-alt)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '8px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-main)', marginBottom: '6px' }}>
                    <strong>1. 2D Spatial Gradient Vector:</strong><br/>
                    &nbsp;&nbsp;∇I(x, y) = [ ∂I/∂x, ∂I/∂y ]ᵀ = [ G_x, G_y ]ᵀ<br/>
                    &nbsp;&nbsp;Magnitude: |∇I| = √(G_x² + G_y²)<br/>
                    &nbsp;&nbsp;Direction: θ = arctan(G_y / G_x)
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-main)' }}>
                    <strong>2. ConvNeXt 7×7 Depthwise Laplacian High-Pass Filter:</strong><br/>
                    &nbsp;&nbsp;Evaluates glyph boundary continuity and micro-edge sharpness across text lines.
                  </div>
                </div>
                <ul style={{ paddingLeft: '20px', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li><strong>Directional Derivatives (G_x, G_y):</strong> Computed via horizontal and vertical Sobel / Scharr operators to capture orthogonal edge transitions.</li>
                  <li><strong>Second-Order Laplacian (∇²I):</strong> Highlights localized curvature and gradient discontinuities around character perimeters.</li>
                  <li><strong>High-Frequency Residual Extraction:</strong> Isolates sub-millimeter stroke boundary noise from background security guilloche patterns.</li>
                </ul>
              </div>

              {/* Section B: Physical & Forensic Principles */}
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Activity size={15} color="var(--primary)" /> B. Physical Forensics: Genuine vs. Tampered Substrates
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                    <strong style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <CheckCircle2 size={14} /> Genuine Official Printing
                    </strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', marginTop: '6px', lineHeight: 1.4 }}>
                      • <strong>Uniform Ink Diffusion:</strong> Industrial dye-sublimation and laser card printing creates smooth, Gaussian boundary transitions.<br/>
                      • <strong>Collinear Baselines:</strong> Character bottom edges align along a rigid linear trajectory (deviation &lt; 1.2 px).<br/>
                      • <strong>Consistent Kerning:</strong> Inter-character spacing follows official monospace/proportional font metrics.
                    </div>
                  </div>

                  <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                    <strong style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <AlertCircle size={14} /> Tampered / Forged Modifications
                    </strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', marginTop: '6px', lineHeight: 1.4 }}>
                      • <strong>Gradient Step Discontinuity:</strong> Pasted text or generative inpainting creates sharp boundary spikes or anti-aliasing halos.<br/>
                      • <strong>Vertical Baseline Drift:</strong> Artificially typed characters deviate &gt; 1.6 px from the true line regression.<br/>
                      • <strong>Portrait Splicing Discontinuity:</strong> Boundary edge gradient ratio &gt; 2.8 across photo perimeter.
                    </div>
                  </div>
                </div>
              </div>

              {/* Section C: Standard Operating Procedure (SOP) Thresholds */}
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Scale size={15} color="var(--primary)" /> C. Operational Thresholds & Decision Matrix (MHA Standards)
                </h4>
                <table className="data-table" style={{ fontSize: '0.75rem' }}>
                  <thead>
                    <tr>
                      <th>Forensic Metric</th>
                      <th>Normal Range</th>
                      <th>Suspicious (Review)</th>
                      <th>Critical (Forgery)</th>
                      <th>Evidentiary Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Baseline Regression Deviation</strong></td>
                      <td className="font-mono">&lt; 1.2 px</td>
                      <td className="font-mono">1.2 – 1.6 px</td>
                      <td className="font-mono">&ge; 1.6 px</td>
                      <td>Flag field for typed alteration</td>
                    </tr>
                    <tr>
                      <td><strong>Character Kerning Uniformity (&sigma;)</strong></td>
                      <td className="font-mono">&lt; 1.5 px</td>
                      <td className="font-mono">1.5 – 2.5 px</td>
                      <td className="font-mono">&ge; 2.5 px</td>
                      <td>Inconsistent font typography flag</td>
                    </tr>
                    <tr>
                      <td><strong>Portrait Boundary Edge Ratio</strong></td>
                      <td className="font-mono">&lt; 1.8</td>
                      <td className="font-mono">1.8 – 2.8</td>
                      <td className="font-mono">&gt; 2.8</td>
                      <td>Photo substitution / splicing alert</td>
                    </tr>
                    <tr>
                      <td><strong>Dual-Stream Fusion Score</strong></td>
                      <td className="font-mono">&lt; 25.0%</td>
                      <td className="font-mono">25.0 – 75.0%</td>
                      <td className="font-mono">&ge; 75.0%</td>
                      <td>Court-admissible tamper localization</td>
                    </tr>
                    <tr>
                      <td><strong>2D FFT Moiré Index</strong></td>
                      <td className="font-mono">&lt; 40.0%</td>
                      <td className="font-mono">40.0 – 60.0%</td>
                      <td className="font-mono">&ge; 60.0%</td>
                      <td>Screen-recapture replay attack</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section D: Social Media Re-Compression Robustness */}
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={15} color="var(--primary)" /> D. Social Media Re-Compression Immunity (WhatsApp / Telegram)
                </h4>
                <div style={{ background: 'var(--bg-card-alt)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.78rem', color: 'var(--text-main)', lineHeight: 1.45 }}>
                  <p style={{ margin: '0 0 6px 0' }}>
                    <strong>The Problem with Classical ELA:</strong> When an ID card is forwarded through WhatsApp or Telegram, the platform re-compresses the image at Quality ~70 with 4:2:0 chroma subsampling. This flattens the global compression history and causes classical ELA to either fail or flag every word as forged.
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>The VeriForge Dual-Stream Solution:</strong> Our system computes <em>localized spatial gradient variance</em> relative to the document's adaptive background baseline and couples it with <em>8×8 Discrete Cosine Transform (DCT) block residuals</em>. This ensures high detection accuracy without generating false-positive floods on forwarded social media images.
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-card-alt)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <span>Official Reference: ICAO Doc 9303 • UIDAI e-KYC Guidelines • DPDP Act 2023</span>
          <button onClick={onClose} className="btn btn-primary btn-sm">
            Close Handbook
          </button>
        </div>

      </div>
    </div>
  );
};
