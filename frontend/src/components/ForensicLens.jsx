import React, { useState, useEffect, useRef } from 'react';
import { Layers, AlertTriangle, ShieldCheck, Cpu, Radio, Sparkles, Eye } from 'lucide-react';
import { generateForensicHeatmap } from '../utils/elaSimulator';

export const ForensicLens = ({ activeScenario, maskAadhaar }) => {
  // View modes: 'fused' | 'spatial' | 'frequency' | 'screen_replay' | 'original' | 'split'
  const [viewMode, setViewMode] = useState('fused');
  const [activeHoverBox, setActiveHoverBox] = useState(null);
  const canvasRef = useRef(null);

  const dtd = activeScenario?.dtdAnalysis || {};
  const screenReplay = activeScenario?.screenRecapture || {};
  const fusedHeatmap = dtd?.fused_heatmap_base64;
  const spatialHeatmap = dtd?.spatial_heatmap_base64;
  const freqHeatmap = dtd?.frequency_heatmap_base64;

  // Fallback ELA canvas generator if server heatmap not available
  useEffect(() => {
    if (!canvasRef.current || !activeScenario || !activeScenario.imageSrc) return;
    const canvas = canvasRef.current;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      generateForensicHeatmap(
        canvas,
        img,
        activeScenario.tamperedBoxes || [],
        activeScenario.threatScore
      );
    };
    img.onerror = () => {};
    img.src = activeScenario.imageSrc;
  }, [activeScenario]);

  if (!activeScenario) {
    return (
      <div className="card" style={{ minHeight: '340px', display: 'flex', flexDirection: 'column' }}>
        <div className="card-header">
          <span className="card-title">
            <Layers size={18} color="var(--primary)" /> 2. Dual-Stream Tampered Text Network (DTD/FFDN)
          </span>
          <span className="badge badge-neutral">Standby</span>
        </div>
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--bg-card-alt)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <Layers size={28} color="var(--primary)" />
          </div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
            No Document Ingested
          </h4>
          <p style={{ fontSize: '0.8rem', maxWidth: '380px' }}>
            Upload or capture an ID document to activate Dual-Stream Frequency-Spatial analysis, 8x8 DCT grid residual forensics, and presentation anti-replay detection.
          </p>
        </div>
      </div>
    );
  }

  const tamperedBoxes = activeScenario?.tamperedBoxes || [];

  return (
    <div className="card">
      <div className="card-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="card-title">
            <Layers size={18} color="var(--primary)" /> 2. Dual-Stream Tampered Network (DTD/FFDN)
          </span>
          {dtd?.is_whatsapp_compressed && (
            <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
              WhatsApp Mitigation Active
            </span>
          )}
        </div>

        {/* Multi-Stream View Tabs */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setViewMode('fused')}
            className={`btn btn-sm ${viewMode === 'fused' ? 'btn-primary' : 'btn-outline'}`}
            title="Dual-Stream Fused Heatmap (Spatial + DCT Frequency)"
          >
            <Sparkles size={13} style={{ marginRight: '4px' }} /> Dual-Stream (FFDN)
          </button>
          <button
            onClick={() => setViewMode('spatial')}
            className={`btn btn-sm ${viewMode === 'spatial' ? 'btn-primary' : 'btn-outline'}`}
            title="ConvNeXt Spatial Glyph Boundary Discontinuities"
          >
            <Cpu size={13} style={{ marginRight: '4px' }} /> Spatial Stream
          </button>
          <button
            onClick={() => setViewMode('frequency')}
            className={`btn btn-sm ${viewMode === 'frequency' ? 'btn-primary' : 'btn-outline'}`}
            title="8x8 Discrete Cosine Transform (DCT) Grid Residuals"
          >
            <Radio size={13} style={{ marginRight: '4px' }} /> 8x8 DCT Freq
          </button>
          <button
            onClick={() => setViewMode('screen_replay')}
            className={`btn btn-sm ${viewMode === 'screen_replay' ? 'btn-primary' : 'btn-outline'}`}
            title="Anti-Replay: Moiré Interference & Screen Borders"
          >
            <Eye size={13} style={{ marginRight: '4px' }} /> Anti-Replay / Moiré
          </button>
          <button
            onClick={() => setViewMode('original')}
            className={`btn btn-sm ${viewMode === 'original' ? 'btn-primary' : 'btn-outline'}`}
          >
            Original
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`btn btn-sm ${viewMode === 'split' ? 'btn-primary' : 'btn-outline'}`}
          >
            Split Compare
          </button>
        </div>
      </div>

      {/* Main Forensic Viewport */}
      {viewMode === 'split' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Left: Original */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '8px', textAlign: 'center', background: '#ffffff' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Original Ingested Document
            </span>
            <img 
              src={activeScenario?.imageSrc} 
              alt="Original" 
              style={{ width: '100%', height: 'auto', borderRadius: '4px' }} 
            />
          </div>

          {/* Right: Dual-Stream Heatmap */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '8px', textAlign: 'center', background: '#000000' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#38bdf8', display: 'block', marginBottom: '6px' }}>
              Dual-Stream Fused Forensic Map (Spatial + DCT)
            </span>
            {fusedHeatmap ? (
              <img 
                src={fusedHeatmap} 
                alt="Fused Heatmap" 
                style={{ width: '100%', height: 'auto', borderRadius: '4px' }} 
              />
            ) : (
              <canvas
                ref={canvasRef}
                width={600}
                height={400}
                style={{ width: '100%', height: 'auto', borderRadius: '4px' }}
              />
            )}
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative', background: '#0a0e17', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          
          {/* 1. Original Document View */}
          {viewMode === 'original' && (
            <div style={{ position: 'relative' }}>
              <img
                src={activeScenario?.imageSrc}
                alt="Document"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />

              {/* DPDP Masked Banner */}
              {maskAadhaar && activeScenario?.category === 'Aadhaar' && activeScenario?.docNumber && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(15, 23, 42, 0.92)',
                  padding: '5px 12px',
                  borderRadius: '4px',
                  color: '#38bdf8',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  border: '1px solid #38bdf8',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                }}>
                  DPDP Masked: XXXX XXXX {activeScenario.docNumber.replace(/\D/g, '').slice(-4) || 'XXXX'}
                </div>
              )}
            </div>
          )}

          {/* 2. Dual-Stream Fused Heatmap */}
          {viewMode === 'fused' && (
            <div style={{ position: 'relative' }}>
              {fusedHeatmap ? (
                <img
                  src={fusedHeatmap}
                  alt="Dual-Stream Fused Heatmap"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              ) : (
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={400}
                  style={{ width: '100%', height: 'auto', display: 'block', background: '#000000' }}
                />
              )}
            </div>
          )}

          {/* 3. Spatial Stream */}
          {viewMode === 'spatial' && (
            <div style={{ position: 'relative' }}>
              {spatialHeatmap ? (
                <img
                  src={spatialHeatmap}
                  alt="Spatial Stream Heatmap"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              ) : (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                  Spatial Stream synthesizing ConvNeXt glyph boundary map...
                </div>
              )}
            </div>
          )}

          {/* 4. 8x8 DCT Frequency Stream */}
          {viewMode === 'frequency' && (
            <div style={{ position: 'relative' }}>
              {freqHeatmap ? (
                <img
                  src={freqHeatmap}
                  alt="8x8 DCT Frequency Heatmap"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              ) : (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                  Extracting 8x8 DCT block grid residuals...
                </div>
              )}
            </div>
          )}

          {/* 5. Anti-Replay / Moiré Overlay */}
          {viewMode === 'screen_replay' && (
            <div style={{ position: 'relative' }}>
              <img
                src={activeScenario?.imageSrc}
                alt="Anti-Replay View"
                style={{ width: '100%', height: 'auto', display: 'block', opacity: 0.85 }}
              />
              
              {/* Screen Bezel Box Overlay */}
              {screenReplay?.bezel_detected && screenReplay?.bezel_box && (
                <div style={{
                  position: 'absolute',
                  left: `${(screenReplay.bezel_box.x / (activeScenario.width || 640)) * 100}%`,
                  top: `${(screenReplay.bezel_box.y / (activeScenario.height || 400)) * 100}%`,
                  width: `${(screenReplay.bezel_box.width / (activeScenario.width || 640)) * 100}%`,
                  height: `${(screenReplay.bezel_box.height / (activeScenario.height || 400)) * 100}%`,
                  border: '3px dashed #ef4444',
                  boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)',
                  pointerEvents: 'none'
                }}>
                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    padding: '2px 8px',
                    borderRadius: '3px'
                  }}>
                    Device Bezel Contour Detected
                  </span>
                </div>
              )}

              {/* Status Banner */}
              <div style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                right: '12px',
                background: screenReplay?.presentation_attack_detected ? 'rgba(239, 68, 68, 0.92)' : 'rgba(16, 185, 129, 0.92)',
                color: '#ffffff',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backdropFilter: 'blur(4px)'
              }}>
                <div>
                  <strong>{screenReplay?.attack_type || 'GENUINE_PHYSICAL_CARD'}</strong>: {screenReplay?.evidentiary_detail || 'Natural physical card substrate.'}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                  Moiré Index: {screenReplay?.moire_index ?? 0}% | Glare: {screenReplay?.specular_glare_percentage ?? 0}%
                </div>
              </div>
            </div>
          )}

          {/* Tamper Bounding Boxes (Rendered across original and heatmap views) */}
          {viewMode !== 'screen_replay' && tamperedBoxes.map((box, idx) => (
            <div
              key={idx}
              onMouseEnter={() => setActiveHoverBox(box)}
              onMouseLeave={() => setActiveHoverBox(null)}
              style={{
                position: 'absolute',
                left: `${box.x}%`,
                top: `${box.y}%`,
                width: `${box.width}%`,
                height: `${box.height}%`,
                border: '2px solid #ef4444',
                background: 'rgba(239, 68, 68, 0.18)',
                borderRadius: '3px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                zIndex: 10
              }}
            >
              <span style={{
                position: 'absolute',
                top: '-20px',
                left: '0',
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                padding: '1px 6px',
                borderRadius: '2px',
                whiteSpace: 'nowrap'
              }}>
                Tamper: {box.confidence}%
              </span>

              {/* Interactive Tooltip Popover */}
              {activeHoverBox === box && (
                <div style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 24px)',
                  left: '0',
                  minWidth: '240px',
                  maxWidth: '320px',
                  background: '#0f172a',
                  border: '1px solid #38bdf8',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  zIndex: 100,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                  pointerEvents: 'none'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ color: '#ef4444' }}>Forensic Localization #{idx + 1}</strong>
                    <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{box.confidence}% Conf</span>
                  </div>
                  <p style={{ margin: 0, color: '#e2e8f0', lineHeight: 1.35 }}>
                    {box.reason}
                  </p>
                  <div style={{ marginTop: '6px', fontSize: '0.68rem', color: '#94a3b8' }}>
                    Origin: {box.stream_origin || 'DUAL_STREAM_FUSION'}
                  </div>
                </div>
              )}
            </div>
          ))}

        </div>
      )}

      {/* Forensic Signal Telemetry Ribbon */}
      <div style={{
        marginTop: '12px',
        background: 'var(--bg-card-alt)',
        padding: '10px 14px',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        fontSize: '0.75rem'
      }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Spatial Gradient: </span>
            <strong style={{ color: dtd?.spatial_score > 60 ? 'var(--danger)' : 'var(--success)' }}>
              {dtd?.spatial_score ?? 0}%
            </strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>8x8 DCT Frequency: </span>
            <strong style={{ color: dtd?.frequency_score > 60 ? 'var(--danger)' : 'var(--success)' }}>
              {dtd?.frequency_score ?? 0}%
            </strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Moiré Interference: </span>
            <strong style={{ color: screenReplay?.moire_index > 50 ? 'var(--danger)' : 'var(--success)' }}>
              {screenReplay?.moire_index ?? 0}%
            </strong>
          </div>
        </div>

        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
          {dtd?.robustness_mode || 'STANDARD_HIGH_RES_MODE'} • iBeta ISO/IEC 30107-3
        </div>
      </div>

    </div>
  );
};
