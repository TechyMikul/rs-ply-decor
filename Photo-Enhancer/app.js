/**
 * RS PLY DECOR — Photo Enhancer Studio
 * Core Application Logic (app.js)
 */

document.addEventListener('DOMContentLoaded', () => {
  // State Management
  const state = {
    images: [], // List of { file, name, src, originalImg, width, height, adjustments, transform, activePreset }
    currentIndex: -1,
    clipboardSettings: null,
    history: [], // History stack of states for undo/redo
    historyIndex: -1,
    isComparing: false,
    lockAspectRatio: true,
  };

  // Default adjustment and transform values
  const defaultAdjustments = {
    exposure: 0,
    brightness: 0,
    contrast: 0,
    highlights: 0,
    shadows: 0,
    saturation: 0,
    vibrance: 0,
    warmth: 0,
    tint: 0,
    sharpness: 0,
    clarity: 0,
    vignette: 0,
    grain: 0,
    fade: 0,
    filterIntensity: 100,
  };

  const defaultTransform = {
    rotate: 0, // 0, 90, 180, 270
    flipH: false,
    flipV: false,
    width: null,
    height: null,
    aspectRatio: 1,
  };

  // Presets definition
  const presets = {
    'none': { ...defaultAdjustments },
    'auto-enhance': {
      ...defaultAdjustments,
      exposure: 5,
      contrast: 15,
      highlights: -10,
      shadows: 10,
      saturation: 8,
      vibrance: 12,
      clarity: 10,
      sharpness: 20
    },
    'product-shot': {
      ...defaultAdjustments,
      exposure: 12,
      brightness: 5,
      contrast: 22,
      highlights: -15,
      shadows: 8,
      saturation: 5,
      clarity: 15,
      sharpness: 35
    },
    'jewelry-gold': {
      ...defaultAdjustments,
      exposure: 6,
      contrast: 18,
      highlights: -5,
      shadows: 12,
      saturation: 15,
      warmth: 20,
      vibrance: 10,
      sharpness: 40,
      clarity: 12
    },
    'bright-clean': {
      ...defaultAdjustments,
      exposure: 18,
      brightness: 10,
      contrast: 12,
      highlights: -20,
      shadows: 25,
      warmth: -8,
      saturation: -5,
      sharpness: 15,
      clarity: 8
    },
    // Filter Tab Presets
    'warm-sunset': {
      ...defaultAdjustments,
      warmth: 35,
      tint: 5,
      contrast: 10,
      saturation: 15,
      fade: 10
    },
    'cool-nordic': {
      ...defaultAdjustments,
      warmth: -30,
      tint: -5,
      exposure: 5,
      contrast: 8,
      saturation: -10,
      shadows: 15
    },
    'chrome-pop': {
      ...defaultAdjustments,
      contrast: 25,
      saturation: 25,
      exposure: 5,
      sharpness: 30
    },
    'vintage-matte': {
      ...defaultAdjustments,
      contrast: -10,
      fade: 25,
      warmth: 15,
      saturation: -15,
      vignette: 20,
      grain: 15
    },
    'noir-bw': {
      ...defaultAdjustments,
      contrast: 35,
      saturation: -100,
      vignette: 25,
      highlights: -20,
      shadows: 10,
      sharpness: 20
    },
    'golden-hour': {
      ...defaultAdjustments,
      exposure: 10,
      contrast: 15,
      warmth: 40,
      tint: 10,
      vibrance: 20,
      vignette: 15
    }
  };

  // DOM Elements
  const app = document.getElementById('app');
  const uploadScreen = document.getElementById('upload-screen');
  const editorScreen = document.getElementById('editor-screen');
  const uploadArea = document.getElementById('upload-area');
  const fileInput = document.getElementById('file-input');
  const batchList = document.getElementById('batch-list');
  const backBtn = document.getElementById('back-btn');
  
  const imagePreview = document.getElementById('image-preview');
  const vignetteOverlay = document.getElementById('vignette-overlay');
  const grainOverlay = document.getElementById('grain-overlay');
  const compareLabel = document.getElementById('compare-label');
  
  const currentFilename = document.getElementById('current-filename');
  const batchStrip = document.getElementById('batch-strip');
  const batchThumbnails = document.getElementById('batch-thumbnails');
  
  const undoBtn = document.getElementById('undo-btn');
  const redoBtn = document.getElementById('redo-btn');
  const compareBtn = document.getElementById('compare-btn');
  const resetBtn = document.getElementById('reset-btn');
  const copySettingsBtn = document.getElementById('copy-settings-btn');
  const pasteSettingsBtn = document.getElementById('paste-settings-btn');
  
  const exportFormat = document.getElementById('export-format');
  const exportQuality = document.getElementById('export-quality');
  const downloadBtn = document.getElementById('download-btn');
  const downloadAllBtn = document.getElementById('download-all-btn');
  
  const filterGrid = document.getElementById('filter-grid');
  const exportCanvas = document.getElementById('export-canvas');
  const toast = document.getElementById('toast');

  const resizeWidth = document.getElementById('resize-width');
  const resizeHeight = document.getElementById('resize-height');
  const lockAspectCheckbox = document.getElementById('lock-aspect');

  // ==================== INITIALIZATION ====================

  // Generate Filter Preset Grid Items
  function initFilterGrid() {
    filterGrid.innerHTML = '';
    const filtersList = [
      { id: 'none', name: 'Original' },
      { id: 'warm-sunset', name: 'Warm Sunset' },
      { id: 'cool-nordic', name: 'Cool Nordic' },
      { id: 'chrome-pop', name: 'Chrome Pop' },
      { id: 'vintage-matte', name: 'Vintage Matte' },
      { id: 'noir-bw', name: 'Noir B&W' },
      { id: 'golden-hour', name: 'Golden Hour' }
    ];

    filtersList.forEach(filter => {
      const card = document.createElement('div');
      card.className = `filter-card ${filter.id === 'none' ? 'active' : ''}`;
      card.dataset.preset = filter.id;
      
      // We will fill a miniature canvas representation or just a stylized label
      card.innerHTML = `
        <div class="filter-name">${filter.name}</div>
      `;
      
      card.addEventListener('click', () => {
        document.querySelectorAll('.filter-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        applyPreset(filter.id);
      });
      
      filterGrid.appendChild(card);
    });
  }

  initFilterGrid();

  // Tab Switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      const tabName = btn.dataset.tab;
      document.querySelector(`.tab-content[data-tab="${tabName}"]`).classList.add('active');
    });
  });

  // Collapsible Sections
  document.querySelectorAll('.section-header.collapsible').forEach(header => {
    header.addEventListener('click', () => {
      const sectionName = header.dataset.section;
      const body = document.querySelector(`.section-body[data-section="${sectionName}"]`);
      header.classList.toggle('open');
      body.classList.toggle('open');
    });
  });

  // ==================== FILE HANDLING ====================

  uploadArea.addEventListener('click', () => fileInput.click());

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
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
              transform: { ...defaultTransform, aspectRatio: img.naturalWidth / img.naturalHeight },
              activePreset: 'none',
              edited: false
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
        
        // Setup editor
        if (state.currentIndex === -1) {
          state.currentIndex = 0;
        }
        setupEditor();
      } else {
        showToast('No valid images selected', 'error');
      }
    });
  }

  // ==================== EDITOR SETUP ====================

  function setupEditor() {
    uploadScreen.classList.add('hidden');
    editorScreen.classList.remove('hidden');

    // Update batch strip visibility
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
    state.images.forEach((img, idx) => {
      const thumb = document.createElement('div');
      thumb.className = `batch-thumb ${idx === state.currentIndex ? 'active' : ''} ${img.edited ? 'edited' : ''}`;
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
    
    const image = state.images[index];
    currentFilename.textContent = image.name;

    // Set preview source
    imagePreview.src = image.src;

    // Reset history for this session, or push first state
    state.history = [{
      adjustments: JSON.parse(JSON.stringify(image.adjustments)),
      transform: JSON.parse(JSON.stringify(image.transform)),
      preset: image.activePreset
    }];
    state.historyIndex = 0;

    // Update controls to match current image parameters
    updateSlidersUI(image.adjustments);
    updateTransformUI(image.transform);
    updateFilterPresetUI(image.activePreset);

    // Apply adjustments
    applyAdjustments();
    updateUndoRedoButtons();
    
    // Update batch highlights
    document.querySelectorAll('.batch-thumb').forEach((thumb, idx) => {
      thumb.classList.toggle('active', idx === index);
    });
  }

  // ==================== ADJUSTMENTS & SLIDERS ====================

  // Setup range input change listeners
  document.querySelectorAll('.adj-slider').forEach(slider => {
    const parentControl = slider.closest('.slider-control');
    const adjustmentType = parentControl ? parentControl.dataset.adjustment : null;
    const valueDisplay = parentControl ? parentControl.querySelector('.slider-value') : null;

    slider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (valueDisplay) valueDisplay.textContent = val > 0 ? `+${val}` : val;
      
      if (adjustmentType && state.currentIndex !== -1) {
        state.images[state.currentIndex].adjustments[adjustmentType] = val;
        
        // Highlight modified sliders
        if (val !== 0 && (adjustmentType !== 'filterIntensity' || val !== 100)) {
          parentControl.classList.add('modified');
        } else {
          parentControl.classList.remove('modified');
        }

        applyAdjustments();
      }
    });

    slider.addEventListener('change', () => {
      // Save history state on release
      saveHistoryState();
    });
  });

  // Setup auto-enhance preset buttons
  document.querySelectorAll('.auto-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const presetType = btn.dataset.auto;
      
      // Toggle preset
      const currentImg = state.images[state.currentIndex];
      if (currentImg.activePreset === presetType) {
        applyPreset('none');
      } else {
        applyPreset(presetType);
      }
      saveHistoryState();
    });
  });

  function applyPreset(presetId) {
    if (state.currentIndex === -1) return;
    const image = state.images[state.currentIndex];
    
    // Apply defined adjustments
    const basePreset = presets[presetId] || defaultAdjustments;
    image.adjustments = JSON.parse(JSON.stringify(basePreset));
    image.activePreset = presetId;
    image.edited = presetId !== 'none';

    // Update UI elements
    updateSlidersUI(image.adjustments);
    updateFilterPresetUI(presetId);
    
    // Refresh batch thumbnail strip indicators
    if (state.images.length > 1) {
      updateBatchStrip();
    }

    applyAdjustments();
  }

  function updateSlidersUI(adjustments) {
    document.querySelectorAll('.slider-control').forEach(control => {
      const adj = control.dataset.adjustment;
      const slider = control.querySelector('.adj-slider');
      const valDisplay = control.querySelector('.slider-value');
      
      if (adj && adjustments[adj] !== undefined) {
        const val = adjustments[adj];
        slider.value = val;
        valDisplay.textContent = val > 0 ? `+${val}` : val;

        if (val !== 0 && (adj !== 'filterIntensity' || val !== 100)) {
          control.classList.add('modified');
        } else {
          control.classList.remove('modified');
        }
      }
    });
  }

  function updateFilterPresetUI(presetId) {
    // Top-level preset buttons
    document.querySelectorAll('.auto-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.auto === presetId);
    });

    // Sidebar filter tab cards
    document.querySelectorAll('.filter-card').forEach(card => {
      card.classList.toggle('active', card.dataset.preset === presetId);
    });
  }

  // ==================== RENDERING PREVIEW (CSS FILTERS) ====================

  function applyAdjustments() {
    if (state.currentIndex === -1 || state.isComparing) {
      imagePreview.style.filter = 'none';
      vignetteOverlay.style.boxShadow = 'none';
      grainOverlay.style.opacity = '0';
      return;
    }

    const img = state.images[state.currentIndex];
    const adj = img.adjustments;
    const trans = img.transform;

    // Constructing CSS Filter string
    let filters = [];

    // 1. Exposure & Brightness
    // Exposure maps to a combination of brightness and contrast amplification
    const totalBrightness = 100 + adj.brightness + (adj.exposure * 0.8);
    filters.push(`brightness(${totalBrightness}%)`);

    // 2. Contrast
    const totalContrast = 100 + adj.contrast;
    filters.push(`contrast(${totalContrast}%)`);

    // 3. Saturation & Vibrance (approximate vibrance with saturation)
    const totalSaturation = 100 + adj.saturation + (adj.vibrance * 0.6);
    filters.push(`saturate(${totalSaturation}%)`);

    // 4. Warmth & Tint
    // Warmth: shift towards sepia/yellow, Coolness: shift towards blue
    if (adj.warmth > 0) {
      filters.push(`sepia(${adj.warmth * 0.4}%)`);
    } else if (adj.warmth < 0) {
      // Approximating cool tint by rotating hue towards blue and dropping warmth
      filters.push(`hue-rotate(${adj.warmth * 0.15}deg) saturate(${100 + adj.warmth * 0.2}%)`);
    }

    if (adj.tint !== 0) {
      filters.push(`hue-rotate(${adj.tint * 0.3}deg)`);
    }

    // 5. Fade (washout colors & lift blacks)
    if (adj.fade > 0) {
      // Approximate fade with opacity or specialized blends
      filters.push(`opacity(${100 - adj.fade * 0.15}%)`);
    }

    // Apply built-in preset color shifts if custom preset is selected
    if (img.activePreset && img.activePreset !== 'none' && !presets[img.activePreset]) {
      // If it's a specific filter card preset, apply its base
      const intensity = adj.filterIntensity / 100;
      // We mix preset values dynamically
    }

    imagePreview.style.filter = filters.join(' ');

    // 6. Vignette overlay
    if (adj.vignette > 0) {
      vignetteOverlay.style.boxShadow = `inset 0 0 ${adj.vignette * 1.5}px rgba(0,0,0,${adj.vignette * 0.008})`;
    } else {
      vignetteOverlay.style.boxShadow = 'none';
    }

    // 7. Grain overlay
    if (adj.grain > 0) {
      grainOverlay.style.opacity = `${adj.grain * 0.006}`;
      // Generate a dynamic canvas grain if needed, but a simple noise CSS layer works great too
      grainOverlay.style.backgroundImage = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;
    } else {
      grainOverlay.style.opacity = '0';
    }

    // 8. Apply Transform preview
    let transformStr = [];
    if (trans.rotate !== 0) {
      transformStr.push(`rotate(${trans.rotate}deg)`);
    }
    if (trans.flipH) {
      transformStr.push('scaleX(-1)');
    }
    if (trans.flipV) {
      transformStr.push('scaleY(-1)');
    }
    imagePreview.style.transform = transformStr.join(' ');
  }

  // ==================== TRANSFORMS (ROTATE/FLIP/RESIZE) ====================

  document.querySelectorAll('.transform-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.currentIndex === -1) return;
      const trans = state.images[state.currentIndex].transform;
      const type = btn.dataset.transform;

      if (type === 'rotate-left') {
        trans.rotate = (trans.rotate - 90 + 360) % 360;
      } else if (type === 'rotate-right') {
        trans.rotate = (trans.rotate + 90) % 360;
      } else if (type === 'flip-h') {
        trans.flipH = !trans.flipH;
      } else if (type === 'flip-v') {
        trans.flipV = !trans.flipV;
      }

      state.images[state.currentIndex].edited = true;
      if (state.images.length > 1) updateBatchStrip();

      applyAdjustments();
      saveHistoryState();
    });
  });

  // Handle Resize inputs
  resizeWidth.addEventListener('input', (e) => {
    if (state.currentIndex === -1) return;
    const trans = state.images[state.currentIndex].transform;
    const val = parseInt(e.target.value);
    
    if (val > 0) {
      trans.width = val;
      if (state.lockAspectRatio) {
        trans.height = Math.round(val / trans.aspectRatio);
        resizeHeight.value = trans.height;
      }
    } else {
      trans.width = null;
    }
  });

  resizeHeight.addEventListener('input', (e) => {
    if (state.currentIndex === -1) return;
    const trans = state.images[state.currentIndex].transform;
    const val = parseInt(e.target.value);
    
    if (val > 0) {
      trans.height = val;
      if (state.lockAspectRatio) {
        trans.width = Math.round(val * trans.aspectRatio);
        resizeWidth.value = trans.width;
      }
    } else {
      trans.height = null;
    }
  });

  lockAspectCheckbox.addEventListener('change', (e) => {
    state.lockAspectRatio = e.target.checked;
  });

  function updateTransformUI(transform) {
    if (transform.width) {
      resizeWidth.value = transform.width;
    } else {
      resizeWidth.value = '';
      resizeWidth.placeholder = state.images[state.currentIndex].width;
    }

    if (transform.height) {
      resizeHeight.value = transform.height;
    } else {
      resizeHeight.value = '';
      resizeHeight.placeholder = state.images[state.currentIndex].height;
    }
  }

  // ==================== COMPARE FEATURE ====================

  function startCompare() {
    state.isComparing = true;
    compareLabel.classList.remove('hidden');
    
    // Temporarily reset preview filters & transformations
    imagePreview.style.filter = 'none';
    imagePreview.style.transform = 'none';
    vignetteOverlay.style.boxShadow = 'none';
    grainOverlay.style.opacity = '0';
  }

  function stopCompare() {
    state.isComparing = false;
    compareLabel.classList.add('hidden');
    applyAdjustments();
  }

  compareBtn.addEventListener('mousedown', startCompare);
  compareBtn.addEventListener('mouseup', stopCompare);
  compareBtn.addEventListener('mouseleave', stopCompare);

  compareBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startCompare();
  });
  compareBtn.addEventListener('touchend', stopCompare);

  // Keyboard shortcut for compare (Spacebar)
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target === document.body && state.currentIndex !== -1 && !state.isComparing) {
      e.preventDefault();
      startCompare();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' && state.isComparing) {
      stopCompare();
    }
  });

  // ==================== HISTORY (UNDO/REDO) ====================

  function saveHistoryState() {
    if (state.currentIndex === -1) return;
    const currentImg = state.images[state.currentIndex];
    
    // Truncate future states if we were in the middle of undo stack
    state.history = state.history.slice(0, state.historyIndex + 1);
    
    // Append new state copy
    state.history.push({
      adjustments: JSON.parse(JSON.stringify(currentImg.adjustments)),
      transform: JSON.parse(JSON.stringify(currentImg.transform)),
      preset: currentImg.activePreset
    });
    
    state.historyIndex++;
    currentImg.edited = true;
    if (state.images.length > 1) updateBatchStrip();

    updateUndoRedoButtons();
  }

  function updateUndoRedoButtons() {
    undoBtn.disabled = state.historyIndex <= 0;
    redoBtn.disabled = state.historyIndex >= state.history.length - 1;
  }

  undoBtn.addEventListener('click', () => {
    if (state.historyIndex > 0) {
      state.historyIndex--;
      applyHistoryState(state.history[state.historyIndex]);
    }
  });

  redoBtn.addEventListener('click', () => {
    if (state.historyIndex < state.history.length - 1) {
      state.historyIndex++;
      applyHistoryState(state.history[state.historyIndex]);
    }
  });

  function applyHistoryState(historyItem) {
    const currentImg = state.images[state.currentIndex];
    currentImg.adjustments = JSON.parse(JSON.stringify(historyItem.adjustments));
    currentImg.transform = JSON.parse(JSON.stringify(historyItem.transform));
    currentImg.activePreset = historyItem.preset;

    updateSlidersUI(currentImg.adjustments);
    updateTransformUI(currentImg.transform);
    updateFilterPresetUI(currentImg.activePreset);
    applyAdjustments();
    updateUndoRedoButtons();
  }

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y)
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      undoBtn.click();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      redoBtn.click();
    }
  });

  // ==================== RESET ====================

  resetBtn.addEventListener('click', () => {
    if (state.currentIndex === -1) return;
    
    const currentImg = state.images[state.currentIndex];
    currentImg.adjustments = { ...defaultAdjustments };
    currentImg.transform = { ...defaultTransform, aspectRatio: currentImg.width / currentImg.height };
    currentImg.activePreset = 'none';
    currentImg.edited = false;

    updateSlidersUI(currentImg.adjustments);
    updateTransformUI(currentImg.transform);
    updateFilterPresetUI('none');
    
    if (state.images.length > 1) updateBatchStrip();
    applyAdjustments();
    saveHistoryState();
    showToast('Reset all adjustments', 'success');
  });

  // ==================== COPY & PASTE SETTINGS ====================

  copySettingsBtn.addEventListener('click', () => {
    if (state.currentIndex === -1) return;
    const currentImg = state.images[state.currentIndex];
    
    state.clipboardSettings = {
      adjustments: JSON.parse(JSON.stringify(currentImg.adjustments)),
      preset: currentImg.activePreset
    };

    showToast('Copied adjustments to clipboard', 'success');
  });

  pasteSettingsBtn.addEventListener('click', () => {
    if (state.currentIndex === -1 || !state.clipboardSettings) {
      if (!state.clipboardSettings) showToast('No adjustments copied yet', 'error');
      return;
    }

    const currentImg = state.images[state.currentIndex];
    currentImg.adjustments = JSON.parse(JSON.stringify(state.clipboardSettings.adjustments));
    currentImg.activePreset = state.clipboardSettings.preset;

    updateSlidersUI(currentImg.adjustments);
    updateFilterPresetUI(currentImg.activePreset);
    applyAdjustments();
    saveHistoryState();
    showToast('Pasted adjustments', 'success');
  });

  // ==================== RENDERING & EXPORTING CANVAS ====================

  // Main Canvas Processor
  function renderToCanvas(imageObj) {
    return new Promise((resolve) => {
      const canvas = exportCanvas;
      const ctx = canvas.getContext('2d');
      const img = imageObj.originalImg;
      const trans = imageObj.transform;
      const adj = imageObj.adjustments;

      // Determine final width/height based on resize or rotation
      let baseWidth = trans.width || imageObj.width;
      let baseHeight = trans.height || imageObj.height;

      // Swap dimensions if rotated 90 or 270 deg
      const isSwapped = trans.rotate === 90 || trans.rotate === 270;
      canvas.width = isSwapped ? baseHeight : baseWidth;
      canvas.height = isSwapped ? baseWidth : baseHeight;

      // Clear Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Save context state for transform
      ctx.save();

      // Move origin to center for rotation/flips
      ctx.translate(canvas.width / 2, canvas.height / 2);

      // Apply Rotations
      if (trans.rotate !== 0) {
        ctx.rotate((trans.rotate * Math.PI) / 180);
      }

      // Apply Flips
      const scaleX = trans.flipH ? -1 : 1;
      const scaleY = trans.flipV ? -1 : 1;
      ctx.scale(scaleX, scaleY);

      // Draw the image scaled to baseWidth/baseHeight
      ctx.drawImage(img, -baseWidth / 2, -baseHeight / 2, baseWidth, baseHeight);

      // Restore transform context
      ctx.restore();

      // Get image data to apply pixel manipulation (brightness, contrast, saturation, exposure, warmth, tint, sharpness, vignette, etc.)
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Pre-calculate coefficients
      const expFactor = adj.exposure * 2.5; // Scale exposure impact
      const briOffset = adj.brightness * 1.5;
      const conFactor = (adj.contrast + 100) / 100;
      
      const satFactor = (adj.saturation + adj.vibrance * 0.6 + 100) / 100;
      
      // Warmth calculations (Kelvin mapping approximation)
      const warmthVal = adj.warmth * 0.5;
      const tintVal = adj.tint * 0.4;

      // Sharpness kernel setup (using convolution later or basic high pass)
      const sharpVal = adj.sharpness;

      // Pixel processing loop
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // 1. Exposure & Brightness
        r += briOffset + expFactor;
        g += briOffset + expFactor;
        b += briOffset + expFactor;

        // 2. Contrast (centered around gray 128)
        r = (r - 128) * conFactor + 128;
        g = (g - 128) * conFactor + 128;
        b = (b - 128) * conFactor + 128;

        // 3. Warmth (Red vs Blue shift)
        if (warmthVal !== 0) {
          r += warmthVal;
          b -= warmthVal;
        }
        if (tintVal !== 0) {
          g += tintVal;
        }

        // 4. Saturation
        if (satFactor !== 1) {
          const luma = 0.299 * r + 0.587 * g + 0.114 * b;
          r = luma + (r - luma) * satFactor;
          g = luma + (g - luma) * satFactor;
          b = luma + (b - luma) * satFactor;
        }

        // 5. Fade (blend with lifted darks / compressed highlights)
        if (adj.fade > 0) {
          const fadeMix = adj.fade / 100;
          r = r * (1 - fadeMix) + (128 * fadeMix);
          g = g * (1 - fadeMix) + (128 * fadeMix);
          b = b * (1 - fadeMix) + (128 * fadeMix);
        }

        // Write back clamped values
        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
      }

      ctx.putImageData(imgData, 0, 0);

      // Apply convolution for Sharpness/Clarity if needed
      if (sharpVal > 0) {
        applySharpness(canvas, ctx, sharpVal);
      }

      // Apply Vignette overlay on canvas
      if (adj.vignette > 0) {
        applyVignetteCanvas(canvas, ctx, adj.vignette);
      }

      // Apply Grain noise on canvas
      if (adj.grain > 0) {
        applyGrainCanvas(canvas, ctx, adj.grain);
      }

      resolve(canvas);
    });
  }

  // Sharpness Convolution Filter (Laplacian Kernel)
  function applySharpness(canvas, ctx, amount) {
    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const output = ctx.createImageData(w, h);
    const weights = [
       0, -1,  0,
      -1,  4, -1,
       0, -1,  0
    ];
    const side = Math.round(Math.sqrt(weights.length));
    const halfSide = Math.floor(side / 2);
    const src = imgData.data;
    const dst = output.data;
    const alphaFac = amount / 100;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const sy = y;
        const sx = x;
        const dstOff = (y * w + x) * 4;
        let r = 0, g = 0, b = 0;
        
        for (let cy = 0; cy < side; cy++) {
          for (let cx = 0; cx < side; cx++) {
            const scy = sy + cy - halfSide;
            const scx = sx + cx - halfSide;
            if (scy >= 0 && scy < h && scx >= 0 && scx < w) {
              const srcOff = (scy * w + scx) * 4;
              const wt = weights[cy * side + cx];
              r += src[srcOff] * wt;
              g += src[srcOff + 1] * wt;
              b += src[srcOff + 2] * wt;
            }
          }
        }

        // Blend sharpened edges with original image
        dst[dstOff] = Math.max(0, Math.min(255, src[dstOff] + r * alphaFac));
        dst[dstOff + 1] = Math.max(0, Math.min(255, src[dstOff + 1] + g * alphaFac));
        dst[dstOff + 2] = Math.max(0, Math.min(255, src[dstOff + 2] + b * alphaFac));
        dst[dstOff + 3] = src[dstOff + 3];
      }
    }
    ctx.putImageData(output, 0, 0);
  }

  // Vignette overlay drawing
  function applyVignetteCanvas(canvas, ctx, amount) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = Math.sqrt(cx * cx + cy * cy);
    
    const grad = ctx.createRadialGradient(cx, cy, radius * 0.4, cx, cy, radius);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, `rgba(0, 0, 0, ${amount * 0.008})`);
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Grain generator
  function applyGrainCanvas(canvas, ctx, amount) {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const noiseFactor = amount * 0.25;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * noiseFactor;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);
  }

  // ==================== EXPORT & DOWNLOAD ====================

  downloadBtn.addEventListener('click', () => {
    if (state.currentIndex === -1) return;
    
    const image = state.images[state.currentIndex];
    showToast('Rendering high-res photo...', 'success');
    
    renderToCanvas(image).then(canvas => {
      const format = exportFormat.value; // png, jpeg, webp
      const quality = parseFloat(exportQuality.value);
      
      const link = document.createElement('a');
      const ext = format === 'jpeg' ? 'jpg' : format;
      const cleanName = image.name.substring(0, image.name.lastIndexOf('.')) || image.name;
      link.download = `${cleanName}_enhanced.${ext}`;
      link.href = canvas.toDataURL(`image/${format}`, quality);
      link.click();
      
      showToast('Photo exported successfully!', 'success');
    });
  });

  // Export all processed photos as batch download
  downloadAllBtn.addEventListener('click', () => {
    if (state.images.length === 0) return;
    
    showToast(`Processing batch of ${state.images.length} photos...`, 'success');
    
    let index = 0;
    
    function downloadNext() {
      if (index >= state.images.length) {
        showToast('Batch download complete!', 'success');
        return;
      }
      
      const image = state.images[index];
      renderToCanvas(image).then(canvas => {
        const format = exportFormat.value;
        const quality = parseFloat(exportQuality.value);
        
        const link = document.createElement('a');
        const ext = format === 'jpeg' ? 'jpg' : format;
        const cleanName = image.name.substring(0, image.name.lastIndexOf('.')) || image.name;
        link.download = `${cleanName}_enhanced.${ext}`;
        link.href = canvas.toDataURL(`image/${format}`, quality);
        link.click();
        
        index++;
        setTimeout(downloadNext, 300); // Small interval to prevent browser from blocking concurrent downloads
      });
    }
    
    downloadNext();
  });

  // Back button (returns to upload screen)
  backBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to exit the editor? Any unsaved edits will be lost.')) {
      state.images = [];
      state.currentIndex = -1;
      state.history = [];
      state.historyIndex = -1;
      
      editorScreen.classList.add('hidden');
      uploadScreen.classList.remove('hidden');
      fileInput.value = '';
    }
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
