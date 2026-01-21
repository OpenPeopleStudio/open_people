# Open Graph Image Design Specification

## Overview
OpenPeople.ai OG images should be clean, professional, and instantly recognizable. They use a dark theme with electric lime accents to match the brand identity.

## Dimensions

### Facebook/LinkedIn OG Image
- **Size**: 1200 × 630 pixels
- **Aspect Ratio**: 1.91:1
- **Safe Zone**: 1100 × 550 pixels (centered)

### Twitter Card Image
- **Size**: 1200 × 600 pixels
- **Aspect Ratio**: 2:1
- **Safe Zone**: 1100 × 520 pixels (centered)

## Color Palette
- **Background**: #000000 (Pure black)
- **Primary Text**: #FFFFFF (White)
- **Accent**: #00FF88 (Electric Lime)
- **Secondary Text**: #FFFFFF with 80% opacity

## Typography
- **Font Family**: Inter (or system font stack)
- **Title**: 48px, 700 weight, 1.2 line height
- **Description**: 24px, 400 weight, 1.4 line height
- **Branding**: 32px, 600 weight

## Layout Structure

### Default OG Image Layout
```
┌─────────────────────────────────────────────────┐
│                                                 │
│          [Logo/Icon] OpenPeople.ai              │
│                                                 │
│        [Large Title Text - 2-3 lines]           │
│                                                 │
│     [Description Text - 3-4 lines max]          │
│                                                 │
│               [Accent Line]                     │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Note-Specific OG Image Layout
```
┌─────────────────────────────────────────────────┐
│                                                 │
│          📝 Shared Note                         │
│                                                 │
│        [Note Title - 2-3 lines]                 │
│                                                 │
│     [Note Excerpt - 3-4 lines max]              │
│                                                 │
│               [Branding Footer]                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Logo/Icon Specifications

### Main Logo
- **Size**: 48×48 pixels
- **Background**: Electric lime (#00FF88)
- **Text/Icon**: "OP" in bold, or custom icon
- **Corner Radius**: 8px

### Content-Specific Icons
- **Notes**: 📝 (48px)
- **Profiles**: 👤 (120px circular)
- **General**: "OP" logo

## Text Content Guidelines

### Title
- **Maximum Length**: 60 characters
- **Style**: Bold, centered, electric lime accent
- **Fallback**: "OpenPeople.ai"

### Description
- **Maximum Length**: 160 characters
- **Style**: Regular weight, 80% opacity white
- **Fallback**: "Human-centric AI for business"

### Branding
- **Text**: "OpenPeople.ai"
- **Position**: Bottom right or centered footer
- **Style**: Electric lime, medium weight

## Implementation

### Static Images
Create using design tools like:
- Figma
- Canva
- Adobe Illustrator
- Sketch

### Dynamic Images
Generated via `/api/og` endpoint using @vercel/og

## Examples

### Default/Homepage
```
Background: Black
Logo: OP in lime circle, "OpenPeople.ai" next to it
Title: "Human-centric AI for business"
Description: "Plan, execute, and stay aligned across notes, workflows, email, and secure storage."
Accent Line: Lime bar at bottom
```

### Note Sharing
```
Background: Black
Icon: 📝 note emoji
Title: Note title (truncated to 60 chars)
Description: First 160 characters of note content
Footer: "OpenPeople.ai" with logo
```

### Profile Sharing
```
Background: Black
Avatar: Large circular placeholder
Title: User's display name
Description: User's bio or "AI-powered professional"
Branding: OpenPeople.ai logo bottom right
```

## Testing

### Preview Tools
- Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
- Twitter Card Validator: https://cards-dev.twitter.com/validator
- LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/

### Manual Testing
- Share URLs on social platforms
- Check mobile rendering
- Verify text truncation
- Test with various content lengths

## File Naming
- `og-image.png` - Default Facebook OG image
- `twitter-image.png` - Twitter-specific image
- `og-[type].png` - Type-specific images (optional)

## Performance Considerations
- Optimize file size (< 1MB recommended)
- Use WebP format if supported
- Consider CDN delivery for faster loading
- Cache dynamic OG images appropriately