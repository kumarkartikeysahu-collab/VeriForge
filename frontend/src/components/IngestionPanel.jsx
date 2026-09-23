import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  Trash2, 
  FileUp, 
  Info, 
  Loader2, 
  AlertCircle, 
  X, 
  ShieldAlert, 
  Camera, 
  RefreshCw,
  FlipHorizontal,
  Crop
} from 'lucide-react';

export const IngestionPanel = ({ activeScenario, onCustomUpload, onClearDocument }) => {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const viewfinderRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [category, setCategory] = useState('Passport');
  const [mrzLine1, setMrzLine1] = useState('');
  const [mrzLine2, setMrzLine2] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [invalidImageError, setInvalidImageError] = useState(null);
  const [invalidDetails, setInvalidDetails] = useState(null);

  // Real-Time Camera Scanner state
  const [ingestionMode, setIngestionMode] = useState('upload'); // 'upload' | 'camera'
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [streamResolution, setStreamResolution] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [isMirrored, setIsMirrored] = useState(false);
  const [cropToViewfinder, setCropToViewfinder] = useState(true);
  const [showShutterFlash, setShowShutterFlash] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);


  // Synchronize video element whenever the DOM node mounts or changes
  const setVideoRef = (node) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      if (node.srcObject !== streamRef.current) {
        node.srcObject = streamRef.current;
      }
      node.play().catch((err) => console.warn('Video auto-play warning:', err));
    }
  };

  // Double-sync effect when isCameraActive or streamRef changes
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch((err) => console.warn('Video auto-play warning:', err));
    }
  }, [isCameraActive]);

  // Prevent camera hardware lock conflicts across components
  useEffect(() => {
    const handleCameraConflict = (e) => {
      if (e.detail !== 'ingestion') {
        stopCamera();
      }
    };
    window.addEventListener('sentinel:camera-active', handleCameraConflict);
    return () => {
      window.removeEventListener('sentinel:camera-active', handleCameraConflict);
      stopCamera();
    };
  }, []);

  const handleVideoMetadata = (e) => {
    const vid = e.target;
    if (vid) {
      vid.play().catch((err) => console.warn('Play on metadata error:', err));
      if (vid.videoWidth && vid.videoHeight) {
        setStreamResolution(`${vid.videoWidth}x${vid.videoHeight}`);
        setIsStreamReady(true);
      }
    }
  };

  const startCamera = async (overrideFacing) => {
    setCameraError(null);
    setIsStreamReady(false);
    setStreamResolution(null);
    stopCamera();

    // Broadcast that Ingestion has acquired the camera
    window.dispatchEvent(new CustomEvent('sentinel:camera-active', { detail: 'ingestion' }));
    const mode = overrideFacing || facingMode;

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // High resolution constraints for crisp document OCR extraction
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            facingMode: mode
          },
          audio: false
        });
        streamRef.current = stream;
        setIsCameraActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => console.warn('Play error:', err));
        }
      } else {
        setCameraError('Camera API is not supported in this browser environment. Please use File Upload.');
      }
    } catch (err) {
      console.warn('High-resolution camera access failed, trying standard fallback:', err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = fallbackStream;
        setIsCameraActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.play().catch((err) => console.warn('Play error:', err));
        }
      } catch (fallbackErr) {
        console.warn('Camera access denied or unavailable:', fallbackErr);
        setCameraError('Camera access was denied or no camera device is connected. Please check permissions or select File Upload.');
        setIsCameraActive(false);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setIsStreamReady(false);
    setStreamResolution(null);
  };

  const toggleFacingMode = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    setIsMirrored(newMode === 'user');
    startCamera(newMode);
  };

  const toggleMirror = () => {
    setIsMirrored((prev) => !prev);
  };

  const toggleCrop = () => {
    setCropToViewfinder((prev) => !prev);
  };

  const captureFromCamera = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      alert('Camera video feed is still synchronizing with sensor. Please wait a moment.');
      return;
    }
    setIsCapturing(true);

    // Trigger visual shutter flash
    setShowShutterFlash(true);
    setTimeout(() => {
      setShowShutterFlash(false);
    }, 350);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const guide = viewfinderRef.current;

      let sx = 0;
      let sy = 0;
      let sw = vw;
      let sh = vh;

      // When cropToViewfinder is active and guide is mounted, crop directly to the card
      if (cropToViewfinder && guide) {
        const vidRect = video.getBoundingClientRect();
        const guideRect = guide.getBoundingClientRect();

        const dw = vidRect.width;
        const dh = vidRect.height;

        if (dw > 0 && dh > 0) {
          // Object-fit: cover coordinate projection
          const scale = Math.max(dw / vw, dh / vh);
          const renderedW = vw * scale;
          const renderedH = vh * scale;
          const offsetX = (renderedW - dw) / 2;
          const offsetY = (renderedH - dh) / 2;

          // Relative coordinates of guide box within <video> element
          const gx = guideRect.left - vidRect.left;
          const gy = guideRect.top - vidRect.top;
          const gw = guideRect.width;
          const gh = guideRect.height;

          // Map on-screen guide bounding box to native video stream pixels
          let computedX = (gx + offsetX) / scale;
          let computedY = (gy + offsetY) / scale;
          let computedW = gw / scale;
          let computedH = gh / scale;

          // Adjust X coordinate if preview was mirrored
          if (isMirrored) {
            computedX = vw - (computedX + computedW);
          }

          // 6% safe boundary padding so document edges and MRZ lines aren't cut
          const padX = computedW * 0.06;
          const padY = computedH * 0.06;

          sx = Math.max(0, computedX - padX);
          sy = Math.max(0, computedY - padY);
          sw = Math.min(vw - sx, computedW + (padX * 2));
          sh = Math.min(vh - sy, computedH + (padY * 2));
        }
      }

      canvas.width = Math.round(sw);
      canvas.height = Math.round(sh);

      if (isMirrored) {
        // Horizontally unmirror when drawing to canvas so document text is oriented left-to-right
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(
        video,
        Math.round(sx),
        Math.round(sy),
        Math.round(sw),
        Math.round(sh),
        0,
        0,
        canvas.width,
        canvas.height
      );

      canvas.toBlob((blob) => {
        if (!blob) {
          setIsCapturing(false);
          return;
        }
        const capturedFile = new File([blob], `live_${category.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        stopCamera();
        setIngestionMode('upload');
        setIsCapturing(false);
        processFile(capturedFile);
      }, 'image/jpeg', 0.95);
    } catch (err) {
      console.error('Snapshot capture error:', err);
      setIsCapturing(false);
    }
  };

  const processFile = (file) => {
    if (!file) return;

    setInvalidImageError(null);
    setInvalidDetails(null);
    setIsScanning(true);
    setScanStatus('Reading document with EasyOCR & ELA Forensics engine...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result;
      let isDocumentValid = false;

      // Base document payload
      const draftData = {
        id: `upload-${Date.now()}`,
        category: category,
        title: file.name,
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(1) + ' KB',
        summary: `Ingested document (${category}) for digital forensics.`,
        threatScore: 0,
        status: 'PENDING',
        holderName: '',
        docNumber: '',
        dob: '',
        expiry: '',
        relativeName: '',
        gender: '',
        imageSrc: dataUrl,
        mrzLine1: null,
        mrzLine2: null,
        tamperedBoxes: [],
        anomalies: [],
        faceMatchScore: null,
        livenessScore: null,
        livenessPassed: null,
        qrSignatureValid: null,
        docFaceImage: null,
        liveFaceImage: null,
        faceDetected: false,
        imageQuality: null,
        splicingInfo: null
      };

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);

        let res = null;
        try {
          res = await fetch('https://veriforge-e0xz.onrender.com/api/screen-document', {
            method: 'POST',
            body: formData
          });
        } catch {
          // Fallback to 127.0.0.1 IPv4 if localhost doesn't route
          try {
            res = await fetch('https://veriforge-e0xz.onrender.com/api/screen-document', {
              method: 'POST',
              body: formData
            });
          } catch {
            res = null;
          }
        }

        if (res && res.ok) {
          const result = await res.json();

          // Reject invalid documents or non-document subjects
          if (result.is_valid_document === false || result.status === 'INVALID') {
            isDocumentValid = false;
            setInvalidImageError(result.error || 'The image is invalid. Only Aadhaar, Visa, Voter ID, and Passport documents are accepted.');
            setInvalidDetails(result.detail || 'This system only accepts Aadhaar, Visa, Voter ID, and Passport. Any other document or subject is invalid.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
          }

          isDocumentValid = true;
          setInvalidImageError(null);
          setInvalidDetails(null);

          const ext = result.extracted || {};
          draftData.holderName = ext.holder_name && ext.holder_name !== 'NOT DETECTED' ? ext.holder_name : '';
          draftData.docNumber = ext.doc_number && ext.doc_number !== 'NOT DETECTED' ? ext.doc_number : '';
          draftData.dob = ext.dob && ext.dob !== 'NOT DETECTED' ? ext.dob : '';
          draftData.expiry = ext.expiry && ext.expiry !== 'NOT DETECTED' ? ext.expiry : '';
          draftData.relativeName = ext.relative_name || '';
          draftData.gender = ext.gender || '';
          draftData.category = result.category || category;
          if (result.category && ['Passport', 'Aadhaar', 'Visa', 'Voter ID'].includes(result.category)) {
            setCategory(result.category);
          }
          draftData.mrzLine1 = result.mrz_line1 || null;
          draftData.mrzLine2 = result.mrz_line2 || null;
          draftData.threatScore = result.threat_score ?? 0;
          draftData.status = result.verdict || 'SAFE';
          draftData.anomalies = result.anomalies || [];
          draftData.docFaceImage = result.doc_face_image || null;
          draftData.faceDetected = result.face_detected || false;
          draftData.imageQuality = result.image_quality || null;
          draftData.splicingInfo = result.splicing_info || null;

          // Enhanced SIH PS 188 Telemetry
          draftData.dtdAnalysis = result.dtd_analysis || null;
          draftData.screenRecapture = result.screen_recapture || null;
          draftData.fontGeometry = result.font_geometry || null;
          draftData.qrCrossConsistency = result.qr_cross_consistency || null;
          draftData.edgeBenchmark = result.edge_benchmark || null;
          draftData.evidentiarySheet = result.evidentiary_sheet || null;
          draftData.tamperedBoxes = result.tampered_boxes || [];
          draftData.mrz_validation = result.mrz_validation || null;
          draftData.aadhaar_validation = result.aadhaar_validation || null;
          draftData.voter_validation = result.voter_validation || null;

          if (draftData.mrzLine1) setMrzLine1(draftData.mrzLine1);
          if (draftData.mrzLine2) setMrzLine2(draftData.mrzLine2);
        } else {
          // If response not ok or backend rejected
          let errorJson = null;
          try {
            errorJson = await res.json();
          } catch {
            errorJson = null;
          }
          if (errorJson && (errorJson.is_valid_document === false || errorJson.error)) {
            setInvalidImageError(errorJson.error || 'The image is invalid. Only Aadhaar, Visa, Voter ID, and Passport documents are accepted.');
            setInvalidDetails(errorJson.detail || 'The uploaded file is not a supported identification document.');
          }
        }
      } catch (err) {
        // Handled silently to avoid unhandled console errors
      } finally {
        setIsScanning(false);
        setScanStatus('');
        if (isDocumentValid && onCustomUpload) {
          onCustomUpload(draftData);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTriggerSyntheticAttack = async (attackType) => {
    setIsScanning(true);
    setScanStatus(`Synthesizing Adversarial Attack (${attackType.replace(/_/g, ' ')})...`);
    try {
      const formData = new FormData();
      if (fileInputRef.current?.files?.[0]) {
        formData.append('file', fileInputRef.current.files[0]);
      }
      formData.append('attack_type', attackType);
      formData.append('apply_compression', 'true');

      let res = null;
      try {
        res = await fetch('https://veriforge-e0xz.onrender.com/api/generate-tampered-sample', {
          method: 'POST',
          body: formData
        });
      } catch {
        try {
          res = await fetch('https://veriforge-e0xz.onrender.com/api/generate-tampered-sample', {
            method: 'POST',
            body: formData
          });
        } catch {
          res = null;
        }
      }

      if (res && res.ok) {
        const data = await res.json();
        if (data.tampered_image_data_url) {
          const blob = await (await fetch(data.tampered_image_data_url)).blob();
          const forgedFile = new File([blob], `adversarial_${attackType.toLowerCase()}.jpg`, { type: 'image/jpeg' });
          processFile(forgedFile);
        }
      }
    } catch (err) {
      console.warn('Adversarial synthesis error:', err);
    } finally {
      setIsScanning(false);
      setScanStatus('');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    if (activeScenario && onCustomUpload) {
      onCustomUpload({
        ...activeScenario,
        category: newCat,
        mrzLine1: newCat === 'Passport' ? (mrzLine1 || activeScenario.mrzLine1 || '') : null,
        mrzLine2: newCat === 'Passport' ? (mrzLine2 || activeScenario.mrzLine2 || '') : null
      });
    }
  };

  const handleMrzUpdate = (line1, line2) => {
    setMrzLine1(line1);
    setMrzLine2(line2);
    if (activeScenario && onCustomUpload) {
      onCustomUpload({
        ...activeScenario,
        mrzLine1: line1,
        mrzLine2: line2
      });
    }
  };

  const handleFieldEdit = (field, value) => {
    if (activeScenario && onCustomUpload) {
      onCustomUpload({
        ...activeScenario,
        [field]: value
      });
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">
          <FileText size={18} color="var(--primary)" /> 1. Document Ingestion & Screening
        </span>
        {activeScenario && (
          <button 
            onClick={() => {
              stopCamera();
              if (onClearDocument) onClearDocument();
            }}
            className="btn btn-outline btn-sm"
            style={{ color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
            title="Clear current document and upload a new one"
          >
            <Trash2 size={13} /> Clear Document
          </button>
        )}
      </div>

      {/* Invalid Document Image Alert Banner */}
      {invalidImageError && (
        <div style={{
          padding: '14px 16px',
          background: '#FEF2F2',
          border: '1.5px solid #EF4444',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px',
          color: '#991B1B'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <AlertCircle size={20} color="#DC2626" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '4px', color: '#991B1B' }}>
                  {invalidImageError}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#B91C1C', lineHeight: '1.4' }}>
                  {invalidDetails || 'This system only accepts Aadhaar, Visa, Voter ID, and Passport. Any other document or subject is invalid.'}
                </div>
                <div style={{ 
                  marginTop: '8px', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  padding: '3px 8px', 
                  background: '#FEE2E2', 
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#7F1D1D'
                }}>
                  <ShieldAlert size={12} />
                  <span>Only Accepted Inputs:</span> Aadhaar • Visa • Voter ID • Passport
                </div>
              </div>
            </div>
            <button
              onClick={() => { setInvalidImageError(null); setInvalidDetails(null); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#991B1B',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                lineHeight: 1
              }}
              title="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Real-time OCR & Forensics Progress Bar */}
      {isScanning && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 14px',
          background: 'var(--primary-light)',
          border: '1px solid var(--primary)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '16px',
          color: 'var(--primary)',
          fontSize: '0.825rem'
        }}>
          <Loader2 size={18} className="spin-animation" />
          <div>
            <span style={{ fontWeight: 'bold' }}>Running Optical Character Recognition (OCR)...</span>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Extracting document number, holder details, and machine readable zone (MRZ)...
            </div>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      {!activeScenario ? (
        <div>
          {/* Category Selector */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
              Document Category
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {['Passport', 'Aadhaar', 'Visa', 'Voter ID'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '8px 6px',
                    borderRadius: 'var(--radius-sm)',
                    border: category === cat ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    background: category === cat ? 'var(--primary-light)' : '#ffffff',
                    color: category === cat ? 'var(--primary)' : 'var(--text-main)',
                    fontWeight: category === cat ? 600 : 500,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'center'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Ingestion Mode Toggle: Upload vs Camera */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <button
              type="button"
              onClick={() => { setIngestionMode('upload'); stopCamera(); setCameraError(null); }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: ingestionMode === 'upload' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                background: ingestionMode === 'upload' ? 'var(--primary-light)' : '#ffffff',
                color: ingestionMode === 'upload' ? 'var(--primary)' : 'var(--text-main)',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <FileUp size={15} /> Upload File
            </button>
            <button
              type="button"
              onClick={() => { setIngestionMode('camera'); startCamera(); }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: ingestionMode === 'camera' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                background: ingestionMode === 'camera' ? 'var(--primary-light)' : '#ffffff',
                color: ingestionMode === 'camera' ? 'var(--primary)' : 'var(--text-main)',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Camera size={15} /> Real-Time Camera Scanner
              <span style={{
                background: 'var(--primary)',
                color: '#ffffff',
                borderRadius: '9999px',
                padding: '1px 6px',
                fontSize: '0.625rem',
                fontWeight: 700,
                letterSpacing: '0.5px'
              }}>LIVE</span>
            </button>
          </div>

          {/* Mode 1: Drag and Drop Upload */}
          {ingestionMode === 'upload' ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: dragActive ? '2px dashed var(--primary)' : '2px dashed var(--border-dark)',
                borderRadius: 'var(--radius-md)',
                background: dragActive ? 'var(--primary-light)' : 'var(--bg-card-alt)',
                padding: '34px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '16px'
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <FileUp size={24} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                Click to Upload or Drag & Drop Document
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Supports Aadhaar, Visa, Voter ID, Passport (JPEG, PNG, WEBP)
              </div>
              <div style={{ marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIngestionMode('camera');
                    startCamera();
                  }}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.72rem', background: '#ffffff' }}
                >
                  <Camera size={12} /> Or Scan Document with Real-Time Camera
                </button>
              </div>
            </div>
          ) : (
            /* Mode 2: Real-Time Camera Scanner Viewport */
            <div style={{ marginBottom: '16px' }}>
              <div className="doc-scanner-viewport">
                {isCameraActive ? (
                  <>
                    <video
                      ref={setVideoRef}
                      autoPlay
                      playsInline
                      muted
                      onLoadedMetadata={handleVideoMetadata}
                      onCanPlay={handleVideoMetadata}
                      className={isMirrored ? 'video-mirrored' : 'video-standard'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {/* Animated scanning laser line */}
                    <div className="scan-line" />
                    
                    {/* Card alignment guide overlay with ref for coordinate mapping */}
                    <div ref={viewfinderRef} className="viewfinder-card-guide">
                      <div className="viewfinder-corner top-left" />
                      <div className="viewfinder-corner top-right" />
                      <div className="viewfinder-corner bottom-left" />
                      <div className="viewfinder-corner bottom-right" />
                    </div>

                    {/* Visual Shutter Flash Overlay */}
                    {showShutterFlash && <div className="shutter-flash-overlay" />}

                    {/* Floating instruction pill */}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'rgba(15, 23, 42, 0.85)',
                      backdropFilter: 'blur(4px)',
                      color: '#f8fafc',
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      pointerEvents: 'none',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      whiteSpace: 'nowrap'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                      Align {category} within frame & hold steady
                    </div>

                    {/* Sensor Sync Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: isStreamReady ? 'rgba(22, 101, 52, 0.9)' : 'rgba(180, 83, 9, 0.9)',
                      color: '#ffffff',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      letterSpacing: '0.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      pointerEvents: 'none'
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: isStreamReady ? '#4ade80' : '#fef08a'
                      }} />
                      {isStreamReady ? (streamResolution ? `LIVE SYNCED (${streamResolution})` : 'LIVE SYNCED') : 'SYNCING SENSOR...'}
                    </div>
                  </>
                ) : cameraError ? (
                  <div style={{ padding: '24px 20px', textAlign: 'center', color: '#f8fafc' }}>
                    <AlertCircle size={32} color="#f87171" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#fca5a5' }}>
                      Camera Access Unavailable
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', maxWidth: '320px', margin: '0 auto 14px', lineHeight: '1.4' }}>
                      {cameraError}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => startCamera()}
                        className="btn btn-primary btn-sm"
                        type="button"
                      >
                        <RefreshCw size={12} /> Retry Camera
                      </button>
                      <button
                        onClick={() => { setIngestionMode('upload'); stopCamera(); setCameraError(null); }}
                        className="btn btn-outline btn-sm"
                        type="button"
                        style={{ color: '#ffffff', borderColor: '#475569', background: '#334155' }}
                      >
                        Use File Upload
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                    <Loader2 size={28} className="spin-animation" style={{ margin: '0 auto 8px', color: 'var(--primary)' }} />
                    <div style={{ fontSize: '0.8rem' }}>Initializing High-Definition Video Feed...</div>
                  </div>
                )}
              </div>

              {/* Camera Controls Bar */}
              {isCameraActive && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--bg-card-alt)',
                  borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  borderTop: 'none',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {/* Left Controls: Flip & Mirror */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={toggleFacingMode}
                      className="btn btn-outline btn-sm"
                      title="Flip between front and rear camera sensor"
                      style={{ fontSize: '0.72rem', padding: '5px 8px' }}
                    >
                      <RefreshCw size={12} /> Flip Sensor
                    </button>

                    <button
                      type="button"
                      onClick={toggleMirror}
                      className="btn btn-outline btn-sm"
                      title={isMirrored ? "Mirror mode is ON (click to unmirror)" : "Mirror mode is OFF (click to mirror)"}
                      style={{ 
                        fontSize: '0.72rem', 
                        padding: '5px 8px',
                        borderColor: isMirrored ? 'var(--primary)' : 'var(--border-color)',
                        color: isMirrored ? 'var(--primary)' : 'inherit',
                        background: isMirrored ? 'var(--primary-light)' : 'transparent'
                      }}
                    >
                      <FlipHorizontal size={12} /> {isMirrored ? 'Mirrored' : 'Normal'}
                    </button>
                  </div>

                  {/* Center Controls: Shutter Button */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={captureFromCamera}
                      disabled={isCapturing || !isStreamReady}
                      className="shutter-btn pulse-glow"
                      style={{ opacity: !isStreamReady ? 0.6 : 1 }}
                      title={`Capture ${category} Snapshot`}
                    >
                      <Camera size={22} color="var(--primary)" />
                    </button>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--primary)', marginTop: '4px' }}>
                      {isCapturing ? 'Processing...' : (!isStreamReady ? 'Syncing...' : `Capture ${category}`)}
                    </span>
                  </div>

                  {/* Right Controls: Viewfinder Crop Toggle & Close */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={toggleCrop}
                      className="btn btn-outline btn-sm"
                      title={cropToViewfinder ? "Crop to card viewfinder enabled" : "Capturing full camera frame"}
                      style={{ 
                        fontSize: '0.72rem', 
                        padding: '5px 8px',
                        borderColor: cropToViewfinder ? 'var(--primary)' : 'var(--border-color)',
                        color: cropToViewfinder ? 'var(--primary)' : 'inherit',
                        background: cropToViewfinder ? 'var(--primary-light)' : 'transparent'
                      }}
                    >
                      <Crop size={12} /> {cropToViewfinder ? 'Auto-Crop Card' : 'Full Frame'}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setIngestionMode('upload'); stopCamera(); }}
                      className="btn btn-outline btn-sm"
                      title="Cancel and switch back to file upload"
                      style={{ fontSize: '0.72rem', padding: '5px 8px' }}
                    >
                      <X size={12} /> Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Adversarial Attack Testing & Data Augmentation Suite */}
          <div style={{
            marginBottom: '14px',
            padding: '12px',
            background: 'var(--bg-card-alt)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldAlert size={14} color="#ef4444" /> Adversarial Attack Testing (Synthetic Augmentation)
              </span>
              <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                SIH Evaluation Suite
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: 1.3 }}>
              Test how SENTINEL-ID detects adversarial manipulations that bypass classical ELA:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button
                type="button"
                onClick={() => handleTriggerSyntheticAttack('POISSON_PHOTO_SWAP')}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.7rem', padding: '5px 8px', justifyContent: 'flex-start' }}
                title="Seamlessly splices an alternate portrait into photo slot"
              >
                📸 Poisson Photo Splicing
              </button>
              <button
                type="button"
                onClick={() => handleTriggerSyntheticAttack('FONT_LOOKALIKE_REPLACEMENT')}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.7rem', padding: '5px 8px', justifyContent: 'flex-start' }}
                title="Swaps DOB with lookalike font introducing +1.8px baseline shift"
              >
                🔤 Font Baseline Shift (+1.8px)
              </button>
              <button
                type="button"
                onClick={() => handleTriggerSyntheticAttack('SELECTIVE_INPAINTING')}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.7rem', padding: '5px 8px', justifyContent: 'flex-start' }}
                title="Erases security fields via selective inpainting"
              >
                🪄 Selective Field Inpaint
              </button>
              <button
                type="button"
                onClick={() => handleTriggerSyntheticAttack('ALL')}
                className="btn btn-primary btn-sm"
                style={{ fontSize: '0.7rem', padding: '5px 8px', justifyContent: 'flex-start' }}
                title="Injects multi-vector attack with WhatsApp re-compression"
              >
                ⚡ Full Adversarial Suite
              </button>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            fontSize: '0.75rem', 
            color: 'var(--text-muted)',
            padding: '10px 12px',
            background: 'var(--bg-card-alt)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)'
          }}>
            <Info size={16} color="var(--primary)" />
            <span>Upload or scan an official ID document (Aadhaar, Visa, Voter ID, Passport) to initialize forensics.</span>
          </div>
        </div>
      ) : (
        <div>
          {/* Active Upload Summary Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            background: 'var(--primary-light)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="var(--primary)" />
              <div>
                <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--primary)' }}>
                  {activeScenario.category} Ingested
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                  {activeScenario.fileName || activeScenario.title} {activeScenario.fileSize && `(${activeScenario.fileSize})`}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-outline btn-sm"
                title="Replace with an image file from disk"
              >
                <Upload size={13} /> Replace File
              </button>
              <button
                onClick={() => {
                  if (onClearDocument) onClearDocument();
                  setIngestionMode('camera');
                  setTimeout(() => startCamera(), 100);
                }}
                className="btn btn-outline btn-sm"
                title="Scan a new document via real-time webcam"
              >
                <Camera size={13} /> Live Camera
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>

          {/* Category Switcher for Active Doc */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
              Category
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['Passport', 'Aadhaar', 'Visa', 'Voter ID'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: activeScenario.category === cat ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    background: activeScenario.category === cat ? 'var(--primary-light)' : '#ffffff',
                    color: activeScenario.category === cat ? 'var(--primary)' : 'var(--text-main)',
                    fontWeight: activeScenario.category === cat ? 600 : 500,
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Live Adversarial Injection Controls for Ingested Card */}
          <div style={{
            marginBottom: '14px',
            padding: '10px 12px',
            background: 'var(--bg-card-alt)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ShieldAlert size={13} color="#ef4444" /> Inject Adversarial Tamper on this Card
              </span>
              <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>Live Test</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              <button
                type="button"
                onClick={() => handleTriggerSyntheticAttack('POISSON_PHOTO_SWAP')}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.68rem', padding: '4px 6px', textAlign: 'center' }}
                title="Slices alternate headshot into photo frame"
              >
                Photo Splice
              </button>
              <button
                type="button"
                onClick={() => handleTriggerSyntheticAttack('FONT_LOOKALIKE_REPLACEMENT')}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.68rem', padding: '4px 6px', textAlign: 'center' }}
                title="Alters DOB using lookalike font with +1.8px baseline shift"
              >
                Font Shift
              </button>
              <button
                type="button"
                onClick={() => handleTriggerSyntheticAttack('SELECTIVE_INPAINTING')}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.68rem', padding: '4px 6px', textAlign: 'center' }}
                title="Erases security zone via selective inpainting"
              >
                Inpaint
              </button>
              <button
                type="button"
                onClick={() => handleTriggerSyntheticAttack('ALL')}
                className="btn btn-primary btn-sm"
                style={{ fontSize: '0.68rem', padding: '4px 6px', textAlign: 'center' }}
                title="Injects all attacks with WhatsApp compression"
              >
                Full Attack
              </button>
            </div>
          </div>

          {/* Passport MRZ Inputs if Category is Passport */}
          {activeScenario.category === 'Passport' && (
            <div style={{ marginBottom: '14px', background: 'var(--bg-card-alt)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                TD3 Machine Readable Zone (MRZ)
              </label>
              <input
                type="text"
                placeholder="Line 1 (ICAO 9303 TD3 standard 44 characters)"
                value={activeScenario.mrzLine1 || ''}
                onChange={(e) => handleMrzUpdate(e.target.value, activeScenario.mrzLine2 || '')}
                className="font-mono"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid var(--border-dark)',
                  marginBottom: '6px',
                  background: '#ffffff'
                }}
              />
              <input
                type="text"
                placeholder="Line 2 (ICAO 9303 TD3 standard 44 characters)"
                value={activeScenario.mrzLine2 || ''}
                onChange={(e) => handleMrzUpdate(activeScenario.mrzLine1 || '', e.target.value)}
                className="font-mono"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid var(--border-dark)',
                  background: '#ffffff'
                }}
              />
            </div>
          )}

          {/* Extracted Details Table */}
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
              Extracted Document Info
            </h4>
            <table className="data-table">
              <tbody>
                <tr>
                  <td style={{ width: '35%', color: 'var(--text-muted)' }}>Name</td>
                  <td>
                    <input
                      type="text"
                      value={activeScenario.holderName || ''}
                      onChange={(e) => handleFieldEdit('holderName', e.target.value)}
                      style={{ width: '100%', padding: '4px 6px', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.8125rem' }}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {activeScenario.category === 'Voter ID' ? 'EPIC Number' : 'Document No.'}
                  </td>
                  <td>
                    <input
                      type="text"
                      value={activeScenario.docNumber || ''}
                      onChange={(e) => handleFieldEdit('docNumber', e.target.value)}
                      className="font-mono"
                      style={{ width: '100%', padding: '4px 6px', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.8125rem' }}
                    />
                  </td>
                </tr>
                {(activeScenario.relativeName || activeScenario.category === 'Voter ID') && (
                  <tr>
                    <td style={{ color: 'var(--text-muted)' }}>Relative Name</td>
                    <td>
                      <input
                        type="text"
                        placeholder="Father / Husband's Name"
                        value={activeScenario.relativeName || ''}
                        onChange={(e) => handleFieldEdit('relativeName', e.target.value)}
                        style={{ width: '100%', padding: '4px 6px', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.8125rem' }}
                      />
                    </td>
                  </tr>
                )}
                {(activeScenario.gender || activeScenario.category === 'Voter ID') && (
                  <tr>
                    <td style={{ color: 'var(--text-muted)' }}>Gender</td>
                    <td>
                      <input
                        type="text"
                        placeholder="MALE / FEMALE / OTHER"
                        value={activeScenario.gender || ''}
                        onChange={(e) => handleFieldEdit('gender', e.target.value)}
                        style={{ width: '100%', padding: '4px 6px', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.8125rem' }}
                      />
                    </td>
                  </tr>
                )}
                <tr>
                  <td style={{ color: 'var(--text-muted)' }}>Date of Birth</td>
                  <td>
                    <input
                      type="text"
                      value={activeScenario.dob || ''}
                      onChange={(e) => handleFieldEdit('dob', e.target.value)}
                      className="font-mono"
                      style={{ width: '100%', padding: '4px 6px', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.8125rem' }}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={{ color: 'var(--text-muted)' }}>Expiry Date</td>
                  <td>
                    <input
                      type="text"
                      value={activeScenario.expiry || ''}
                      onChange={(e) => handleFieldEdit('expiry', e.target.value)}
                      className="font-mono"
                      placeholder={activeScenario.category === 'Voter ID' || activeScenario.category === 'Aadhaar' ? 'Lifetime (N/A)' : 'DD/MM/YYYY'}
                      style={{ width: '100%', padding: '4px 6px', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.8125rem' }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
