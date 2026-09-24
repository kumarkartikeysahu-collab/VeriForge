import React, { useState, useRef, useEffect } from 'react';
import { 
  UserCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Camera, 
  Upload, 
  RefreshCw, 
  Zap, 
  Scan, 
  Sparkles,
  AlertTriangle,
  Radio,
  Sliders
} from 'lucide-react';

export const BiometricVerifier = ({ activeScenario, onUpdateBiometrics }) => {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'upload'
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('user');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Synchronize video element whenever the DOM node mounts or changes
  const setVideoRef = (node) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      if (node.srcObject !== streamRef.current) {
        node.srcObject = streamRef.current;
      }
      node.play().catch((err) => console.warn('Biometric video play error:', err));
    }
  };

  // Double-sync effect when isCameraActive changes
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch((err) => console.warn('Biometric video play error:', err));
    }
  }, [isCameraActive]);

  // Prevent camera hardware lock conflicts across components
  useEffect(() => {
    const handleCameraConflict = (e) => {
      if (e.detail !== 'biometric') {
        stopCamera();
      }
    };
    window.addEventListener('veriforge:camera-active', handleCameraConflict);
    return () => {
      window.removeEventListener('veriforge:camera-active', handleCameraConflict);
      stopCamera();
    };
  }, []);

  // Initialize or sync with activeScenario
  useEffect(() => {
    if (!activeScenario) {
      setCapturedPhoto(null);
      setVerificationResult(null);
      stopCamera();
      return;
    }

    if (activeScenario.liveFaceImage) {
      setCapturedPhoto(activeScenario.liveFaceImage);
    } else {
      setCapturedPhoto(null);
    }

    // Only display verification result if real verification data exists
    if (activeScenario.faceMatchScore !== undefined && activeScenario.faceMatchScore !== null) {
      setVerificationResult({
        verdict: (activeScenario.livenessPassed && activeScenario.faceMatchScore >= 70) ? 'MATCHED' : (activeScenario.livenessPassed === false ? 'SPOOF_ATTACK' : 'MISMATCH'),
        matchScore: activeScenario.faceMatchScore,
        isMatched: activeScenario.faceMatchScore >= 70,
        livenessScore: activeScenario.livenessScore,
        livenessPassed: activeScenario.livenessPassed,
        livenessDetail: activeScenario.livenessDetail || (activeScenario.livenessPassed ? 'Biometric depth confirmed' : 'Presentation Attack Detected'),
        spoofReason: activeScenario.spoofReason || null,
        docPhotoSpliced: activeScenario.docPhotoSpliced || false,
        subMetrics: activeScenario.subMetrics || null
      });
    } else {
      setVerificationResult(null);
    }
  }, [activeScenario?.id]);

  const handleVideoMetadata = (e) => {
    const vid = e.target;
    if (vid) {
      vid.play().catch((err) => console.warn('Biometric video play on metadata error:', err));
      if (vid.videoWidth && vid.videoHeight) {
        setIsStreamReady(true);
      }
    }
  };

  const startCamera = async (overrideFacing) => {
    setCameraError(null);
    setIsStreamReady(false);
    stopCamera();

    // Broadcast that Biometrics has acquired the camera
    window.dispatchEvent(new CustomEvent('veriforge:camera-active', { detail: 'biometric' }));
    const mode = overrideFacing || facingMode;

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: mode }
        });
        streamRef.current = stream;
        setIsCameraActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => console.warn('Play error:', err));
        }
      } else {
        setCameraError('Webcam API is not supported in this browser. Please use the Upload Photo tab.');
      }
    } catch (err) {
      console.warn('Camera access with ideal constraints failed, attempting fallback:', err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = fallbackStream;
        setIsCameraActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.play().catch((err) => console.warn('Play error:', err));
        }
      } catch (fallbackErr) {
        setCameraError('Webcam access was denied or is unavailable. Please select "Upload Photo" instead.');
        setIsCameraActive(false);
      }
    }
  };

  const toggleFacingMode = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    startCamera(newMode);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setIsStreamReady(false);
  };

  const captureSnapshot = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      alert('Camera feed is still synchronizing with sensor. Please wait a moment.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedPhoto(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const runVerification = async () => {
    if (!activeScenario) return;
    const docImage = activeScenario.docFaceImage || activeScenario.imageSrc;
    const liveImage = capturedPhoto;

    if (!docImage || !liveImage) {
      alert('Please ensure both an ID document photo and a live capture are available.');
      return;
    }

    setIsVerifying(true);

    try {
      let res = null;
      try {
        res = await fetch('https://veriforge-e0xz.onrender.com/api/verify-face', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doc_image: docImage,
            live_image: liveImage
          })
        });
      } catch {
        try {
          res = await fetch('https://veriforge-e0xz.onrender.com/api/verify-face', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              doc_image: docImage,
              live_image: liveImage
            })
          });
        } catch {
          res = null;
        }
      }

      if (res && res.ok) {
        const data = await res.json();
        const resVerdict = data.verdict;
        const matchScore = data.match_score ?? 0;
        const livenessScore = data.liveness_score ?? 0;
        const livenessPassed = data.liveness_passed ?? false;
        const docPhotoSpliced = data.doc_photo_spliced ?? false;

        const newResult = {
          verdict: resVerdict,
          matchScore: matchScore,
          isMatched: Boolean(data.is_matched),
          livenessScore: livenessScore,
          livenessPassed: livenessPassed,
          livenessDetail: data.liveness_detail || '',
          spoofReason: data.spoof_type || null,
          docPhotoSpliced: docPhotoSpliced,
          subMetrics: {
            hsvSimilarity: data.sub_metrics?.hsv_similarity ?? 0,
            skinToneSimilarity: data.sub_metrics?.skin_tone_similarity ?? 0,
            structuralNCC: data.sub_metrics?.structural_ncc ?? 0,
            orbFeatureRatio: data.sub_metrics?.orb_feature_ratio ?? 0
          }
        };

        setVerificationResult(newResult);

        // Propagate updates to parent App scenario
        if (onUpdateBiometrics) {
          const updatedThreat = !livenessPassed 
            ? Math.max(activeScenario.threatScore || 0, 95)
            : !data.is_matched 
            ? Math.max(activeScenario.threatScore || 0, 88)
            : docPhotoSpliced
            ? Math.max(activeScenario.threatScore || 0, 86)
            : activeScenario.threatScore;

          const updatedAnomalies = [...(activeScenario.anomalies || [])];
          if (!livenessPassed) {
            updatedAnomalies.push({
              type: 'BIOMETRIC_SPOOF',
              severity: 'CRITICAL',
              title: 'Biometric Presentation Attack',
              detail: data.liveness_detail || 'Display screen replay detected via Fourier frequency analysis.'
            });
          }
          if (!data.is_matched) {
            updatedAnomalies.push({
              type: 'BIOMETRIC_MISMATCH',
              severity: 'CRITICAL',
              title: 'Facial Biometric Impersonation',
              detail: `Live facial portrait similarity (${matchScore}%) failed minimum threshold (70%).`
            });
          }

          onUpdateBiometrics({
            faceMatchScore: matchScore,
            livenessScore: livenessScore,
            livenessPassed: livenessPassed,
            liveFaceImage: data.live_face_image || liveImage,
            docFaceImage: data.doc_face_image || docImage,
            docPhotoSpliced: docPhotoSpliced,
            threatScore: updatedThreat,
            anomalies: updatedAnomalies
          });
        }
      } else {
        throw new Error('Backend verify-face failed');
      }
    } catch (err) {
      console.error('Backend face verify error:', err);
      alert('Biometric verification error: Failed to contact verification API at https://veriforge-e0xz.onrender.com/api/verify-face.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!activeScenario) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <UserCheck size={18} color="var(--primary)" /> 5. Biometric Face & Image Verification
          </span>
          <span className="badge badge-neutral">Standby</span>
        </div>
        <div style={{
          padding: '28px 20px',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--bg-card-alt)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            border: '1px solid var(--border-color)'
          }}>
            <UserCheck size={24} color="var(--primary)" />
          </div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
            Awaiting Document Ingestion
          </h4>
          <p style={{ fontSize: '0.8rem', maxWidth: '340px', margin: '0 auto' }}>
            Ingest an identity document on the left to extract the official photo portrait and run 1:1 facial matching and anti-spoofing liveness checks.
          </p>
        </div>
      </div>
    );
  }

  const docPhoto = activeScenario?.docFaceImage || activeScenario?.imageSrc;
  const matchScore = verificationResult?.matchScore ?? (activeScenario?.faceMatchScore !== undefined && activeScenario?.faceMatchScore !== null ? activeScenario.faceMatchScore : null);
  const livenessScore = verificationResult?.livenessScore ?? (activeScenario?.livenessScore !== undefined && activeScenario?.livenessScore !== null ? activeScenario.livenessScore : null);
  const livenessPassed = verificationResult?.livenessPassed ?? (activeScenario?.livenessPassed !== undefined && activeScenario?.livenessPassed !== null ? activeScenario.livenessPassed : null);
  const isMatched = matchScore !== null ? matchScore >= 70 : null;
  const isSpliced = verificationResult?.docPhotoSpliced || activeScenario?.docPhotoSpliced || (activeScenario?.splicingInfo?.splicing_detected ?? false);
  const quality = activeScenario?.imageQuality || null;

  return (
    <div className="card">
      {/* Header */}
      <div className="card-header">
        <span className="card-title">
          <UserCheck size={18} color="var(--primary)" /> 5. Biometric Face & Image Verification
        </span>
        
        {verificationResult ? (
          <span className={`badge ${livenessPassed && isMatched && !isSpliced ? 'badge-success' : 'badge-danger'}`}>
            {livenessPassed && isMatched && !isSpliced 
              ? 'Biometrics: Verified Match' 
              : !livenessPassed 
              ? 'Alert: Spoof Attack' 
              : isSpliced 
              ? 'Alert: Photo Spliced' 
              : 'Alert: Biometric Mismatch'}
          </span>
        ) : (
          <span className="badge badge-neutral">Standby / Unverified</span>
        )}
      </div>

      {/* Dual Image Comparison Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
        
        {/* Left: Extracted Document Portrait */}
        <div style={{
          border: `1px solid ${isSpliced ? 'var(--danger-border)' : 'var(--border-color)'}`,
          borderRadius: 'var(--radius-sm)',
          padding: '12px',
          textAlign: 'center',
          background: isSpliced ? 'var(--danger-light)' : 'var(--bg-card-alt)',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              ID Card Portrait
            </span>
            <span style={{ fontSize: '0.6875rem', padding: '1px 6px', borderRadius: '3px', background: '#e2e8f0', color: '#334155', fontWeight: 600 }}>
              Extracted
            </span>
          </div>

          <div style={{
            width: '100px',
            height: '120px',
            margin: '0 auto 8px',
            background: '#0f172a',
            borderRadius: '6px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: isSpliced ? '2px dashed var(--danger)' : '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            position: 'relative'
          }}>
            {docPhoto ? (
              <img 
                src={docPhoto} 
                alt="ID Portrait" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '0.75rem', textAlign: 'center', padding: '8px' }}>
                <UserCheck size={28} style={{ margin: '0 auto 4px' }} />
                No Face
              </div>
            )}

            {isSpliced && (
              <span style={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                right: '0',
                background: 'rgba(220, 38, 38, 0.9)',
                color: '#ffffff',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                padding: '2px 0'
              }}>
                PHOTO SPLICED
              </span>
            )}
          </div>

          {/* Quality Tag */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', fontSize: '0.7rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Quality:</span>
            {quality ? (
              <>
                <strong style={{ color: quality.quality_label === 'OPTIMAL' ? 'var(--success)' : 'var(--warning)' }}>
                  {quality.quality_label || 'OPTIMAL'}
                </strong>
                {quality.sharpness != null && (
                  <span style={{ color: 'var(--text-muted)' }}>({quality.sharpness}% sharp)</span>
                )}
              </>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>Analyzed via screening</span>
            )}
          </div>
        </div>

        {/* Right: Live Subject Feed / Upload */}
        <div style={{
          border: `1px solid ${!livenessPassed ? 'var(--danger-border)' : 'var(--border-color)'}`,
          borderRadius: 'var(--radius-sm)',
          padding: '12px',
          textAlign: 'center',
          background: !livenessPassed ? 'var(--danger-light)' : 'var(--bg-card-alt)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Top Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: !livenessPassed ? 'var(--danger)' : 'var(--text-muted)' }}>
              Live Subject Feed
            </span>

            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => { setActiveTab('camera'); setCameraError(null); }}
                style={{
                  border: 'none',
                  background: activeTab === 'camera' ? 'var(--primary)' : '#e2e8f0',
                  color: activeTab === 'camera' ? '#ffffff' : '#475569',
                  borderRadius: '3px',
                  padding: '2px 6px',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Webcam
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('upload'); stopCamera(); setCameraError(null); }}
                style={{
                  border: 'none',
                  background: activeTab === 'upload' ? 'var(--primary)' : '#e2e8f0',
                  color: activeTab === 'upload' ? '#ffffff' : '#475569',
                  borderRadius: '3px',
                  padding: '2px 6px',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Upload
              </button>
            </div>
          </div>

          {/* Live Stream / Capture Area */}
          <div style={{
            width: '100px',
            height: '120px',
            margin: '0 auto 8px',
            background: isCameraActive ? '#000000' : (!livenessPassed ? '#fca5a5' : '#1e293b'),
            borderRadius: '6px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            border: !livenessPassed ? '2px solid var(--danger)' : '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            {/* Live Video Element */}
            {isCameraActive ? (
              <>
                <video
                  ref={setVideoRef}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={handleVideoMetadata}
                  onCanPlay={handleVideoMetadata}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {/* Face Scanning Beam */}
                <div className="scan-line" />
                {/* Face Oval Overlay Guide */}
                <div style={{
                  position: 'absolute',
                  width: '64px',
                  height: '84px',
                  borderRadius: '50%',
                  border: '1.5px dashed #38bdf8',
                  pointerEvents: 'none'
                }} />
              </>
            ) : capturedPhoto ? (
              <img
                src={capturedPhoto}
                alt="Captured"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: '6px', fontSize: '0.7rem' }}>
                <Camera size={26} style={{ margin: '0 auto 4px' }} />
                <span>Camera Ready</span>
              </div>
            )}

            {!livenessPassed && (
              <span style={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                right: '0',
                background: 'rgba(220, 38, 38, 0.95)',
                color: '#ffffff',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                padding: '2px 0'
              }}>
                SCREEN SPOOF
              </span>
            )}
          </div>

          {/* Controls based on active tab */}
          <div style={{ marginTop: 'auto' }}>
            {activeTab === 'camera' ? (
              <div>
                {!isCameraActive ? (
                  <button
                    onClick={startCamera}
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ width: '100%', padding: '4px 6px', fontSize: '0.72rem' }}
                  >
                    <Camera size={12} /> {capturedPhoto ? 'Retake Photo' : 'Start Camera'}
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={captureSnapshot}
                      disabled={!isStreamReady}
                      type="button"
                      className="btn btn-primary btn-sm pulse-glow"
                      style={{ flex: 1, padding: '4px 6px', fontSize: '0.72rem', opacity: !isStreamReady ? 0.6 : 1 }}
                    >
                      <Scan size={12} /> {isStreamReady ? 'Capture' : 'Syncing...'}
                    </button>
                    <button
                      onClick={toggleFacingMode}
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ padding: '4px 6px', fontSize: '0.72rem' }}
                      title="Flip Camera"
                    >
                      <RefreshCw size={12} />
                    </button>
                    <button
                      onClick={stopCamera}
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ padding: '4px 6px', fontSize: '0.72rem' }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', padding: '4px 6px', fontSize: '0.72rem' }}
                >
                  <Upload size={12} /> {capturedPhoto ? 'Change Photo' : 'Upload Selfie'}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {cameraError && (
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--warning)',
          background: 'var(--warning-light)',
          border: '1px solid var(--warning-border)',
          borderRadius: '4px',
          padding: '6px 10px',
          marginBottom: '12px'
        }}>
          {cameraError}
        </div>
      )}

      {/* Main Verification Trigger Button */}
      <button
        onClick={runVerification}
        disabled={isVerifying || !capturedPhoto}
        className="btn btn-primary"
        style={{
          width: '100%',
          marginBottom: '14px',
          fontWeight: 600,
          background: isVerifying ? 'var(--primary-hover)' : 'var(--primary)',
          opacity: (!capturedPhoto || isVerifying) ? 0.75 : 1
        }}
      >
        {isVerifying ? (
          <>
            <RefreshCw size={15} className="spin-animation" /> Running AI Biometric Verification...
          </>
        ) : (
          <>
            <Zap size={15} /> Verify Image & Face Match
          </>
        )}
      </button>

      {/* Verification Metrics Table */}
      <table className="data-table" style={{ marginBottom: '12px' }}>
        <tbody>
          <tr>
            <td style={{ color: 'var(--text-muted)' }}>
              <strong>1:1 Facial Match Score</strong>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                Multi-channel HSV/YCrCb + NCC Structural + ORB
              </div>
            </td>
            <td style={{ fontWeight: 'bold', color: matchScore !== null ? (matchScore >= 70 ? 'var(--success)' : 'var(--danger)') : 'var(--text-muted)' }}>
              {matchScore !== null ? `${matchScore}% Similarity` : 'Pending Verification'}
            </td>
            <td>
              {matchScore !== null ? (
                matchScore >= 70 ? (
                  <span className="badge badge-success"><CheckCircle2 size={12} /> Match Passed</span>
                ) : (
                  <span className="badge badge-danger"><XCircle size={12} /> Impersonation Alert</span>
                )
              ) : (
                <span className="badge badge-neutral">Standby</span>
              )}
            </td>
          </tr>

          <tr>
            <td style={{ color: 'var(--text-muted)' }}>
              <strong>Anti-Spoofing & Liveness</strong>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                2D FFT Fourier Moiré & Glass Reflection Spectrum
              </div>
            </td>
            <td style={{ fontWeight: 'bold', color: livenessScore !== null ? (livenessPassed ? 'var(--success)' : 'var(--danger)') : 'var(--text-muted)' }}>
              {livenessScore !== null ? `${livenessScore}% Live Score` : 'Pending Verification'}
            </td>
            <td>
              {livenessScore !== null ? (
                livenessPassed ? (
                  <span className="badge badge-success"><CheckCircle2 size={12} /> Genuine Human</span>
                ) : (
                  <span className="badge badge-danger"><XCircle size={12} /> Spoof Attack</span>
                )
              ) : (
                <span className="badge badge-neutral">Standby</span>
              )}
            </td>
          </tr>

          <tr>
            <td style={{ color: 'var(--text-muted)' }}>
              <strong>Document Photo Splicing</strong>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                Sobel Boundary Edge Gradient Continuity
              </div>
            </td>
            <td style={{ fontWeight: 'bold', color: activeScenario?.splicingInfo ? (!isSpliced ? 'var(--success)' : 'var(--danger)') : 'var(--text-muted)' }}>
              {activeScenario?.splicingInfo ? (!isSpliced ? 'Seamless Substrate' : 'Discontinuity Detected') : 'Pending Inspection'}
            </td>
            <td>
              {activeScenario?.splicingInfo ? (
                !isSpliced ? (
                  <span className="badge badge-success"><CheckCircle2 size={12} /> Intact</span>
                ) : (
                  <span className="badge badge-danger"><AlertTriangle size={12} /> Spliced Portrait</span>
                )
              ) : (
                <span className="badge badge-neutral">Standby</span>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Sub-Metrics Forensic Breakdown Pills */}
      {verificationResult?.subMetrics && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '6px',
          background: 'var(--bg-card-alt)',
          padding: '8px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          fontSize: '0.7rem',
          textAlign: 'center'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Structural NCC</span>
            <strong>{verificationResult.subMetrics.structuralNCC}%</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>ORB Landmark</span>
            <strong>{verificationResult.subMetrics.orbFeatureRatio}%</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Skin Tone (YCrCb)</span>
            <strong>{verificationResult.subMetrics.skinToneSimilarity}%</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Color Correl (HSV)</span>
            <strong>{verificationResult.subMetrics.hsvSimilarity}%</strong>
          </div>
        </div>
      )}

      {/* Audit Detail Line */}
      {verificationResult?.livenessDetail && (
        <div style={{
          marginTop: '8px',
          fontSize: '0.72rem',
          color: livenessPassed ? 'var(--text-muted)' : 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <Radio size={12} />
          <span>Audit: {verificationResult.livenessDetail}</span>
        </div>
      )}

    </div>
  );
};
