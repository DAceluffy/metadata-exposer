/**
 * EXPOSER. // Minimal Metadata Inspector & Sanitizer
 * 100% Client-side metadata extractor & privacy sanitizer
 */

(function () {
  'use strict';

  // ── STATE ───────────────────────────────────────────────────
  let currentMetadata = null;
  let activeFile = null;
  let leafletMap = null;
  let mapMarker = null;

  // ── DOM ELEMENTS ────────────────────────────────────────────
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  // File Tab Elements
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');

  // URL / HTML Elements
  const urlInput = document.getElementById('urlInput');
  const inspectUrlBtn = document.getElementById('inspectUrlBtn');
  const toggleHtmlArea = document.getElementById('toggleHtmlArea');
  const rawHtmlInput = document.getElementById('rawHtmlInput');
  const htmlParseActionRow = document.getElementById('htmlParseActionRow');
  const inspectHtmlBtn = document.getElementById('inspectHtmlBtn');

  // Sanitizer Tab Elements
  const sanitizerDropzone = document.getElementById('sanitizerDropzone');
  const sanitizerFileInput = document.getElementById('sanitizerFileInput');
  const browseSanitizeBtn = document.getElementById('browseSanitizeBtn');

  // Results & Sidebar Elements
  const resultsSection = document.getElementById('resultsSection');
  const previewContainer = document.getElementById('previewContainer');
  const previewPlaceholder = document.getElementById('previewPlaceholder');
  const imagePreview = document.getElementById('imagePreview');
  const videoPreview = document.getElementById('videoPreview');
  const audioPreview = document.getElementById('audioPreview');
  const fileTitle = document.getElementById('fileTitle');
  const chipSize = document.getElementById('chipSize');
  const chipType = document.getElementById('chipType');

  // Action Buttons
  const privacyAlert = document.getElementById('privacyAlert');
  const privacyAlertStatus = document.getElementById('privacyAlertStatus');
  const privacyAlertDetails = document.getElementById('privacyAlertDetails');
  const sanitizeCurrentBtn = document.getElementById('sanitizeCurrentBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const exportMdBtn = document.getElementById('exportMdBtn');
  const copyAllBtn = document.getElementById('copyAllBtn');
  const clearBtn = document.getElementById('clearBtn');

  // Inspector & Groups
  const metadataSearch = document.getElementById('metadataSearch');
  const metadataCountBadge = document.getElementById('metadataCountBadge');
  const metadataGroupsContainer = document.getElementById('metadataGroupsContainer');
  const gpsGroup = document.getElementById('gpsGroup');
  const gpsCoordsText = document.getElementById('gpsCoordsText');
  const osmExternalLink = document.getElementById('osmExternalLink');
  const socialPreviewGroup = document.getElementById('socialPreviewGroup');

  // Social Card
  const socialCardImage = document.getElementById('socialCardImage');
  const socialCardDomain = document.getElementById('socialCardDomain');
  const socialCardTitle = document.getElementById('socialCardTitle');
  const socialCardDesc = document.getElementById('socialCardDesc');

  // Modal
  const jsonModal = document.getElementById('jsonModal');
  const jsonModalContent = document.getElementById('jsonModalContent');
  const closeJsonModal = document.getElementById('closeJsonModal');
  const toastContainer = document.getElementById('toastContainer');

  // ── THEME MANAGEMENT ────────────────────────────────────────
  function initTheme() {
    const savedTheme = localStorage.getItem('exposer-theme') || 'dark';
    setTheme(savedTheme);
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('exposer-theme', theme);

    if (theme === 'light') {
      themeIcon.innerHTML = `
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      `;
      themeToggleBtn.setAttribute('title', 'Switch to Dark Mode');
    } else {
      themeIcon.innerHTML = `
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      `;
      themeToggleBtn.setAttribute('title', 'Switch to Light Mode');
    }
  }

  themeToggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    setTheme(current === 'dark' ? 'light' : 'dark');
  });

  // ── TOAST NOTIFICATIONS ─────────────────────────────────────
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-dot"></span><span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2400);
  }

  // ── TAB SWITCHING ───────────────────────────────────────────
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(`tab-${tabId}`);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  // Toggle raw HTML textarea in Web Tab
  toggleHtmlArea.addEventListener('click', () => {
    const isHidden = rawHtmlInput.style.display === 'none' || !rawHtmlInput.style.display;
    rawHtmlInput.style.display = isHidden ? 'block' : 'none';
    htmlParseActionRow.style.display = isHidden ? 'block' : 'none';
  });

  // ── DRAG & DROP / FILE INPUT HANDLERS ────────────────────────
  function setupDragAndDrop(element, onFileSelected) {
    ['dragenter', 'dragover'].forEach(eventName => {
      element.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
        element.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      element.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
        element.classList.remove('dragover');
      });
    });

    element.addEventListener('drop', e => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        onFileSelected(files[0]);
      }
    });

    element.addEventListener('click', () => {
      const input = element.querySelector('input[type="file"]');
      if (input) input.click();
    });
  }

  setupDragAndDrop(dropzone, processFile);
  fileInput.addEventListener('change', e => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  });

  // Sanitizer Drag & Drop
  setupDragAndDrop(sanitizerDropzone, sanitizeImageDirect);
  browseSanitizeBtn.addEventListener('click', e => {
    e.stopPropagation();
    sanitizerFileInput.click();
  });
  sanitizerFileInput.addEventListener('change', e => {
    if (e.target.files && e.target.files.length > 0) {
      sanitizeImageDirect(e.target.files[0]);
    }
  });

  // Clipboard Paste (Ctrl+V) handler
  window.addEventListener('paste', e => {
    // If user is pasting into text input, don't intercept
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          processFile(file);
          showToast('Pasted image from clipboard');
          return;
        }
      } else if (item.kind === 'string' && item.type === 'text/plain') {
        item.getAsString(text => {
          text = text.trim();
          if (text.startsWith('http://') || text.startsWith('https://')) {
            urlInput.value = text;
            inspectUrl(text);
          }
        });
      }
    }
  });

  // ── CORE FILE PROCESSOR ─────────────────────────────────────
  async function processFile(file) {
    if (!file) return;
    activeFile = file;

    // Reset UI
    resetInspector();
    resultsSection.classList.add('active');
    fileTitle.textContent = file.name;
    chipSize.textContent = formatBytes(file.size);
    chipType.textContent = file.type || getExtension(file.name).toUpperCase() || 'BINARY';

    showToast(`Inspecting ${file.name}...`);

    // Prepare container object
    currentMetadata = {
      filename: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      lastModified: new Date(file.lastModified).toISOString(),
      categories: {
        'FILE INTEGRITY': {},
        'IMAGE OPTICS & EXIF': {},
        'GEOLOCATION': {},
        'MEDIA SPECIFICATIONS': {},
        'AUDIO & ID3 TAGS': {},
        'DOCUMENT & AUTHORING': {},
        'RAW ATTRIBUTES': {}
      }
    };

    // 1. File Integrity & Hashes (Async)
    currentMetadata.categories['FILE INTEGRITY']['File Name'] = file.name;
    currentMetadata.categories['FILE INTEGRITY']['File Size'] = `${file.size.toLocaleString()} bytes (${formatBytes(file.size)})`;
    currentMetadata.categories['FILE INTEGRITY']['MIME Type'] = file.type || 'application/octet-stream';
    currentMetadata.categories['FILE INTEGRITY']['Last Modified'] = new Date(file.lastModified).toLocaleString();

    // Compute Cryptographic Checksums (SHA-256)
    calculateChecksums(file);

    // 2. Route by file type
    const fileType = file.type.toLowerCase();
    const ext = getExtension(file.name).toLowerCase();

    if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'tiff', 'tif', 'bmp', 'svg', 'heic'].includes(ext)) {
      await processImageFile(file);
    } else if (fileType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(ext)) {
      await processAudioFile(file);
    } else if (fileType.startsWith('video/') || ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext)) {
      await processVideoFile(file);
    } else if (fileType === 'application/pdf' || ext === 'pdf') {
      await processPdfFile(file);
    } else if (fileType.startsWith('text/') || ['txt', 'json', 'md', 'csv', 'js', 'py', 'html', 'css'].includes(ext)) {
      await processTextFile(file);
    } else {
      processGenericFile(file);
    }

    renderMetadata();
  }

  // ── IMAGE FILE PARSING ──────────────────────────────────────
  async function processImageFile(file) {
    const objectUrl = URL.createObjectURL(file);
    imagePreview.src = objectUrl;
    imagePreview.style.display = 'block';
    previewPlaceholder.style.display = 'none';
    sanitizeCurrentBtn.style.display = 'inline-flex';

    // Measure visual dimensions via Image()
    const imgObj = new Image();
    imgObj.src = objectUrl;
    await new Promise(resolve => {
      imgObj.onload = () => {
        const mp = ((imgObj.naturalWidth * imgObj.naturalHeight) / 1000000).toFixed(2);
        const aspect = calculateAspectRatio(imgObj.naturalWidth, imgObj.naturalHeight);

        currentMetadata.categories['MEDIA SPECIFICATIONS']['Dimensions'] = `${imgObj.naturalWidth} × ${imgObj.naturalHeight} px`;
        currentMetadata.categories['MEDIA SPECIFICATIONS']['Aspect Ratio'] = aspect;
        currentMetadata.categories['MEDIA SPECIFICATIONS']['Resolution'] = `${mp} Megapixels`;
        resolve();
      };
      imgObj.onerror = resolve;
    });

    // Parse EXIF, GPS, IPTC, XMP via exifr if loaded
    if (window.exifr) {
      try {
        const exifData = await window.exifr.parse(file, {
          tiff: true,
          xmp: true,
          icc: true,
          iptc: true,
          jfif: true,
          gps: true,
          reviveValues: true
        });

        if (exifData) {
          extractExifFields(exifData);
        }
      } catch (err) {
        console.warn('Exifr parse warning:', err);
      }
    }

    // Evaluate Privacy Radar
    evaluatePrivacyRadar();
  }

  function extractExifFields(data) {
    const optics = currentMetadata.categories['IMAGE OPTICS & EXIF'];
    const gps = currentMetadata.categories['GEOLOCATION'];
    const docs = currentMetadata.categories['DOCUMENT & AUTHORING'];
    const raw = currentMetadata.categories['RAW ATTRIBUTES'];

    // Camera & Lens
    if (data.Make) optics['Camera Make'] = String(data.Make).trim();
    if (data.Model) optics['Camera Model'] = String(data.Model).trim();
    if (data.LensModel || data.Lens) optics['Lens Model'] = String(data.LensModel || data.Lens).trim();
    if (data.FocalLength) optics['Focal Length'] = `${data.FocalLength} mm`;
    if (data.FNumber) optics['Aperture'] = `f/${data.FNumber}`;
    if (data.ExposureTime) optics['Exposure Time'] = formatShutterSpeed(data.ExposureTime);
    if (data.ISO) optics['ISO Speed'] = String(data.ISO);
    if (data.ExposureBiasValue !== undefined) optics['Exposure Bias'] = `${data.ExposureBiasValue} EV`;
    if (data.MeteringMode) optics['Metering Mode'] = String(data.MeteringMode);
    if (data.Flash) optics['Flash'] = String(data.Flash);
    if (data.WhiteBalance) optics['White Balance'] = String(data.WhiteBalance);
    if (data.DateTimeOriginal || data.CreateDate) {
      const dt = data.DateTimeOriginal || data.CreateDate;
      optics['Date Taken'] = dt instanceof Date ? dt.toLocaleString() : String(dt);
    }
    if (data.Software) optics['Editing Software'] = String(data.Software);

    // GPS & Geolocation
    if (data.latitude !== undefined && data.longitude !== undefined) {
      const lat = parseFloat(data.latitude);
      const lon = parseFloat(data.longitude);

      gps['Latitude'] = `${lat.toFixed(6)}° (${formatDMS(lat, true)})`;
      gps['Longitude'] = `${lon.toFixed(6)}° (${formatDMS(lon, false)})`;
      if (data.GPSAltitude) gps['Altitude'] = `${data.GPSAltitude} meters`;
      if (data.GPSImgDirection) gps['Direction / Heading'] = `${data.GPSImgDirection}°`;

      // Trigger map display
      renderGpsMap(lat, lon);
    }

    // IPTC / Copyright
    if (data.Artist) docs['Artist / Creator'] = String(data.Artist);
    if (data.Copyright) docs['Copyright Notice'] = String(data.Copyright);
    if (data.ImageDescription) docs['Description'] = String(data.ImageDescription);

    // Save Raw Dump
    for (let [k, v] of Object.entries(data)) {
      if (v !== null && v !== undefined && typeof v !== 'object') {
        raw[k] = String(v);
      }
    }
  }

  // ── AUDIO FILE PARSING ──────────────────────────────────────
  async function processAudioFile(file) {
    const objectUrl = URL.createObjectURL(file);
    audioPreview.src = objectUrl;
    audioPreview.style.display = 'block';
    previewPlaceholder.style.display = 'none';

    // HTML5 Audio duration
    const audioObj = new Audio(objectUrl);
    audioObj.onloadedmetadata = () => {
      if (audioObj.duration && isFinite(audioObj.duration)) {
        currentMetadata.categories['MEDIA SPECIFICATIONS']['Duration'] = formatDuration(audioObj.duration);
      }
      renderMetadata();
    };

    // ID3 Tags using jsmediatags
    if (window.jsmediatags) {
      window.jsmediatags.read(file, {
        onSuccess: tag => {
          const tags = tag.tags || {};
          const id3 = currentMetadata.categories['AUDIO & ID3 TAGS'];
          if (tags.title) id3['Song Title'] = tags.title;
          if (tags.artist) id3['Artist'] = tags.artist;
          if (tags.album) id3['Album'] = tags.album;
          if (tags.year) id3['Year'] = tags.year;
          if (tags.genre) id3['Genre'] = tags.genre;
          if (tags.track) id3['Track Number'] = String(tags.track);

          // Album Art Preview if present
          if (tags.picture) {
            const pic = tags.picture;
            let base64String = '';
            for (let i = 0; i < pic.data.length; i++) {
              base64String += String.fromCharCode(pic.data[i]);
            }
            const base64 = `data:${pic.format};base64,${window.btoa(base64String)}`;
            imagePreview.src = base64;
            imagePreview.style.display = 'block';
          }

          renderMetadata();
        },
        onError: err => {
          console.warn('ID3 tag parse error:', err);
        }
      });
    }
  }

  // ── VIDEO FILE PARSING ──────────────────────────────────────
  async function processVideoFile(file) {
    const objectUrl = URL.createObjectURL(file);
    videoPreview.src = objectUrl;
    videoPreview.style.display = 'block';
    previewPlaceholder.style.display = 'none';

    videoPreview.onloadedmetadata = () => {
      const specs = currentMetadata.categories['MEDIA SPECIFICATIONS'];
      specs['Video Dimensions'] = `${videoPreview.videoWidth} × ${videoPreview.videoHeight} px`;
      specs['Aspect Ratio'] = calculateAspectRatio(videoPreview.videoWidth, videoPreview.videoHeight);
      if (videoPreview.duration && isFinite(videoPreview.duration)) {
        specs['Duration'] = formatDuration(videoPreview.duration);
      }
      renderMetadata();
    };
  }

  // ── PDF FILE PARSING ────────────────────────────────────────
  async function processPdfFile(file) {
    previewPlaceholder.innerHTML = `
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="9" y1="15" x2="15" y2="15"></line>
      </svg>
      <span style="font-family:var(--font-mono); font-size:12px;">PDF Document</span>
    `;

    try {
      const buffer = await file.arrayBuffer();
      if (window.PDFLib) {
        const pdfDoc = await window.PDFLib.PDFDocument.load(buffer, { ignoreEncryption: true });
        const docs = currentMetadata.categories['DOCUMENT & AUTHORING'];

        const title = pdfDoc.getTitle();
        const author = pdfDoc.getAuthor();
        const subject = pdfDoc.getSubject();
        const creator = pdfDoc.getCreator();
        const producer = pdfDoc.getProducer();
        const creationDate = pdfDoc.getCreationDate();
        const modDate = pdfDoc.getModificationDate();
        const pageCount = pdfDoc.getPageCount();

        if (title) docs['Title'] = title;
        if (author) docs['Author'] = author;
        if (subject) docs['Subject'] = subject;
        if (creator) docs['Application Creator'] = creator;
        if (producer) docs['PDF Producer'] = producer;
        if (creationDate) docs['Created On'] = creationDate.toLocaleString();
        if (modDate) docs['Modified On'] = modDate.toLocaleString();
        docs['Total Pages'] = String(pageCount);
      }
    } catch (err) {
      console.warn('PDF parsing error:', err);
    }
  }

  // ── TEXT FILE PARSING ───────────────────────────────────────
  async function processTextFile(file) {
    try {
      const text = await file.text();
      const lines = text.split(/\r\n|\r|\n/).length;
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;

      const docs = currentMetadata.categories['DOCUMENT & AUTHORING'];
      docs['Line Count'] = lines.toLocaleString();
      docs['Word Count'] = words.toLocaleString();
      docs['Character Count'] = chars.toLocaleString();
      docs['Character Encoding'] = 'UTF-8';
    } catch (err) {
      console.warn('Text parsing error:', err);
    }
  }

  // ── GENERIC FILE FALLBACK ───────────────────────────────────
  function processGenericFile(file) {
    currentMetadata.categories['FILE INTEGRITY']['Format Classification'] = 'Binary Stream';
  }

  // ── ASYNC CRYPTOGRAPHIC HASHING ─────────────────────────────
  async function calculateChecksums(file) {
    try {
      // Limit hash calculation to reasonable size for browser responsiveness (under 100MB)
      if (file.size < 100 * 1024 * 1024 && window.crypto && window.crypto.subtle) {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        currentMetadata.categories['FILE INTEGRITY']['SHA-256 Checksum'] = hashHex;
        renderMetadata();
      }
    } catch (err) {
      console.warn('Hash error:', err);
    }
  }

  // ── WEB & HTML METADATA INSPECTION ──────────────────────────
  inspectUrlBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (!url) {
      showToast('Please enter a URL');
      return;
    }
    inspectUrl(url);
  });

  urlInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      inspectUrlBtn.click();
    }
  });

  inspectHtmlBtn.addEventListener('click', () => {
    const html = rawHtmlInput.value.trim();
    if (!html) {
      showToast('Please paste some HTML');
      return;
    }
    parseAndExposeHtml(html, 'Pasted HTML Document');
  });

  async function inspectUrl(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
      urlInput.value = url;
    }

    showToast(`Fetching metadata from ${url}...`);

    try {
      // Attempt 1: Direct fetch
      let html = '';
      try {
        const response = await fetch(url, { mode: 'cors' });
        html = await response.text();
      } catch (corsErr) {
        // Attempt 2: Public CORS proxy for client-side tools
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const proxyResp = await fetch(proxyUrl);
        html = await proxyResp.text();
      }

      if (html) {
        parseAndExposeHtml(html, url);
      } else {
        throw new Error('Empty response received');
      }
    } catch (err) {
      console.warn('URL fetch error:', err);
      showToast('CORS restricted. Paste the page <head> HTML below.');
      rawHtmlInput.style.display = 'block';
      htmlParseActionRow.style.display = 'block';
    }
  }

  function parseAndExposeHtml(htmlString, sourceName) {
    resetInspector();
    resultsSection.classList.add('active');

    fileTitle.textContent = sourceName;
    chipSize.textContent = `${htmlString.length.toLocaleString()} chars`;
    chipType.textContent = 'HTML / WEB';

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    currentMetadata = {
      filename: sourceName,
      fileSize: htmlString.length,
      mimeType: 'text/html',
      categories: {
        'PAGE & SEO META': {},
        'OPEN GRAPH (OG:*)': {},
        'TWITTER CARDS': {},
        'STRUCTURED DATA & SCHEMA': {}
      }
    };

    const seo = currentMetadata.categories['PAGE & SEO META'];
    const og = currentMetadata.categories['OPEN GRAPH (OG:*)'];
    const twitter = currentMetadata.categories['TWITTER CARDS'];
    const schema = currentMetadata.categories['STRUCTURED DATA & SCHEMA'];

    // Title
    const titleEl = doc.querySelector('title');
    if (titleEl && titleEl.textContent) seo['Page Title'] = titleEl.textContent.trim();

    // Canonical
    const canonical = doc.querySelector('link[rel="canonical"]');
    if (canonical) seo['Canonical URL'] = canonical.getAttribute('href');

    // Favicon
    const icon = doc.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
    if (icon) seo['Favicon'] = icon.getAttribute('href');

    // Meta tags
    const metas = doc.querySelectorAll('meta');
    metas.forEach(meta => {
      const name = meta.getAttribute('name') || meta.getAttribute('property') || meta.getAttribute('http-equiv');
      const content = meta.getAttribute('content');
      if (!name || !content) return;

      const lowerName = name.toLowerCase();

      if (lowerName.startsWith('og:')) {
        og[name] = content;
      } else if (lowerName.startsWith('twitter:')) {
        twitter[name] = content;
      } else if (['description', 'keywords', 'author', 'robots', 'viewport', 'theme-color'].includes(lowerName)) {
        seo[name.toUpperCase()] = content;
      }
    });

    // JSON-LD Scripts
    const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
    jsonLdScripts.forEach((script, idx) => {
      try {
        const parsed = JSON.parse(script.textContent);
        schema[`JSON-LD [${idx + 1}] (${parsed['@type'] || 'Schema'})`] = JSON.stringify(parsed, null, 2);
      } catch (e) {
        schema[`JSON-LD [${idx + 1}] (Raw)`] = script.textContent.trim();
      }
    });

    // Live Social Preview Card
    updateSocialCard(seo, og, twitter, sourceName);

    renderMetadata();
    showToast('Web metadata successfully extracted!');
  }

  function updateSocialCard(seo, og, twitter, sourceUrl) {
    socialPreviewGroup.style.display = 'block';

    const title = og['og:title'] || twitter['twitter:title'] || seo['Page Title'] || 'Page Title';
    const desc = og['og:description'] || twitter['twitter:description'] || seo['DESCRIPTION'] || 'No meta description found.';
    const image = og['og:image'] || twitter['twitter:image'] || '';

    socialCardTitle.textContent = title;
    socialCardDesc.textContent = desc;

    try {
      socialCardDomain.textContent = new URL(sourceUrl).hostname;
    } catch {
      socialCardDomain.textContent = sourceUrl;
    }

    if (image) {
      socialCardImage.src = image;
      socialCardImage.style.display = 'block';
    } else {
      socialCardImage.style.display = 'none';
    }
  }

  // ── PRIVACY RADAR ───────────────────────────────────────────
  function evaluatePrivacyRadar() {
    const gpsData = currentMetadata.categories['GEOLOCATION'];
    const optics = currentMetadata.categories['IMAGE OPTICS & EXIF'];
    const hasGps = Object.keys(gpsData).length > 0;
    const hasSerial = optics['Camera Serial'] || optics['Lens Serial'];

    if (hasGps) {
      privacyAlert.className = 'privacy-alert warning';
      privacyAlertStatus.textContent = 'HIGH PRIVACY RISK: GPS DATA DETECTED';
      privacyAlertDetails.textContent = 'This file contains embedded coordinates revealing the exact physical location where it was recorded.';
    } else if (hasSerial) {
      privacyAlert.className = 'privacy-alert warning';
      privacyAlertStatus.textContent = 'DEVICE FINGERPRINT DETECTED';
      privacyAlertDetails.textContent = 'This file contains unique camera or lens hardware serial numbers.';
    } else {
      privacyAlert.className = 'privacy-alert safe';
      privacyAlertStatus.textContent = 'NO SENSITIVE GEODATA DETECTED';
      privacyAlertDetails.textContent = 'No GPS coordinates or personal identity serial tags found in this file.';
    }
  }

  // ── RENDER METADATA UI ──────────────────────────────────────
  function renderMetadata() {
    if (!currentMetadata) return;

    metadataGroupsContainer.innerHTML = '';
    let totalTags = 0;
    const query = metadataSearch.value.trim().toLowerCase();

    for (let [categoryName, tags] of Object.entries(currentMetadata.categories)) {
      const entries = Object.entries(tags);
      if (entries.length === 0) continue;

      // Filter entries by search query
      const filteredEntries = entries.filter(([k, v]) => {
        if (!query) return true;
        return k.toLowerCase().includes(query) || String(v).toLowerCase().includes(query);
      });

      if (filteredEntries.length === 0) continue;
      totalTags += filteredEntries.length;

      const groupEl = document.createElement('div');
      groupEl.className = 'meta-group';

      const header = document.createElement('div');
      header.className = 'meta-group-header';
      header.innerHTML = `
        <div class="meta-group-title">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
          ${escapeHtml(categoryName)}
        </div>
        <span class="meta-group-count">${filteredEntries.length} items</span>
      `;

      const body = document.createElement('div');
      body.className = 'meta-group-body';

      filteredEntries.forEach(([key, val]) => {
        const row = document.createElement('div');
        row.className = 'meta-row';
        row.setAttribute('title', 'Click to copy value');

        const isSensitive = key.toLowerCase().includes('lat') || key.toLowerCase().includes('lon') || key.toLowerCase().includes('serial');

        row.innerHTML = `
          <span class="meta-key">${escapeHtml(key)}</span>
          <span class="meta-val ${isSensitive ? 'sensitive' : ''}">${escapeHtml(String(val))}</span>
          <button class="copy-row-btn" title="Copy to clipboard">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        `;

        row.addEventListener('click', () => {
          copyToClipboard(val);
          showToast(`Copied "${key}"`);
        });

        body.appendChild(row);
      });

      // Collapsible toggle
      header.addEventListener('click', () => {
        const isHidden = body.style.display === 'none';
        body.style.display = isHidden ? 'flex' : 'none';
        header.querySelector('svg').style.transform = isHidden ? 'rotate(0deg)' : 'rotate(-90deg)';
      });

      groupEl.appendChild(header);
      groupEl.appendChild(body);
      metadataGroupsContainer.appendChild(groupEl);
    }

    metadataCountBadge.textContent = `${totalTags} tags exposed`;
  }

  // Real-time metadata search
  metadataSearch.addEventListener('input', () => {
    renderMetadata();
  });

  // ── INTERACTIVE GPS MAP RENDERER ────────────────────────────
  function renderGpsMap(lat, lon) {
    gpsGroup.style.display = 'block';
    gpsCoordsText.textContent = `${lat.toFixed(5)}°, ${lon.toFixed(5)}°`;
    osmExternalLink.href = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`;

    if (!window.L) return;

    setTimeout(() => {
      if (!leafletMap) {
        leafletMap = L.map('gpsMap', {
          zoomControl: false,
          attributionControl: false
        }).setView([lat, lon], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19
        }).addTo(leafletMap);

        mapMarker = L.marker([lat, lon]).addTo(leafletMap);
      } else {
        leafletMap.invalidateSize();
        leafletMap.setView([lat, lon], 14);
        if (mapMarker) {
          mapMarker.setLatLng([lat, lon]);
        } else {
          mapMarker = L.marker([lat, lon]).addTo(leafletMap);
        }
      }
    }, 150);
  }

  // ── METADATA SANITIZER (STRIP EXIF & DOWNLOAD) ──────────────
  sanitizeCurrentBtn.addEventListener('click', () => {
    if (activeFile) {
      sanitizeImageDirect(activeFile);
    }
  });

  async function sanitizeImageDirect(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Sanitization is currently supported for image files.');
      return;
    }

    showToast('Stripping all metadata...');

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;

    img.onload = () => {
      // Draw onto pure canvas to strip EXIF, IPTC, and GPS data completely
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      // Determine clean format
      const outType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const outExt = file.type === 'image/png' ? 'png' : 'jpg';

      canvas.toBlob(blob => {
        if (!blob) {
          showToast('Sanitization failed');
          return;
        }

        const cleanFilename = file.name.replace(/\.[^/.]+$/, '') + `_sanitized.${outExt}`;
        triggerDownload(blob, cleanFilename);
        showToast(`Sanitized file downloaded: ${cleanFilename}`);
        URL.revokeObjectURL(url);
      }, outType, 0.95);
    };

    img.onerror = () => {
      showToast('Could not sanitize this image file');
      URL.revokeObjectURL(url);
    };
  }

  // ── EXPORT OPTIONS ──────────────────────────────────────────
  exportJsonBtn.addEventListener('click', () => {
    if (!currentMetadata) return;
    const jsonStr = JSON.stringify(currentMetadata, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const filename = `${currentMetadata.filename || 'metadata'}_exposed.json`;
    triggerDownload(blob, filename);
    showToast('Downloaded JSON report');
  });

  exportMdBtn.addEventListener('click', () => {
    if (!currentMetadata) return;
    let md = `# Metadata Report: ${currentMetadata.filename}\n\n`;
    md += `*Generated by EXPOSER. on ${new Date().toUTCString()}*\n\n`;

    for (let [cat, tags] of Object.entries(currentMetadata.categories)) {
      if (Object.keys(tags).length === 0) continue;
      md += `## ${cat}\n\n`;
      md += `| Property | Value |\n| :--- | :--- |\n`;
      for (let [k, v] of Object.entries(tags)) {
        md += `| **${k}** | \`${String(v).replace(/\|/g, '\\|')}\` |\n`;
      }
      md += `\n`;
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const filename = `${currentMetadata.filename || 'metadata'}_exposed.md`;
    triggerDownload(blob, filename);
    showToast('Downloaded Markdown report');
  });

  copyAllBtn.addEventListener('click', () => {
    if (!currentMetadata) return;
    const jsonStr = JSON.stringify(currentMetadata, null, 2);
    copyToClipboard(jsonStr);
    showToast('Copied full metadata to clipboard as JSON');
  });

  // ── RESET / CLEAR ───────────────────────────────────────────
  clearBtn.addEventListener('click', () => {
    resetInspector();
    fileInput.value = '';
    urlInput.value = '';
    rawHtmlInput.value = '';
    showToast('Cleared');
  });

  function resetInspector() {
    resultsSection.classList.remove('active');
    imagePreview.style.display = 'none';
    imagePreview.src = '';
    videoPreview.style.display = 'none';
    videoPreview.src = '';
    audioPreview.style.display = 'none';
    audioPreview.src = '';
    previewPlaceholder.style.display = 'flex';
    sanitizeCurrentBtn.style.display = 'none';
    gpsGroup.style.display = 'none';
    socialPreviewGroup.style.display = 'none';
    metadataGroupsContainer.innerHTML = '';
    metadataSearch.value = '';
    currentMetadata = null;
    activeFile = null;
  }

  // ── UTILITY FUNCTIONS ───────────────────────────────────────
  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function formatShutterSpeed(val) {
    if (val >= 1) return `${val}s`;
    const denom = Math.round(1 / val);
    return `1/${denom}s`;
  }

  function formatDMS(deg, isLat) {
    const absolute = Math.abs(deg);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
    const direction = isLat ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'W');
    return `${degrees}°${minutes}'${seconds}" ${direction}`;
  }

  function calculateAspectRatio(width, height) {
    function gcd(a, b) {
      return b === 0 ? a : gcd(b, a % b);
    }
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
  }

  function getExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(String(text));
    } else {
      const ta = document.createElement('textarea');
      ta.value = String(text);
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }

  function triggerDownload(blob, filename) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 1500);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Close JSON Modal
  closeJsonModal.addEventListener('click', () => {
    jsonModal.classList.remove('active');
  });

  // ── ADVERTISE MODAL HANDLERS ────────────────────────────────
  const adModal = document.getElementById('adModal');
  const openAdModalBtn = document.getElementById('openAdModalBtn');
  const closeAdModal = document.getElementById('closeAdModal');
  const copyAdEmailBtn = document.getElementById('copyAdEmailBtn');

  if (openAdModalBtn && adModal) {
    openAdModalBtn.addEventListener('click', () => {
      adModal.classList.add('active');
    });

    openAdModalBtn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        adModal.classList.add('active');
      }
    });

    if (closeAdModal) {
      closeAdModal.addEventListener('click', () => {
        adModal.classList.remove('active');
      });
    }

    adModal.addEventListener('click', e => {
      if (e.target === adModal) {
        adModal.classList.remove('active');
      }
    });

    if (copyAdEmailBtn) {
      copyAdEmailBtn.addEventListener('click', () => {
        copyToClipboard('branqomedia@gmail.com');
        showToast('Copied sponsor email: branqomedia@gmail.com');
      });
    }
  }

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      jsonModal.classList.remove('active');
      if (adModal) adModal.classList.remove('active');
    }
  });

  // Init Theme
  initTheme();

})();
