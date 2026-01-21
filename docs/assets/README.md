# Favicon and Open Graph Assets

This directory contains the favicon and Open Graph image assets for OpenPeople.ai.

## Favicon

The favicon uses a clean, modern design with interconnected human figures representing "Open People" - the concept of connecting and collaborating openly.

### Files:
- `favicon.ico` - Traditional favicon (16x16, 32x32)
- `favicon.svg` - Modern SVG favicon with electric lime (#00FF88) background
- `favicon-16x16.png` - 16x16 PNG
- `favicon-32x32.png` - 32x32 PNG
- `favicon-48x48.png` - 48x48 PNG
- `apple-touch-icon.png` - 180x180 Apple touch icon
- `android-chrome-192x192.png` - Android PWA icon
- `android-chrome-512x512.png` - Android PWA icon
- `manifest.json` - Web App Manifest for PWA support

### Design:
- **Color**: Electric lime (#00FF88) background
- **Icon**: Stylized interconnected human figures
- **Style**: Clean, modern, geometric

## Open Graph Images

### Static OG Images:
- `og-image.png` - 1200x630 Facebook Open Graph image
- `twitter-image.png` - 1200x600 Twitter Card image

### Dynamic OG Images:
- `/api/og` - Dynamic OG image generation endpoint using @vercel/og
- Supports different content types (website, note, profile)
- Customizable title, description, and styling

## Usage

### Static Images:
```typescript
// In metadata
openGraph: {
  images: [
    {
      url: "/og-image.png",
      width: 1200,
      height: 630,
      alt: "OpenPeople.ai - Human-centric AI platform",
    },
  ],
},
twitter: {
  card: "summary_large_image",
  images: ["/twitter-image.png"],
},
```

### Dynamic Images:
```typescript
// For shared notes
const ogUrl = `/api/og?title=${encodeURIComponent(noteTitle)}&description=${encodeURIComponent(noteExcerpt)}&type=note`;

// For user profiles
const ogUrl = `/api/og?title=${encodeURIComponent(userName)}&description=${encodeURIComponent(userBio)}&type=profile`;
```

## Implementation Details

### Favicon Implementation:
- SVG favicon for crisp scaling on all devices
- Multiple PNG fallbacks for older browsers
- Apple touch icons for iOS devices
- Web App Manifest for PWA support
- Theme colors for mobile browsers

### OG Image Design:
- **Background**: Pure black (#000000)
- **Accent Color**: Electric lime (#00FF88)
- **Typography**: Inter font family
- **Layout**: Clean, centered design with logo
- **Content**: Title, description, and branding

## Browser Support

### Favicon:
- ✅ Chrome 4+
- ✅ Firefox 3.5+
- ✅ Safari 3.1+
- ✅ Edge 12+
- ✅ IE 9+

### OG Images:
- ✅ Facebook
- ✅ Twitter
- ✅ LinkedIn
- ✅ WhatsApp
- ✅ Discord
- ✅ Most social platforms

## Customization

### For Custom OG Images:
Modify the `/api/og/route.tsx` file to add new content types or styling options.

### For Custom Favicons:
1. Update the SVG design in `public/favicon.svg`
2. Regenerate PNG versions using a tool like ImageMagick or online converters
3. Update color scheme if needed

## Testing

### Favicon Testing:
- Check browser tab icons
- Test on different devices (mobile, tablet, desktop)
- Verify PWA installation icons

### OG Image Testing:
- Use Facebook's [Sharing Debugger](https://developers.facebook.com/tools/debug/)
- Use Twitter's [Card Validator](https://cards-dev.twitter.com/validator)
- Test sharing on various platforms