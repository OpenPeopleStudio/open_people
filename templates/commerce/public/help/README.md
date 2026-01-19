# Help System Screenshots

This directory contains screenshots for the help documentation system.

## Directory Structure

```
/help
  /getting-started     → Dashboard, navigation screenshots
  /products           → Product management screenshots
  /inventory          → Inventory management screenshots
  /orders             → Order management screenshots
  /messages           → Messaging screenshots
  /analytics          → Reports and analytics screenshots
  /settings           → Settings and configuration screenshots
  /troubleshooting    → Error messages, issues screenshots
```

## Screenshot Guidelines

### Naming Convention
Use descriptive, kebab-case names:
- `dashboard-overview.png`
- `create-product-form.png`
- `inventory-adjustment-modal.png`
- `order-fulfillment-status.png`

### Image Requirements
- **Format**: PNG (preferred) or JPG
- **Size**: 1200-1600px wide (for 2x displays)
- **File size**: < 500KB (use compression)
- **Background**: Use dark theme to match admin UI
- **Annotations**: Add arrows/highlights where helpful

### Taking Screenshots

1. **Browser Setup**
   - Use Chrome/Firefox
   - 1920x1080 resolution minimum
   - Zoom at 100%
   - Hide personal data

2. **Content**
   - Show relevant UI section
   - Include enough context
   - Avoid scrolling screenshots (split into multiple)
   - Use sample/test data only

3. **Annotations** (optional)
   - Red arrows for important elements
   - Red boxes to highlight key areas
   - Numbers for step sequences
   - Use annotation tools like:
     - macOS: Preview, Skitch
     - Windows: Snip & Sketch
     - Cross-platform: Greenshot, ShareX

### Sample Data
When taking screenshots, use:
- Product names: "Sample Product", "Test Item"
- Emails: "user@example.com"
- Prices: Round numbers ($100, $150, $200)
- SKUs: "TEST-001", "SAMPLE-SKU"
- No real customer data

### Tools
- **macOS**: Cmd+Shift+4 (selection), Cmd+Shift+5 (menu)
- **Windows**: Win+Shift+S
- **Linux**: Flameshot, gnome-screenshot
- **Compression**: TinyPNG, ImageOptim, Squoosh

## Adding Screenshots to Help

In `lib/adminHelp.ts`, add images to content using Markdown:

```markdown
## Step 1: Navigate to Products

![Product navigation](help/products/navigate-to-products.png)

Click "Products" in the sidebar to view your catalog.
```

The image paths are relative to `/public/`.

## Screenshot Checklist

Before adding a screenshot:
- [ ] Image is clear and readable
- [ ] No personal/sensitive data visible
- [ ] File size optimized (< 500KB)
- [ ] Saved in correct category folder
- [ ] Descriptive filename
- [ ] Added to help content with alt text
- [ ] Tested in help modal

## Current Screenshot Status

### Getting Started
- [ ] dashboard-overview.png
- [ ] sidebar-navigation.png
- [ ] admin-header.png
- [ ] mobile-menu.png

### Products
- [ ] products-list.png
- [ ] create-product-form.png
- [ ] edit-product.png
- [ ] add-variant.png
- [ ] upload-images.png
- [ ] product-status.png

### Inventory
- [ ] inventory-overview.png
- [ ] stock-levels.png
- [ ] adjust-inventory-modal.png
- [ ] intake-process.png
- [ ] csv-import.png

### Orders
- [ ] orders-list.png
- [ ] order-detail.png
- [ ] fulfillment-button.png
- [ ] shipping-label.png
- [ ] returns-list.png

### Messages
- [ ] messages-inbox.png
- [ ] conversation-view.png
- [ ] send-message.png
- [ ] encryption-settings.png

### Analytics
- [ ] sales-report.png
- [ ] inventory-analytics.png
- [ ] customer-insights.png
- [ ] export-report.png

### Settings
- [ ] tenant-settings.png
- [ ] feature-flags.png
- [ ] payment-settings.png
- [ ] shipping-methods.png
- [ ] user-management.png

### Troubleshooting
- [ ] common-errors.png
- [ ] stock-not-updating.png
- [ ] order-stuck-pending.png
