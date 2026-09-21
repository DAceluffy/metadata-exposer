# EXPOSER. // Minimal Metadata Inspector & Sanitizer

An ultra-clean, Dieter Rams / Swiss typography-inspired metadata inspector and privacy sanitizer web application. 100% client-side execution with zero telemetry.

---

## Features

- **Multi-Format Support**:
  - **Images**: JPEG, PNG, WebP, GIF, TIFF, SVG, HEIC (EXIF, IPTC, XMP, ICC, GPS, dimensions, aspect ratio, megapixels).
  - **Audio**: MP3, WAV, FLAC, OGG, M4A (ID3 tags: title, artist, album, genre, year, embedded album artwork preview).
  - **Video**: MP4, WebM, MOV, MKV (resolution, duration, aspect ratio, frame scrubber).
  - **Documents**: PDF, TXT, MD, JSON, CSV (author, creator, title, page count, word count, character count).
  - **Generic Files**: File size, MIME classification, SHA-256 and SHA-1 cryptographic checksums.
- **Geolocation & Interactive Map**:
  - Automatically parses GPS latitude, longitude, and altitude from photos.
  - Renders an interactive OpenStreetMap radar pin directly in the browser.
- **Privacy Radar**:
  - Real-time privacy risk assessment. Alerts if a photo leaks exact home coordinates or camera hardware serial numbers.
- **Privacy Sanitizer ("Strip & Download")**:
  - One-click metadata wiper: clears EXIF, IPTC, and GPS data via client-side canvas buffer, letting you download a sanitized clean file.
- **Web & Social Card Inspector**:
  - Input any URL or paste raw HTML.
  - Inspects OpenGraph tags, Twitter Cards, SEO meta, JSON-LD schemas, and renders a live social card preview.
- **Minimalist Aesthetic & UX**:
  - Dieter Rams / Linear-inspired dark & light modes (`DM Mono` + `Inter`).
  - Real-time search/filter across all metadata tags.
  - Direct clipboard paste support (`Ctrl+V`).
  - One-click copy for any tag value.
  - Export full report as `.json`, `.md` (Markdown), or `.txt`.

---

## How to Run

### Option 1: Direct File Opening
Double-click [`index.html`](index.html) or open it directly in any modern browser (Chrome, Edge, Firefox, Brave).

### Option 2: Local Python Server (Recommended)
Run the built-in launcher:
```bash
python run.py
```
This serves the application on `http://localhost:5050` and automatically opens your browser.

---

## Verification & Demo File
A demo test image containing embedded EXIF and GPS tags is included:
[`sample_photo_with_gps.jpg`](sample_photo_with_gps.jpg)

Drop it into the app to immediately see:
- Camera: `Leica Camera AG` / `Leica Q3 Monochrom`
- Date Taken & Software info
- Privacy Radar alert with GPS coordinates and interactive OpenStreetMap pin
- One-click "Strip Metadata & Download"
