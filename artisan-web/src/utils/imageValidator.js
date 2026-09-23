import exifr from 'exifr';

/**
 * EXIF Metadata Fraud Detection
 * Checks if software tags indicate digital manipulation (e.g. Photoshop, Canva, Lightroom).
 */
export const verifyImageMetadata = async (file) => {
  try {
    const data = await exifr.parse(file, ['Software', 'Make', 'Model']);
    if (data?.Software) {
      const software = data.Software.toLowerCase();
      if (software.includes('photoshop') || software.includes('canva') || software.includes('lightroom')) {
        alert("Digital manipulation detected. Please capture a real, unedited photo.");
        return false;
      }
    }
    return true;
  } catch (error) {
    console.warn("No EXIF data found - proceed with AI visual check.", error);
    return true;
  }
};

export const validateImageLightweight = (file) => {
  return new Promise((resolve) => {
    if (!file) {
      return resolve({ valid: false, reason: "No image file provided." });
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // 1. Min Resolution Gate
        if (img.width < 400 || img.height < 400) {
          return resolve({ valid: false, reason: "Image resolution too low. Please hold camera closer." });
        }

        // 2. Downsample to 128x128 for instant math
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({ valid: true }); // Fallback if 2D context unavailable
        }

        ctx.drawImage(img, 0, 0, 128, 128);

        const imgData = ctx.getImageData(0, 0, 128, 128).data;
        let totalLuma = 0;
        const gray = new Float32Array(128 * 128);

        // Convert to Grayscale & Calculate Brightness
        for (let i = 0, j = 0; i < imgData.length; i += 4, j++) {
          const luma = 0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2];
          gray[j] = luma;
          totalLuma += luma;
        }

        const avgBrightness = totalLuma / gray.length;
        if (avgBrightness < 35) {
          return resolve({ valid: false, reason: "Photo is too dark. Move to a well-lit area." });
        }
        if (avgBrightness > 235) {
          return resolve({ valid: false, reason: "Photo is overexposed or washed out." });
        }

        // 3. Fast Laplacian Variance (Blur Check) on 128x128 matrix
        let laplaceVarSum = 0;
        let count = 0;
        for (let y = 1; y < 127; y++) {
          for (let x = 1; x < 127; x++) {
            const idx = y * 128 + x;
            // 3x3 Laplacian Kernel: [0, 1, 0; 1, -4, 1; 0, 1, 0]
            const laplacian = 
              gray[idx - 128] + 
              gray[idx - 1] - (4 * gray[idx]) + 
              gray[idx + 1] + 
              gray[idx + 128];
            laplaceVarSum += Math.abs(laplacian);
            count++;
          }
        }

        const edgeSharpness = laplaceVarSum / count;
        // Threshold calibrated for 128x128 canvas
        if (edgeSharpness < 5.5) {
          return resolve({ valid: false, reason: "Photo is blurry. Keep hands steady and tap to focus." });
        }

        resolve({ valid: true, edgeSharpness, avgBrightness });
      };

      img.onerror = () => {
        resolve({ valid: true }); // Fallback on decode failure
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      resolve({ valid: true }); // Fallback on reader failure
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Localized reason helper for multi-lingual audio and toast feedback
 */
export const getLocalizedValidationReason = (reason, lang = 'en') => {
  if (lang !== 'hi') return reason;
  if (!reason) return '';

  if (reason.includes('blurry')) {
    return 'तस्वीर धुंधली है। हाथ स्थिर रखें और फोकस करने के लिए टैप करें।';
  }
  if (reason.includes('too dark')) {
    return 'तस्वीर बहुत अंधेरी है। कृपया अच्छी रोशनी वाली जगह पर जाएं।';
  }
  if (reason.includes('overexposed') || reason.includes('washed out')) {
    return 'तस्वीर में बहुत अधिक रोशनी है। कृपया छाया में फोटो लें।';
  }
  if (reason.includes('resolution too low')) {
    return 'तस्वीर का रिज़ॉल्यूशन कम है। कृपया कैमरे को शिल्प के थोड़ा पास रखें।';
  }
  return reason;
};

export default validateImageLightweight;
