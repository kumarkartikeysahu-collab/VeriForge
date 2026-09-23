"""
Automated Document Tampering Generator (Synthetic Augmentation Pipeline)
Generates realistic adversarial document manipulations for training and evaluation:
1. Poisson Image Blending of headshots into photo slots (seamless cloning).
2. Random font replacement with lookalike fonts and baseline deviations.
3. Selective inpainting on DOB / Address / Document Number fields.
4. Social Media (WhatsApp/Telegram) compression simulation.
"""

import io
import base64
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont
from typing import Dict, Any, List, Tuple, Optional


def create_adversarial_headshot(w: int, h: int) -> np.ndarray:
    """Generates a synthetic alternate headshot for adversarial photo swapping."""
    img = np.full((h, w, 3), (225, 230, 238), dtype=np.uint8)
    cx, cy = w // 2, h // 2
    # Torso
    cv2.ellipse(img, (cx, int(h * 0.95)), (int(w * 0.48), int(h * 0.35)), 0, 0, 360, (60, 45, 120), -1)
    # Face skin (contrasting tone)
    cv2.ellipse(img, (cx, int(cy * 0.9)), (int(w * 0.32), int(h * 0.36)), 0, 0, 360, (175, 195, 235), -1)
    # Hair
    cv2.ellipse(img, (cx, int(cy * 0.55)), (int(w * 0.34), int(h * 0.22)), 0, 0, 360, (30, 25, 35), -1)
    # Eyes
    eye_offset = int(w * 0.14)
    cv2.circle(img, (cx - eye_offset, int(cy * 0.85)), int(w * 0.05), (255, 255, 255), -1)
    cv2.circle(img, (cx + eye_offset, int(cy * 0.85)), int(w * 0.05), (255, 255, 255), -1)
    cv2.circle(img, (cx - eye_offset, int(cy * 0.85)), int(w * 0.025), (70, 40, 20), -1)
    cv2.circle(img, (cx + eye_offset, int(cy * 0.85)), int(w * 0.025), (70, 40, 20), -1)
    # Mouth
    cv2.ellipse(img, (cx, int(cy * 1.15)), (int(w * 0.12), int(h * 0.04)), 0, 0, 180, (90, 80, 180), 2)
    return img


