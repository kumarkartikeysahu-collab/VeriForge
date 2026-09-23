"""
Error Level Analysis (ELA) Engine
Computes compression discrepancies across image blocks to detect digital forgery.
"""
import io
from PIL import Image, ImageChops, ImageEnhance
import numpy as np

def perform_ela(image_bytes: bytes, quality: int = 95, scale: float = 12.0) -> tuple[bytes, float]:
    """
    Performs Error Level Analysis on image bytes.
    Returns: (ela_image_bytes, anomaly_score_0_to_100)
    """
    try:
        # Support raw bytes, bytearray, or base64 data URL strings
        raw_data = image_bytes
        if isinstance(raw_data, str):
            import base64
            if "base64," in raw_data:
                raw_data = raw_data.split("base64,")[1]
            raw_data = base64.b64decode(raw_data)
        elif isinstance(raw_data, (bytearray, memoryview)):
            raw_data = bytes(raw_data)

        orig_image = Image.open(io.BytesIO(raw_data)).convert('RGB')
        
        # Save image to temporary buffer at specified JPEG quality
        buffer = io.BytesIO()
        orig_image.save(buffer, 'JPEG', quality=quality)
        buffer.seek(0)
        resaved_image = Image.open(buffer)

        # Calculate absolute difference
        ela_image = ImageChops.difference(orig_image, resaved_image)
        
        # Calculate anomaly metric from extrema (safe across channel modes)
        extrema = ela_image.getextrema()
        if isinstance(extrema[0], tuple):
            max_diff = max([ex[1] for ex in extrema])
        else:
            max_diff = extrema[1] if len(extrema) > 1 else extrema[0]

        scale_factor = 255.0 / max(max_diff, 1) * 0.8
        
        # Amplify difference
        enhancer = ImageEnhance.Brightness(ela_image)
        amplified = enhancer.enhance(scale_factor)

        # Estimate overall anomaly percentage
        np_ela = np.array(ela_image)
        mean_error = float(np.mean(np_ela))
        anomaly_score = min(100.0, mean_error * 3.5)

        out_buffer = io.BytesIO()
        amplified.save(out_buffer, format='PNG')
        return out_buffer.getvalue(), round(anomaly_score, 2)
    except Exception as e:
        # Graceful fallback on non-raster formats or decode failure
        placeholder = Image.new('RGB', (200, 200), color=(15, 23, 42))
        buf = io.BytesIO()
        placeholder.save(buf, format='PNG')
        return buf.getvalue(), 0.0

