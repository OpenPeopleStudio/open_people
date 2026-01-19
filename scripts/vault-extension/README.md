# Vault Quick Upload - Browser Extension

Upload files to your encrypted vault directly from your browser.

## Features

- Drag & drop upload from popup
- Right-click context menu to upload images and files
- Auto AI categorization
- Rate limiting and security

## Installation

### Chrome / Edge

1. Open `chrome://extensions` (or `edge://extensions`)
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `vault-extension` folder

### Firefox

1. Open `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select `manifest.json`

## Configuration

1. Click the extension icon
2. Click "Settings"
3. Enter your vault endpoint URL
4. Enter your upload token (get from Vault → Quick Share)
5. Click "Save Settings"

## Usage

### Popup Upload

1. Click the extension icon
2. Drag & drop a file, or click to select
3. File uploads automatically with AI categorization

### Context Menu

1. Right-click any image on a webpage
2. Select "Upload image to Vault"
3. Image is downloaded and uploaded to your vault

## Development

### Build

No build step required - plain JavaScript.

### Test

1. Load as unpacked extension
2. Open the browser console for debugging
3. Test upload functionality

### Package for Store

```bash
# Chrome Web Store
zip -r vault-extension.zip manifest.json *.html *.js icons/

# Firefox Add-ons
web-ext build
```

## File Structure

```
vault-extension/
├── manifest.json      # Extension manifest
├── background.js      # Service worker (handles uploads)
├── popup.html         # Popup UI
├── popup.js           # Popup logic
├── options.html       # Settings page
├── options.js         # Settings logic
├── icons/             # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## Security

- Token is stored in Chrome sync storage (encrypted)
- Files are encrypted before upload
- Uses secure HTTPS connections only
- No data is collected or sent to third parties