def apply_poisson_photo_swap(
    doc_bgr: np.ndarray,
    face_box: Optional[Dict[str, Any]] = None
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Applies Poisson image blending (seamless cloning) to swap the ID photo.
    Leaves subtle Poisson gradient edge boundary discontinuities detectable by the DTD.
    """
    h, w = doc_bgr.shape[:2]
    if face_box:
        fx = int(face_box.get("x", w * 0.08))
        fy = int(face_box.get("y", h * 0.25))
        fw = int(face_box.get("width", w * 0.25))
        fh = int(face_box.get("height", h * 0.45))
    else:
        # Default typical document photo coordinates
        fx = int(w * 0.08)
        fy = int(h * 0.25)
        fw = int(w * 0.25)
        fh = int(h * 0.45)

    fx = max(0, min(fx, w - fw))
    fy = max(0, min(fy, h - fh))
    fw = max(20, min(fw, w - fx))
    fh = max(20, min(fh, h - fy))

    headshot = create_adversarial_headshot(fw, fh)
    mask = 255 * np.ones((fh, fw), dtype=np.uint8)
    center = (fx + fw // 2, fy + fh // 2)

    try:
        blended = cv2.seamlessClone(headshot, doc_bgr, mask, center, cv2.NORMAL_CLONE)
    except Exception:
        # Fallback to direct alpha blend
        blended = doc_bgr.copy()
        blended[fy:fy+fh, fx:fx+fw] = cv2.addWeighted(doc_bgr[fy:fy+fh, fx:fx+fw], 0.1, headshot, 0.9, 0)

    tamper_box = {
        "x": round((fx / w) * 100, 1),
        "y": round((fy / h) * 100, 1),
        "width": round((fw / w) * 100, 1),
        "height": round((fh / h) * 100, 1),
        "attack": "POISSON_PHOTO_SWAP",
        "description": "Adversarial Poisson headshot spliced into identity portrait frame"
    }

    return blended, tamper_box


def apply_lookalike_font_alteration(
    doc_bgr: np.ndarray,
    field_coords: Optional[Tuple[int, int, int, int]] = None,
    altered_text: str = "15/08/1998"
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Simulates font replacement with lookalikes, introducing a +1.8px baseline
    regression offset and kerning irregularity.
    """
    h, w = doc_bgr.shape[:2]
    if field_coords:
        bx, by, bw, bh = field_coords
    else:
        # Typical DOB region
        bx, by, bw, bh = int(w * 0.40), int(h * 0.48), int(w * 0.28), int(h * 0.08)

    bx = max(0, min(bx, w - bw))
    by = max(0, min(by, h - bh))

    output = doc_bgr.copy()
    
    # 1. Inpaint existing text area with Telea algorithm
    inpaint_mask = np.zeros((h, w), dtype=np.uint8)
    inpaint_mask[by:by+bh, bx:bx+bw] = 255
    output = cv2.inpaint(output, inpaint_mask, 3, cv2.INPAINT_TELEA)

    # 2. Re-render text with synthetic lookalike font & +1.8px baseline shift
    baseline_offset_y = by + bh - int(bh * 0.25) + 2  # Shift baseline +2px
    font_scale = max(0.45, bh / 32.0)
    thickness = 2
    
    # Render with OpenCV font (simulating Liberation Sans / Arial lookalike mismatch)
    cv2.putText(
        output,
        altered_text,
        (bx + 4, baseline_offset_y),
        cv2.FONT_HERSHEY_SIMPLEX,
        font_scale,
        (30, 25, 20),
        thickness,
        cv2.LINE_AA
    )

    tamper_box = {
        "x": round((bx / w) * 100, 1),
        "y": round((by / h) * 100, 1),
        "width": round((bw / w) * 100, 1),
        "height": round((bh / h) * 100, 1),
        "attack": "FONT_LOOKALIKE_REPLACEMENT",
        "description": f"Text altered to '{altered_text}' using lookalike font with +1.8px baseline deviation"
    }

    return output, tamper_box


def apply_selective_inpainting(
    doc_bgr: np.ndarray,
    region: Optional[Tuple[int, int, int, int]] = None
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Erases text using Navier-Stokes / Telea inpainting to simulate LaMa / Stable Diffusion inpainting.
    """
    h, w = doc_bgr.shape[:2]
    if region:
        rx, ry, rw, rh = region
    else:
        # Typical document number area
        rx, ry, rw, rh = int(w * 0.35), int(h * 0.72), int(w * 0.38), int(h * 0.09)

    mask = np.zeros((h, w), dtype=np.uint8)
    mask[ry:ry+rh, rx:rx+rw] = 255
    inpainted = cv2.inpaint(doc_bgr, mask, 5, cv2.INPAINT_NS)

    tamper_box = {
        "x": round((rx / w) * 100, 1),
        "y": round((ry / h) * 100, 1),
        "width": round((rw / w) * 100, 1),
        "height": round((rh / h) * 100, 1),
        "attack": "SELECTIVE_INPAINTING",
        "description": "Erased official security field via selective digital inpainting"
    }

    return inpainted, tamper_box


def simulate_whatsapp_compression(doc_bgr: np.ndarray, quality: int = 70) -> np.ndarray:
    """
    Simulates social media (WhatsApp) compression:
    JPEG re-quantization at Quality 70 with 4:2:0 subsampling.
    """
    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
    _, encimg = cv2.imencode('.jpg', doc_bgr, encode_param)
    decompressed = cv2.imdecode(encimg, 1)
    return decompressed


def generate_tampered_document_sample(
    image_bytes: bytes,
    attack_type: str = "ALL",
    apply_compression: bool = True
) -> Dict[str, Any]:
    """
    Master pipeline generating synthetic document tampering samples.
    Used both for dataset generation and live interactive testing by evaluation jury.
    """
    try:
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    except Exception as e:
        return {"error": f"Failed to load image: {str(e)}"}

    output_bgr = bgr.copy()
    tampered_boxes = []

    if attack_type in ["POISSON_PHOTO_SWAP", "ALL"]:
        output_bgr, box1 = apply_poisson_photo_swap(output_bgr)
        tampered_boxes.append(box1)

    if attack_type in ["FONT_LOOKALIKE_REPLACEMENT", "ALL"]:
        output_bgr, box2 = apply_lookalike_font_alteration(output_bgr)
        tampered_boxes.append(box2)

    if attack_type in ["SELECTIVE_INPAINTING", "ALL"]:
        output_bgr, box3 = apply_selective_inpainting(output_bgr)
        tampered_boxes.append(box3)

    if apply_compression:
        output_bgr = simulate_whatsapp_compression(output_bgr, quality=72)

    # Encode to base64 JPEG
    success, buffer = cv2.imencode('.jpg', output_bgr, [cv2.IMWRITE_JPEG_QUALITY, 85])
    if not success:
        return {"error": "Failed to encode output image"}

    b64_str = base64.b64encode(buffer).decode('utf-8')
    data_url = f"data:image/jpeg;base64,{b64_str}"

    return {
        "tampered_image_data_url": data_url,
        "tampered_boxes": tampered_boxes,
        "attacks_applied": [b["attack"] for b in tampered_boxes],
        "whatsapp_compression_applied": apply_compression,
        "evidentiary_log": f"Synthesized {len(tampered_boxes)} adversarial attack vectors. Ready for forensic model screening."
    }
