/**
 * Native Geo-Stamping & Live Watermarking Utility
 * Intercepts camera image captures and permanently overlays GPS coordinates,
 * timestamp, and artisan ID onto the image using HTML5 Canvas API.
 * 
 * @param {File|Blob} file - The raw captured image file from the camera.
 * @param {string} [artisanId="A-1029"] - The artisan or entity identifier.
 * @returns {Promise<File>} Watermarked image file.
 */
export const addGeoWatermark = async (file, artisanId = "A-1029") => {
  return new Promise((resolve) => {
    if (!file) {
      resolve(file);
      return;
    }

    // Helper to render watermarked canvas
    const drawCanvasWithWatermark = (watermarkText) => {
      try {
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

            // Responsive banner calculation (scales with high-res phone captures, min 40px)
            const bannerHeight = Math.max(40, Math.round(img.height * 0.04));
            const fontSize = Math.max(16, Math.round(bannerHeight * 0.4));

            // 2. Add dark semi-transparent banner at the bottom for readability
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, img.height - bannerHeight, img.width, bannerHeight);

            // 3. Draw Watermark Text
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `${fontSize}px monospace`;
            ctx.textBaseline = 'middle';
            ctx.fillText(watermarkText, Math.max(10, Math.round(bannerHeight * 0.25)), img.height - Math.round(bannerHeight / 2));

            // 4. Convert back to file
            canvas.toBlob((blob) => {
              URL.revokeObjectURL(objectUrl);
              if (!blob) {
                resolve(file);
                return;
              }
              const fileName = file.name ? `geo_${file.name}` : `geo_capture_${Date.now()}.jpg`;
              const watermarkedFile = new File([blob], fileName, { type: 'image/jpeg' });
              resolve(watermarkedFile);
            }, 'image/jpeg', 0.9);
          } catch (canvasErr) {
            console.warn('[geoWatermark] Canvas draw error, returning original file:', canvasErr);
            URL.revokeObjectURL(objectUrl);
            resolve(file);
          }
        };

        img.onerror = (err) => {
          console.warn('[geoWatermark] Image load error:', err);
          URL.revokeObjectURL(objectUrl);
          resolve(file);
        };
      } catch (err) {
        console.warn('[geoWatermark] Execution error:', err);
        resolve(file);
      }
    };

    // 1. Get GPS Coordinates
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const timestamp = new Date().toLocaleString();
          const watermarkText = `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)} | Date: ${timestamp} | ID: ${artisanId}`;
          drawCanvasWithWatermark(watermarkText);
        },
        (error) => {
          console.warn("Location access denied. Falling back to timestamp only.", error?.message);
          const timestamp = new Date().toLocaleString();
          const watermarkText = `Date: ${timestamp} | ID: ${artisanId}`;
          drawCanvasWithWatermark(watermarkText);
        },
        { timeout: 4000, maximumAge: 60000, enableHighAccuracy: true }
      );
    } else {
      console.warn("Geolocation API unavailable. Falling back to timestamp only.");
      const timestamp = new Date().toLocaleString();
      const watermarkText = `Date: ${timestamp} | ID: ${artisanId}`;
      drawCanvasWithWatermark(watermarkText);
    }
  });
};

export default addGeoWatermark;
