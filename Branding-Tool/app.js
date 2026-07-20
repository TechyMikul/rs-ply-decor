/**
 * RS PLY DECOR — Branding & Watermark Studio
 * Application Core Logic (app.js)
 */

document.addEventListener('DOMContentLoaded', () => {
  // State Management
  const state = {
    images: [], // List of { file, name, src, originalImg, width, height, adjustments }
    currentIndex: -1,
  };

  const defaultAdjustments = {
    replaceWatermark: true,
    watermarkText: 'RS PLY DECOR',
    watermarkX: 5,  // Top Left (Default placement for RS branding)
    watermarkY: 4,
    watermarkSize: 30,
    embedPhone: true,
    phoneText: 'For Inquiries & Orders: +91 86675 06984',
    phoneSize: 18,
    phoneOpacity: 90
  };

  // DOM Elements
  const uploadArea = document.getElementById('upload-area');
  const fileInput = document.getElementById('file-input');
  const batchStrip = document.getElementById('batch-strip');
  const batchThumbnails = document.getElementById('batch-thumbnails');
  const batchCount = document.getElementById('batch-count');
  
  const previewPlaceholder = document.getElementById('preview-placeholder');
  const previewContainer = document.getElementById('preview-container');
  const imagePreview = document.getElementById('image-preview');
  const imageWrapper = document.getElementById('image-wrapper');
  
  const previewWatermarkOverlay = document.getElementById('preview-watermark-overlay');
  const previewPhoneOverlay = document.getElementById('preview-phone-overlay');
  const watermarkTextSpan = document.getElementById('watermark-text-span');
  
  // UI Controls
  const resetBtn = document.getElementById('reset-btn');
  const downloadBtn = document.getElementById('download-btn');
  const downloadAllBtn = document.getElementById('download-all-btn');
  const exportFormat = document.getElementById('export-format');

  const brandReplaceWatermark = document.getElementById('brand-replace-watermark');
  const watermarkOptions = document.getElementById('watermark-options');
  const watermarkText = document.getElementById('watermark-text');
  const watermarkX = document.getElementById('watermark-x');
  const watermarkY = document.getElementById('watermark-y');
  const watermarkSize = document.getElementById('watermark-size');

  const brandEmbedPhone = document.getElementById('brand-embed-phone');
  const phoneOptions = document.getElementById('phone-options');
  const phoneText = document.getElementById('phone-text');
  const phoneSize = document.getElementById('phone-size');
  const phoneOpacity = document.getElementById('phone-opacity');

  // Sliders value displays
  const valWatermarkX = document.getElementById('val-watermark-x');
  const valWatermarkY = document.getElementById('val-watermark-y');
  const valWatermarkSize = document.getElementById('val-watermark-size');
  const valPhoneSize = document.getElementById('val-phone-size');
  const valPhoneOpacity = document.getElementById('val-phone-opacity');

  const exportCanvas = document.getElementById('export-canvas');
  const toast = document.getElementById('toast');

  // ==================== FILE IMPORT ====================

  uploadArea.addEventListener('click', () => fileInput.click());

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--accent-gold)';
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = 'var(--border-medium)';
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--border-medium)';
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  });

  function handleFiles(files) {
    const promises = Array.from(files).map(file => {
      return new Promise((resolve) => {
        if (!file.type.startsWith('image/')) {
          resolve(null);
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            resolve({
              file: file,
              name: file.name,
              src: event.target.result,
              originalImg: img,
              width: img.naturalWidth,
              height: img.naturalHeight,
              adjustments: { ...defaultAdjustments },
              edited: true
            });
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(loadedImages => {
      const validImages = loadedImages.filter(img => img !== null);
      if (validImages.length > 0) {
        state.images = [...state.images, ...validImages];
        showToast(`Imported ${validImages.length} image(s) successfully`, 'success');
        
        resetBtn.disabled = false;
        downloadBtn.disabled = false;
        
        if (state.currentIndex === -1) {
          state.currentIndex = 0;
        }
        setupWorkspace();
      } else {
        showToast('No valid images selected', 'error');
      }
    });
  }

  // ==================== WORKSPACE SETUP ====================

  function setupWorkspace() {
    previewPlaceholder.classList.add('hidden');
    previewContainer.classList.remove('hidden');

    if (state.images.length > 1) {
      batchStrip.classList.remove('hidden');
      downloadAllBtn.classList.remove('hidden');
      updateBatchStrip();
    } else {
      batchStrip.classList.add('hidden');
      downloadAllBtn.classList.add('hidden');
    }

    selectImage(state.currentIndex);
  }

  function updateBatchStrip() {
    batchThumbnails.innerHTML = '';
    batchCount.textContent = state.images.length;
    
    state.images.forEach((img, idx) => {
      const thumb = document.createElement('div');
      thumb.className = `batch-thumb ${idx === state.currentIndex ? 'active' : ''}`;
      thumb.innerHTML = `
        <img src="${img.src}" alt="${img.name}">
        <div class="thumb-check">✓</div>
      `;
      thumb.addEventListener('click', () => {
        selectImage(idx);
      });
      batchThumbnails.appendChild(thumb);
    });
  }

  function selectImage(index) {
    if (index < 0 || index >= state.images.length) return;
    state.currentIndex = index;
    
    const imgObj = state.images[index];
    imagePreview.src = imgObj.src;

    // Update UI controls to match current adjustments
    updateControlsUI(imgObj.adjustments);
    applyAdjustments();

    // Update active thumbnail
    document.querySelectorAll('.batch-thumb').forEach((thumb, idx) => {
      thumb.classList.toggle('active', idx === index);
    });
  }

  // ==================== ADJUSTMENTS & UI SYNC ====================

  function updateControlsUI(adj) {
    brandReplaceWatermark.checked = adj.replaceWatermark;
    watermarkOptions.classList.toggle('hidden', !adj.replaceWatermark);
    watermarkText.value = adj.watermarkText;
    watermarkX.value = adj.watermarkX;
    watermarkY.value = adj.watermarkY;
    watermarkSize.value = adj.watermarkSize;

    brandEmbedPhone.checked = adj.embedPhone;
    phoneOptions.classList.toggle('hidden', !adj.embedPhone);
    phoneText.value = adj.phoneText;
    phoneSize.value = adj.phoneSize;
    phoneOpacity.value = adj.phoneOpacity;

    // Update slider label numbers
    valWatermarkX.textContent = `${adj.watermarkX}%`;
    valWatermarkY.textContent = `${adj.watermarkY}%`;
    valWatermarkSize.textContent = `${adj.watermarkSize}%`;
    valPhoneSize.textContent = `${adj.phoneSize}px`;
    valPhoneOpacity.textContent = `${adj.phoneOpacity}%`;
  }

  function applyAdjustments() {
    if (state.currentIndex === -1) return;
    const imgObj = state.images[state.currentIndex];
    const adj = imgObj.adjustments;

    // 1. Resize preview wrapper to match actual displayed image width/height
    const baseWidth = imagePreview.clientWidth;
    const baseHeight = imagePreview.clientHeight;
    
    if (baseWidth && baseHeight) {
      // Calculate 60px bottom extension scaled to screen size (base 1024 height)
      const extensionHeight = adj.embedPhone ? Math.round(60 * (baseHeight / 1024)) : 0;
      
      imageWrapper.style.width = `${baseWidth}px`;
      imageWrapper.style.height = `${baseHeight + extensionHeight}px`;

      if (adj.embedPhone) {
        imageWrapper.style.paddingBottom = `${extensionHeight}px`;
        imageWrapper.style.background = '#090909'; // Charcoal footer
      } else {
        imageWrapper.style.paddingBottom = '0px';
        imageWrapper.style.background = 'transparent';
      }

      // 2. Position Watermark Overlay
      if (adj.replaceWatermark) {
        previewWatermarkOverlay.classList.remove('hidden');
        previewWatermarkOverlay.style.left = `${adj.watermarkX}%`;
        previewWatermarkOverlay.style.top = `${adj.watermarkY}%`;
        
        // Render spaced out characters
        watermarkTextSpan.textContent = adj.watermarkText.split('').join('  ');
        
        // Scale text size based on cover width slider
        const wmWidth = (adj.watermarkSize / 100) * baseWidth * 0.25;
        previewWatermarkOverlay.style.fontSize = `${Math.max(8, wmWidth * 0.12)}px`;
        previewWatermarkOverlay.style.color = '#e8c9a0'; // Premium Warm Gold
      } else {
        previewWatermarkOverlay.classList.add('hidden');
      }

      // 3. Position Phone Overlay
      if (adj.embedPhone) {
        previewPhoneOverlay.classList.remove('hidden');
        previewPhoneOverlay.textContent = adj.phoneText;
        previewPhoneOverlay.style.fontSize = `${adj.phoneSize}px`;
        previewPhoneOverlay.style.opacity = adj.phoneOpacity / 100;
        
        // Center vertically inside the bottom extension area
        previewPhoneOverlay.style.bottom = `${Math.round(20 * (baseHeight / 1024))}px`;
      } else {
        previewPhoneOverlay.classList.add('hidden');
      }
    }
  }

  // Recalculate wrappers on load
  imagePreview.addEventListener('load', () => {
    setTimeout(applyAdjustments, 50);
  });
  window.addEventListener('resize', applyAdjustments);

  // ==================== DRAG & DROP INTERACTION ====================

  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;

  previewWatermarkOverlay.addEventListener('mousedown', startDrag);
  previewWatermarkOverlay.addEventListener('touchstart', startDrag, { passive: false });

  function startDrag(e) {
    if (state.currentIndex === -1) return;
    isDragging = true;
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    dragStartX = clientX;
    dragStartY = clientY;
    
    document.addEventListener('mousemove', dragMove);
    document.addEventListener('touchmove', dragMove, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
    
    e.preventDefault();
  }

  function dragMove(e) {
    if (!isDragging) return;
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    const wrapperRect = imageWrapper.getBoundingClientRect();
    
    // Calculate mouse position relative to wrapper bounds
    const x = clientX - wrapperRect.left;
    const y = clientY - wrapperRect.top;
    
    // Convert to percentage
    let pctX = Math.round((x / wrapperRect.width) * 100);
    let pctY = Math.round((y / wrapperRect.height) * 100);
    
    // Clamp percentages 0-100
    pctX = Math.max(0, Math.min(100, pctX));
    pctY = Math.max(0, Math.min(100, pctY));
    
    const adj = state.images[state.currentIndex].adjustments;
    adj.watermarkX = pctX;
    adj.watermarkY = pctY;
    
    // Sync slider positions
    watermarkX.value = pctX;
    watermarkY.value = pctY;
    valWatermarkX.textContent = `${pctX}%`;
    valWatermarkY.textContent = `${pctY}%`;
    
    applyAdjustments();
    e.preventDefault();
  }

  function endDrag() {
    isDragging = false;
    document.removeEventListener('mousemove', dragMove);
    document.removeEventListener('touchmove', dragMove);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchend', endDrag);
  }

  // ==================== CONTROLS LISTENERS ====================

  function bindInput(element, property, valDisplay, prefix = '', suffix = '') {
    element.addEventListener('input', (e) => {
      if (state.currentIndex === -1) return;
      
      let val = e.target.value;
      if (element.type === 'range') val = parseInt(val);
      
      state.images[state.currentIndex].adjustments[property] = val;
      if (valDisplay) valDisplay.textContent = `${prefix}${val}${suffix}`;
      
      applyAdjustments();
    });
  }

  brandReplaceWatermark.addEventListener('change', (e) => {
    if (state.currentIndex === -1) return;
    state.images[state.currentIndex].adjustments.replaceWatermark = e.target.checked;
    watermarkOptions.classList.toggle('hidden', !e.target.checked);
    applyAdjustments();
  });

  brandEmbedPhone.addEventListener('change', (e) => {
    if (state.currentIndex === -1) return;
    state.images[state.currentIndex].adjustments.embedPhone = e.target.checked;
    phoneOptions.classList.toggle('hidden', !e.target.checked);
    applyAdjustments();
  });

  bindInput(watermarkText, 'watermarkText');
  bindInput(watermarkX, 'watermarkX', valWatermarkX, '', '%');
  bindInput(watermarkY, 'watermarkY', valWatermarkY, '', '%');
  bindInput(watermarkSize, 'watermarkSize', valWatermarkSize, '', '%');

  bindInput(phoneText, 'phoneText');
  bindInput(phoneSize, 'phoneSize', valPhoneSize, '', 'px');
  bindInput(phoneOpacity, 'phoneOpacity', valPhoneOpacity, '', '%');

  // Reset Adjustments
  resetBtn.addEventListener('click', () => {
    if (state.currentIndex === -1) return;
    state.images[state.currentIndex].adjustments = { ...defaultAdjustments };
    updateControlsUI(defaultAdjustments);
    applyAdjustments();
    showToast('Reset modifications to default', 'success');
  });

  // ==================== IMAGE RENDERING & EXPORT ====================

  function renderImage(imgObj) {
    return new Promise((resolve) => {
      const canvas = exportCanvas;
      const ctx = canvas.getContext('2d');
      const img = imgObj.originalImg;
      const adj = imgObj.adjustments;

      const baseWidth = imgObj.width;
      const baseHeight = imgObj.height;
      
      // Calculate 60px bottom extension scaled to high resolution (base height 1024)
      const extensionHeight = adj.embedPhone ? Math.round(60 * (baseHeight / 1024)) : 0;
      
      canvas.width = baseWidth;
      canvas.height = baseHeight + extensionHeight;

      // Draw original image
      ctx.drawImage(img, 0, 0, baseWidth, baseHeight);

      // 1. Cover watermarks if active
      if (adj.replaceWatermark) {
        // Clear old watermark area at top-left row-by-row matching local gradient
        const watermarkRight = Math.round((240 / 712) * baseWidth);
        const watermarkBottom = Math.round((85 / 1024) * baseHeight);
        const sampleX = Math.round((245 / 712) * baseWidth);

        for (let y = 0; y < watermarkBottom; y++) {
          try {
            const pixel = ctx.getImageData(sampleX, y, 1, 1).data;
            ctx.fillStyle = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
            ctx.fillRect(0, y, watermarkRight, 1);
          } catch(e) {
            // fallback solid beige
            ctx.fillStyle = 'rgb(217, 207, 198)';
            ctx.fillRect(0, y, watermarkRight, 1);
          }
        }

        // Draw new brand text "RS PLY DECOR"
        const x = (adj.watermarkX / 100) * baseWidth;
        const y = (adj.watermarkY / 100) * baseHeight;
        const wmWidth = (adj.watermarkSize / 100) * baseWidth * 0.25;

        // Auto-detect luma of background area to contrast text color
        let textFill = '#181818'; // default charcoal
        try {
          const samplePixel = ctx.getImageData(sampleX, Math.round(watermarkBottom / 2), 1, 1).data;
          const luma = (0.299 * samplePixel[0] + 0.587 * samplePixel[1] + 0.114 * samplePixel[2]) / 255.0;
          if (luma <= 0.6) {
            textFill = '#d4af37'; // gold text for dark walls
          }
        } catch(e) {}

        ctx.save();
        ctx.fillStyle = textFill;
        const fontSize = Math.max(12, Math.round(wmWidth * 0.12));
        ctx.font = `bold ${fontSize}px "Plus Jakarta Sans", sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        const spacedText = adj.watermarkText.split('').join('  ');
        ctx.fillText(spacedText, x, y);
        ctx.restore();
      }

      // 2. Embed bottom phone bar
      if (adj.embedPhone) {
        ctx.save();
        
        // Fill footer canvas extension background (charcoal/black)
        ctx.fillStyle = '#090909';
        ctx.fillRect(0, baseHeight, baseWidth, extensionHeight);

        // Draw center contact pill
        ctx.globalAlpha = adj.phoneOpacity / 100;
        const phoneFontSize = Math.max(12, Math.round(adj.phoneSize * (baseHeight / 1024)));
        const phoneTxtVal = adj.phoneText;
        
        ctx.font = `600 ${phoneFontSize}px "Plus Jakarta Sans", sans-serif`;
        
        const textWidth = ctx.measureText(phoneTxtVal).width;
        const barHeight = phoneFontSize * 1.6;
        const barY = baseHeight + (extensionHeight - barHeight) / 2;
        const boxWidth = textWidth + phoneFontSize * 1.5;
        const boxX = baseWidth / 2 - boxWidth / 2;
        const radius = phoneFontSize * 0.4;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(boxX, barY, boxWidth, barHeight, radius);
        } else {
          ctx.arc(boxX + radius, barY + radius, radius, Math.PI, 1.5 * Math.PI);
          ctx.lineTo(boxX + boxWidth - radius, barY);
          ctx.arc(boxX + boxWidth - radius, barY + radius, radius, 1.5 * Math.PI, 2 * Math.PI);
          ctx.lineTo(boxX + boxWidth, barY + barHeight - radius);
          ctx.arc(boxX + boxWidth - radius, barY + barHeight - radius, radius, 0, 0.5 * Math.PI);
          ctx.lineTo(boxX + radius, barY + barHeight);
          ctx.arc(boxX + radius, barY + barHeight - radius, radius, 0.5 * Math.PI, Math.PI);
          ctx.closePath();
        }
        ctx.fill();
        ctx.stroke();
        
        // Draw White text
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(phoneTxtVal, baseWidth / 2, barY + barHeight / 2);
        ctx.restore();
      }

      resolve(canvas);
    });
  }

  // Download Action
  downloadBtn.addEventListener('click', () => {
    if (state.currentIndex === -1) return;
    const imgObj = state.images[state.currentIndex];
    
    renderImage(imgObj).then(canvas => {
      const format = exportFormat.value;
      const mime = `image/${format === 'jpeg' ? 'jpeg' : format === 'webp' ? 'webp' : 'png'}`;
      const ext = format === 'jpeg' ? 'jpg' : format === 'webp' ? 'webp' : 'png';
      
      const link = document.createElement('a');
      link.download = imgObj.name.substring(0, imgObj.name.lastIndexOf('.')) + `_branded.${ext}`;
      link.href = canvas.toDataURL(mime, 0.95);
      link.click();
      showToast('Exported branded image successfully', 'success');
    });
  });

  // Export All Action (triggers browser batch download)
  downloadAllBtn.addEventListener('click', () => {
    if (state.images.length === 0) return;
    
    let delay = 0;
    state.images.forEach((imgObj, idx) => {
      setTimeout(() => {
        renderImage(imgObj).then(canvas => {
          const format = exportFormat.value;
          const mime = `image/${format === 'jpeg' ? 'jpeg' : format === 'webp' ? 'webp' : 'png'}`;
          const ext = format === 'jpeg' ? 'jpg' : format === 'webp' ? 'webp' : 'png';
          
          const link = document.createElement('a');
          link.download = imgObj.name.substring(0, imgObj.name.lastIndexOf('.')) + `_branded.${ext}`;
          link.href = canvas.toDataURL(mime, 0.95);
          link.click();
          
          if (idx === state.images.length - 1) {
            showToast(`Exported all ${state.images.length} images successfully`, 'success');
          }
        });
      }, delay);
      delay += 350; // Delay to prevent browser thread blocking
    });
  });

  // ==================== TOAST NOTIFICATION ====================

  function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast visible ${type}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => {
        toast.classList.add('hidden');
      }, 300);
    }, 3000);
  }
});
