/**
 * Native Geo-Stamping & Live Watermarking Utility
 * ─────────────────────────────────────────────────────────────────────────────
 * Intercepts image captures and permanently embeds GPS coordinates,
 * timestamp, and artisan ID onto the image using HTML5 Canvas API
 * before persisting to Supabase storage.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Adds an audit-standard GPS coordinates and timestamp watermark to an image file.
 * 
 * @param {File|Blob} file - Captured raw image file
 * @param {string} [artisanId="A-1029"] - Artisan ID or accreditation reference
 * @returns {Promise<File>} - Resolves with the geo-watermarked File
 */
export const addGeoWatermark = async (file, artisanId = "A-1029") => {
  return new Promise((resolve) => {
    if (!file) {
      resolve(file);
      return;
    }

    const drawOnCanvas = (watermarkText) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            URL.revokeObjectURL(objectUrl);
            resolve(file);
            return;
          }

          // 1. Draw original image
          ctx.drawImage(img, 0, 0);

          // 2. Responsive banner height & font size for both low and high-res cameras
          const bannerHeight = Math.max(40, Math.round(img.height * 0.045));
          const fontSize = Math.max(16, Math.round(bannerHeight * 0.38));

          // 3. Add dark semi-transparent banner at the bottom for readability
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.fillRect(0, img.height - bannerHeight, img.width, bannerHeight);

          // 4. Draw Watermark Text
          ctx.fillStyle = '#FFFFFF';
          ctx.font = `${fontSize}px monospace`;
          ctx.textBaseline = 'middle';
          ctx.fillText(watermarkText, Math.max(10, Math.round(img.width * 0.015)), img.height - (bannerHeight / 2));

          // 5. Convert back to File
          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(objectUrl);
              if (!blob) {
                resolve(file);
                return;
              }
              const fileName = file.name ? `geo_${file.name}` : `geo_capture_${Date.now()}.jpg`;
              const watermarkedFile = new File([blob], fileName, { type: 'image/jpeg' });
              resolve(watermarkedFile);
            },
            'image/jpeg',
            0.9
          );
        } catch (err) {
          URL.revokeObjectURL(objectUrl);
          console.warn('[addGeoWatermark] Canvas watermark draw error:', err);
          resolve(file);
        }
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(objectUrl);
        console.warn('[addGeoWatermark] Image load failed:', err);
        resolve(file);
      };
    };

    const timestamp = new Date().toLocaleString();

    // Verify browser Geolocation API availability
    if (!navigator?.geolocation?.getCurrentPosition) {
      console.warn("Location access unavailable. Falling back to timestamp only.");
      const fallbackText = `Date: ${timestamp} | ID: ${artisanId}`;
      drawOnCanvas(fallbackText);
      return;
    }

    // 1. Get GPS Coordinates
    navigator.geolocation.getCurrentPosition(
      (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const watermarkText = `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)} | Date: ${timestamp} | ID: ${artisanId}`;
          drawOnCanvas(watermarkText);
        } catch (err) {
          console.warn("[addGeoWatermark] Geolocation read error, using fallback:", err);
          const fallbackText = `Date: ${timestamp} | ID: ${artisanId}`;
          drawOnCanvas(fallbackText);
        }
      },
      (error) => {
        console.warn("Location access denied or timed out. Falling back to timestamp only:", error?.message || error);
        // Implement a fallback canvas draw here with just the Date/ID
        const fallbackText = `Date: ${timestamp} | ID: ${artisanId}`;
        drawOnCanvas(fallbackText);
      },
      {
        enableHighAccuracy: true,
        timeout: 4000,
        maximumAge: 60000
      }
    );
  });
};

export default addGeoWatermark;
