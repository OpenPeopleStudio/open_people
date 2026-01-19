export type HelpSection = {
  id: string
  title: string
  icon: string
  roles: ('owner' | 'admin' | 'staff')[]
  subsections: {
    id: string
    title: string
    content: string
    images?: {
      src: string
      alt: string
      caption?: string
    }[]
  }[]
}

export const helpSections: HelpSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    roles: ['owner', 'admin', 'staff'],
    subsections: [
      {
        id: 'dashboard-overview',
        title: 'Dashboard Overview',
        content: `
# Dashboard Overview

Welcome to your admin dashboard! Here's what you can do:

![Admin Dashboard](help/getting-started/dashboard-overview.png)

## Navigation
- Use the sidebar to access different sections
- Click your email in the top right to sign out
- The "View Store" link takes you to the public storefront

![Sidebar Navigation](help/getting-started/sidebar-navigation.png)

## Sections
- **Products**: Manage your product catalog
- **Inventory**: Track and adjust stock levels
- **Orders**: Process customer orders
- **Messages**: Communicate with customers
- **Reports**: View sales and analytics

## Quick Actions
- Search for products using the search bar
- Filter orders by status
- View recent activity in the dashboard
        `,
        images: [
          {
            src: 'help/getting-started/dashboard-overview.png',
            alt: 'Admin dashboard overview showing main sections',
            caption: 'The main admin dashboard with navigation sidebar'
          },
          {
            src: 'help/getting-started/sidebar-navigation.png',
            alt: 'Sidebar navigation menu',
            caption: 'Use the sidebar to navigate between sections'
          }
        ]
      },
      {
        id: 'navigation',
        title: 'Navigation & Interface',
        content: `
# Navigation & Interface

## Sidebar Navigation
The left sidebar contains all main sections. Click any item to navigate.

**Mobile**: Tap the menu icon (☰) to open the sidebar.

## Status Indicators
- 🟢 Green: Active/Available
- 🟡 Yellow: Pending/Warning
- 🔴 Red: Error/Urgent attention needed
- ⚪ Gray: Inactive/Disabled

## Keyboard Shortcuts
- \`Ctrl/Cmd + K\`: Quick search
- \`Esc\`: Close modals
- \`Ctrl/Cmd + S\`: Save (where applicable)

## Help & Support
Click the help icon (?) in any section for context-specific guidance.
        `
      }
    ]
  },
  {
    id: 'products',
    title: 'Product Management',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    roles: ['owner', 'admin'],
    subsections: [
      {
        id: 'create-product',
        title: 'Creating Products',
        content: `
# Creating Products

## Step-by-Step Guide

### 1. Navigate to Products
Click "Products" in the sidebar, then click "+ New Product" button

![Products Page](help/products/products-list.png)
*The products list page with the "New Product" button*

### 2. Basic Information
Fill in the product details:

![Create Product Form](help/products/create-product-form.png)

- **Name**: Product title (e.g., "Air Jordan 1 Retro High")
- **Brand**: Manufacturer name
- **Category**: Product type (sneakers, apparel, etc.)
- **Description**: Detailed product information

### 3. Add Images
Upload product photos:

![Upload Images](help/products/upload-images.png)

- Click "Add Images" or drag & drop
- First image becomes the primary image
- Recommended: 1000x1000px minimum
- Formats: JPG, PNG, WebP

### 4. Create Variants
Add size and condition variants:

![Add Variant Form](help/products/add-variant.png)

- Click "Add Variant" for each size/condition
- **SKU**: Auto-generated or custom
- **Size**: Product size
- **Condition**: New, VNDS, Used, etc.
- **Price**: In cents (e.g., 15000 for $150.00)
- **Stock**: Initial quantity

### 5. Save
- Review all details
- Click "Create Product"
- Product is now live on your store

## Best Practices
- Use high-quality images (multiple angles)
- Write detailed descriptions
- Accurate condition grading
- Competitive pricing research
- Keep stock counts updated
        `,
        images: [
          {
            src: 'help/products/products-list.png',
            alt: 'Products list page',
            caption: 'Click the "+ New Product" button to start'
          },
          {
            src: 'help/products/create-product-form.png',
            alt: 'Create product form',
            caption: 'Fill in basic product information'
          },
          {
            src: 'help/products/upload-images.png',
            alt: 'Image upload interface',
            caption: 'Drag and drop or click to upload images'
          },
          {
            src: 'help/products/add-variant.png',
            alt: 'Add variant form',
            caption: 'Create variants for different sizes and conditions'
          }
        ]
      },
      {
        id: 'edit-product',
        title: 'Editing Products',
        content: `
# Editing Products

## Update Product Details

1. Go to Products → Click product name
2. Edit any field
3. Click "Save Changes"

## Manage Variants
- **Add**: Click "+ Add Variant"
- **Edit**: Click variant row to modify
- **Delete**: Use trash icon (⚠️ cannot be undone)

## Update Images
- **Add**: Click "Add Images"
- **Reorder**: Drag images to change order
- **Remove**: Click × on image
- **Primary**: First image is always primary

## Product Status
- **Active**: Visible on storefront
- **Draft**: Hidden from customers
- **Archived**: Removed from main catalog

## Bulk Operations
Select multiple products to:
- Update prices
- Change status
- Assign categories
- Delete (⚠️ permanent)
        `
      },
      {
        id: 'product-models',
        title: 'Product Models',
        content: `
# Product Models

Models are templates for products with multiple variants (sizes/conditions).

## Creating a Model

1. Navigate to "Models" in sidebar
2. Click "+ New Model"
3. Enter model details:
   - Name (e.g., "Air Jordan 1 High")
   - Brand
   - Release date (optional)
4. Add reference images
5. Save model

## Benefits
- Reusable product information
- Consistent branding
- Faster product creation
- Easier inventory management

## Using Models
When creating a product:
1. Select "From Model"
2. Choose existing model
3. Add size-specific variants
4. Set individual pricing

## Import Images
Use Google Image Search integration:
1. Click "Import Images"
2. Enter search term
3. Select images
4. Confirm import
        `
      }
    ]
  },
  {
    id: 'inventory',
    title: 'Inventory Management',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    roles: ['owner', 'admin', 'staff'],
    subsections: [
      {
        id: 'stock-tracking',
        title: 'Stock Tracking',
        content: `
# Stock Tracking

## Understanding Stock Status

### Available Stock
\`\`\`
Available = Total Stock - Reserved
\`\`\`

- **Total Stock**: Physical inventory count
- **Reserved**: Items in pending checkouts
- **Available**: Ready to sell

## Stock Indicators
- 🟢 **In Stock**: Available > 0
- 🟡 **Low Stock**: Available 1-3
- 🔴 **Out of Stock**: Available = 0
- ⚪ **Reserved**: In checkout process

## Automatic Reservation
When a customer adds to cart:
1. Stock is reserved for 15 minutes
2. If checkout completes → stock decremented
3. If timeout → reservation released
4. Prevents overselling

## Viewing Stock
- **Inventory Page**: See all stock levels
- **Product Page**: Per-variant stock
- **Reports**: Stock value & turnover
        `
      },
      {
        id: 'adjust-inventory',
        title: 'Adjusting Inventory',
        content: `
# Adjusting Inventory

## Manual Stock Adjustments

![Inventory Overview](help/inventory/inventory-overview.png)
*The inventory management page showing stock levels*

### Steps:
1. Navigate to Inventory
2. Find the variant
3. Click "Adjust Stock"

![Adjust Inventory Modal](help/inventory/adjust-inventory-modal.png)
*The inventory adjustment dialog*

4. Enter adjustment:
   - **Restock**: Add quantity (e.g., +10)
   - **Remove**: Subtract quantity (e.g., -5)
   - **Set Exact**: Enter total count
5. Add reason (required for audit trail)
6. Click "Save"

## Adjustment Reasons
- **Restock**: New inventory received
- **Damage**: Items damaged/unsellable
- **Theft**: Lost inventory
- **Return**: Customer return restocked
- **Correction**: Fixing count error
- **Sale (Other)**: Sold outside platform

## Bulk Adjustments
For multiple SKUs:

![CSV Import](help/inventory/csv-import.png)

1. Upload CSV file
2. Format: SKU, Adjustment, Reason
3. Review changes
4. Confirm import

## Audit Trail
All adjustments logged with:
- Who made the change
- When it occurred
- Before/after quantities
- Reason provided
        `,
        images: [
          {
            src: 'help/inventory/inventory-overview.png',
            alt: 'Inventory management page',
            caption: 'View all product variants and their stock levels'
          },
          {
            src: 'help/inventory/adjust-inventory-modal.png',
            alt: 'Inventory adjustment dialog',
            caption: 'Enter quantity change and reason for adjustment'
          },
          {
            src: 'help/inventory/csv-import.png',
            alt: 'CSV bulk import',
            caption: 'Import multiple inventory adjustments at once'
          }
        ]
      },
      {
        id: 'intake-process',
        title: 'Inventory Intake',
        content: `
# Inventory Intake

Streamlined process for adding new inventory.

## Quick Intake Flow

1. **Start Intake**
   - Navigate to Inventory → Intake
   - Choose intake method:
     - Manual entry
     - CSV upload
     - Photo scan

2. **Capture Details**
   - Take photos or upload
   - Enter SKU (or generate)
   - Record condition
   - Note price
   - Set quantity

3. **Verification**
   - Review all entries
   - Verify photos are clear
   - Confirm pricing
   - Check for duplicates

4. **Submit**
   - Click "Process Intake"
   - Inventory added to system
   - Products created/updated
   - Stock levels adjusted

## Photo Intake
1. Take clear photos of items
2. Upload screenshots
3. System extracts details
4. Verify and adjust
5. Confirm intake

## CSV Import
Format:
\`\`\`csv
SKU,Brand,Model,Size,Condition,Price,Stock
AJ1-BLK-10,Nike,Air Jordan 1,10,VNDS,15000,1
\`\`\`

## Best Practices
- Consistent SKU format
- Clear, well-lit photos
- Accurate condition grading
- Competitive pricing
- Immediate intake (don't batch)
        `
      }
    ]
  },
  {
    id: 'orders',
    title: 'Order Management',
    icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
    roles: ['owner', 'admin', 'staff'],
    subsections: [
      {
        id: 'order-lifecycle',
        title: 'Order Lifecycle',
        content: `
# Order Lifecycle

## Order Statuses

### 1. Pending
- Order created, payment processing
- Stock reserved
- **Action**: Monitor for payment confirmation

### 2. Paid
- Payment confirmed
- Ready to fulfill
- **Action**: Start fulfillment process

### 3. Fulfilled
- Items prepared for shipping
- Packed and ready
- **Action**: Generate shipping label & ship

### 4. Shipped
- Package handed to carrier
- Tracking number assigned
- **Action**: Monitor delivery

### 5. Completed
- Customer received order
- Transaction complete
- **Action**: None (system auto-completes)

## Special Statuses
- **Cancelled**: Order cancelled before fulfillment
- **Refunded**: Payment reversed

## Timeline
- Pending → Paid: Instant (Stripe) or hours (crypto)
- Paid → Fulfilled: 1-2 business days
- Fulfilled → Shipped: Same day
- Shipped → Delivered: 2-7 days (method dependent)
        `
      },
      {
        id: 'fulfillment',
        title: 'Order Fulfillment',
        content: `
# Order Fulfillment

## Fulfillment Process

### Step 1: View Order

![Orders List](help/orders/orders-list.png)
*Filter orders by "Paid" status to see orders ready for fulfillment*

1. Go to Orders → Filter by "Paid"
2. Click order to view details

![Order Detail](help/orders/order-detail.png)
*Review order items and shipping address*

3. Review items and shipping address

### Step 2: Prepare Items
1. Pull items from inventory
2. Verify SKU matches order
3. Check condition
4. Package securely

### Step 3: Mark Fulfilled

![Fulfillment Button](help/orders/fulfillment-button.png)
*Click the "Mark as Fulfilled" button when items are packed*

1. Click "Mark as Fulfilled" button
2. Confirm items are packed
3. System updates status
4. Triggers notification to customer

### Step 4: Ship Order

![Shipping Label](help/orders/shipping-label.png)
*Enter tracking information when shipping*

1. Generate shipping label
2. Attach to package
3. Hand to carrier
4. Click "Mark as Shipped"
5. Enter tracking number
6. Customer receives tracking email

## Shipping Methods
- **Local Delivery**: Internal routing system
- **Pickup**: Customer collects in-store
- **Standard Shipping**: 5-7 business days
- **Express Shipping**: 2-3 business days
- **Overnight**: Next business day

## Packing Tips
- Use appropriate box size
- Bubble wrap fragile items
- Include packing slip
- Seal securely
- Attach "Fragile" label if needed
        `,
        images: [
          {
            src: 'help/orders/orders-list.png',
            alt: 'Orders list filtered by Paid status',
            caption: 'View all orders ready for fulfillment'
          },
          {
            src: 'help/orders/order-detail.png',
            alt: 'Order detail page',
            caption: 'Review order items and customer information'
          },
          {
            src: 'help/orders/fulfillment-button.png',
            alt: 'Mark as Fulfilled button',
            caption: 'Click to mark order as fulfilled'
          },
          {
            src: 'help/orders/shipping-label.png',
            alt: 'Enter tracking number',
            caption: 'Add tracking information when shipping'
          }
        ]
      },
      {
        id: 'returns',
        title: 'Returns & Refunds',
        content: `
# Returns & Refunds

## Return Process

### Customer Initiates Return
1. Customer requests return
2. Review request in Returns section
3. Approve or deny with reason
4. System emails return label (if approved)

### Receiving Returns
1. Customer ships item back
2. Item arrives at your location
3. Inspect condition
4. Update return status:
   - **Approved**: Item acceptable
   - **Rejected**: Not as expected
   - **Partial**: Partial refund

### Processing Refund
1. Click "Process Refund"
2. Enter refund amount
3. Add reason/notes
4. Confirm refund
5. Stripe processes in 5-10 days

## Return Reasons
- Changed mind
- Wrong size
- Item not as described
- Damaged in shipping
- Defective product

## Restocking
If item approved:
1. Inspect carefully
2. Update condition if needed
3. Click "Restock Item"
4. Inventory automatically adjusted
5. Product relisted

## Refund Policy Tips
- Clear return window (e.g., 30 days)
- Condition requirements
- Return shipping responsibility
- Restocking fees (if any)
- Non-returnable items (final sale)
        `
      }
    ]
  },
  {
    id: 'messages',
    title: 'Customer Messages',
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    roles: ['owner', 'admin', 'staff'],
    subsections: [
      {
        id: 'messaging-overview',
        title: 'Messaging Overview',
        content: `
# Customer Messages

![Messages Inbox](help/messages/messages-inbox.png)
*The messages inbox showing customer conversations*

## Message Types

### Customer Support
- Order inquiries
- Product questions
- Shipping updates
- Issue resolution

### Group Chats
- Order-specific threads
- Multiple participants
- Order context visible

## Eligibility
Customers can message if they have:
- Active order (pending/paid/shipped)
- Recent order (within 90 days)
- Order history with your store

## Response Times
- **Target**: < 2 hours during business hours
- **Maximum**: 24 hours
- **After hours**: Next business day

## Best Practices
- Professional, friendly tone
- Quick responses
- Clear, concise answers
- Follow up on issues
- Close conversations when resolved
        `,
        images: [
          {
            src: 'help/messages/messages-inbox.png',
            alt: 'Messages inbox with customer conversations',
            caption: 'View and manage all customer messages'
          }
        ]
      },
      {
        id: 'message-privacy',
        title: 'Message Privacy & Encryption',
        content: `
# Message Privacy & Encryption

## End-to-End Encryption (E2E)

If your tenant has E2E enabled:
- Customer messages encrypted client-side
- Only customer can decrypt
- You see encrypted content in database
- Customer sees decrypted in their browser

### Implications
- Cannot read E2E messages in admin panel
- Cannot search encrypted content
- Enhanced privacy for customers
- Customer responsible for key management

## Standard Messages
Without E2E:
- Messages stored in plain text
- Fully searchable
- Visible in admin panel
- Standard privacy protection

## Data Retention
- Active conversations: Indefinite
- Resolved conversations: As configured
- Guest messages: 90 days (default)
- Deletions: User can request

## Privacy Settings
Customers can:
- Export their messages
- Delete message history
- Disable messaging
- Control retention period
        `
      },
      {
        id: 'handling-messages',
        title: 'Handling Messages',
        content: `
# Handling Messages

## Responding to Messages

### 1. Access Messages
![Messages Sidebar](help/messages/messages-inbox.png)

- Click "Messages" in sidebar
- See list of conversations
- Unread count shown

### 2. View Conversation
![Conversation View](help/messages/conversation-view.png)
*View full message history and order context*

- Click customer name
- See full message history
- Order details shown (if applicable)

### 3. Send Reply
![Send Message](help/messages/send-message.png)

- Type in message box
- Click Send or press Enter
- Customer receives notification

### 4. Add Attachments
- Click attachment icon
- Select file (images, PDFs)
- Max 10MB per file
- Confirm upload

## Message Actions
- **Archive**: Hide from inbox
- **Mark Unread**: Flag for follow-up
- **Block**: Prevent spam (rare)
- **Export**: Download conversation

## Templates (Coming Soon)
Save common responses:
- Shipping updates
- Return instructions
- Product care guides
- Sizing information

## Escalation
For complex issues:
1. Note details in conversation
2. Escalate to owner/admin
3. Tag with priority level
4. Follow up within 24 hours
        `,
        images: [
          {
            src: 'help/messages/conversation-view.png',
            alt: 'Conversation view with message history',
            caption: 'View full conversation thread with customer'
          },
          {
            src: 'help/messages/send-message.png',
            alt: 'Send message interface',
            caption: 'Type and send messages to customers'
          }
        ]
      }
    ]
  },
  {
    id: 'analytics',
    title: 'Reports & Analytics',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    roles: ['owner', 'admin'],
    subsections: [
      {
        id: 'sales-reports',
        title: 'Sales Reports',
        content: `
# Sales Reports

![Sales Report Dashboard](help/analytics/sales-report.png)
*Overview of sales metrics and performance*

## Key Metrics

### Revenue
- **Total Sales**: Sum of all paid orders
- **Average Order Value**: Revenue ÷ Orders
- **Sales by Period**: Daily, weekly, monthly
- **Year over Year**: Compare to previous period

### Units
- **Items Sold**: Total quantity sold
- **Best Sellers**: Top products by units
- **Sell-Through Rate**: Sold ÷ (Sold + Stock)

### Customers
- **New Customers**: First-time buyers
- **Returning Customers**: Repeat buyers
- **Customer Lifetime Value**: Avg spend per customer

## Generating Reports

![Generate Report](help/analytics/generate-report.png)
*Report generation interface with filters and date range*

1. Go to Reports section
2. Select report type
3. Choose date range
4. Apply filters (category, brand, etc.)
5. Click "Generate Report"

![Export Report](help/analytics/export-report.png)

6. View or export (CSV/PDF)

## Report Types
- **Sales Summary**: High-level overview
- **Product Performance**: Per-SKU breakdown
- **Customer Analytics**: Buyer behavior
- **Inventory Valuation**: Stock value
- **Tax Report**: Sales tax collected

## Exporting
- **CSV**: Import into Excel/Sheets
- **PDF**: Print or email
- **Email**: Schedule automatic reports
        `,
        images: [
          {
            src: 'help/analytics/sales-report.png',
            alt: 'Sales report dashboard',
            caption: 'View key sales metrics and trends'
          },
          {
            src: 'help/analytics/generate-report.png',
            alt: 'Report generation form',
            caption: 'Select report type and filters'
          },
          {
            src: 'help/analytics/export-report.png',
            alt: 'Export report options',
            caption: 'Download reports in CSV or PDF format'
          }
        ]
      },
      {
        id: 'inventory-analytics',
        title: 'Inventory Analytics',
        content: `
# Inventory Analytics

## Stock Metrics

### Current State
- **Total Stock**: All inventory
- **Available Stock**: Ready to sell
- **Reserved Stock**: In checkouts
- **Stock Value**: Cost × Quantity

### Movement
- **Turnover Rate**: Sales ÷ Avg Inventory
- **Days to Sell**: Avg days in stock
- **Slow Movers**: Items > 90 days
- **Fast Movers**: Items < 7 days to sell

### Alerts
- **Low Stock**: Below threshold
- **Out of Stock**: Zero available
- **Overstock**: Excess inventory
- **Dead Stock**: No sales > 180 days

## Inventory Reports

### Stock Valuation
Current value of all inventory:
\`\`\`
Total Value = Σ (Price × Stock)
\`\`\`

### Aging Report
See how long items have been in stock:
- 0-30 days: Fresh
- 31-60 days: Good
- 61-90 days: Aging
- 90+ days: Consider discounting

### Restock Recommendations
System suggests reorders based on:
- Sales velocity
- Current stock
- Lead time
- Seasonality

## Using Analytics
1. Identify slow movers → mark down
2. Identify fast sellers → reorder
3. Calculate ideal stock levels
4. Optimize inventory investment
        `
      },
      {
        id: 'customer-insights',
        title: 'Customer Insights',
        content: `
# Customer Insights

## Customer Metrics

### Acquisition
- **New Customers**: First purchase
- **Acquisition Cost**: Marketing ÷ New Customers
- **Channels**: Where customers found you

### Retention
- **Repeat Rate**: % who purchase again
- **Churn Rate**: % who don't return
- **Average Frequency**: Purchases per customer

### Value
- **Lifetime Value (LTV)**: Total customer spend
- **Average Order Value (AOV)**: Spend per order
- **Customer Segments**: High/med/low value

## Customer Reports

### Top Customers
See your best customers:
- Sorted by total spend
- Number of orders
- Average order value
- Last purchase date

### Purchase Patterns
Understand buying behavior:
- Preferred categories
- Brand preferences
- Price sensitivity
- Seasonal trends

### Geographic Distribution
Where customers are located:
- By country/state/city
- Shipping preferences
- Local pickup adoption

## Segmentation
Group customers by:
- **VIP**: High lifetime value
- **Loyal**: Frequent purchases
- **At Risk**: Haven't purchased recently
- **New**: First purchase
- **One-Time**: Single purchase

## Engagement
- Email open rates
- Click-through rates
- Message response times
- Product view patterns
        `
      }
    ]
  },
  {
    id: 'settings',
    title: 'Settings & Configuration',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    roles: ['owner', 'admin'],
    subsections: [
      {
        id: 'tenant-settings',
        title: 'Tenant Settings',
        content: `
# Tenant Settings

![Tenant Settings Page](help/settings/tenant-settings.png)
*Configure your store's branding and information*

## Branding

### Store Name
- Appears in navigation
- Email notifications
- Customer receipts
- SEO/meta tags

### Logo
![Logo Upload](help/settings/logo-upload.png)

- Upload custom logo
- Recommended: 200x60px
- PNG with transparency
- Used in header & emails

### Colors
![Theme Colors](help/settings/theme-colors.png)
*Customize your store's color scheme*

Customize your store theme:
- Primary background
- Secondary background
- Text colors
- Accent/button colors
- Border colors

## Store Information
- Business name
- Contact email
- Support phone
- Business address
- Social media links

## Legal
- Privacy policy URL
- Terms of service URL
- Return policy
- Shipping policy

## Domains
- Primary domain
- Custom domains
- SSL certificates
- DNS configuration
        `,
        images: [
          {
            src: 'help/settings/tenant-settings.png',
            alt: 'Tenant settings page',
            caption: 'Configure store branding and information'
          },
          {
            src: 'help/settings/logo-upload.png',
            alt: 'Logo upload interface',
            caption: 'Upload your store logo'
          },
          {
            src: 'help/settings/theme-colors.png',
            alt: 'Theme color customization',
            caption: 'Customize your store colors'
          }
        ]
      },
      {
        id: 'feature-flags',
        title: 'Feature Flags',
        content: `
# Feature Flags

Enable or disable features for your store.

![Feature Flags](help/settings/feature-flags.png)
*Enable or disable features with toggle switches*

## Available Features

### Product Drops
- Scheduled product releases
- Countdown timers
- Drop alerts for customers
- Limited-time availability

### Wishlist
- Customer wishlists
- Stock alerts
- Price drop notifications
- Saved for later

### Customer Messages
- Direct messaging
- Order inquiries
- Support tickets
- Automated responses

### E2E Encryption
![Encryption Settings](help/settings/encryption-settings.png)

- End-to-end encrypted messages
- Enhanced privacy
- Customer key management
- Secure communications

### Crypto Payments
- Bitcoin, Ethereum, etc.
- NOWPayments integration
- Automatic conversion
- Lower fees

### Local Delivery
- In-house delivery
- Route optimization
- Real-time tracking
- Custom zones/pricing

### In-Store Pickup
- Click & collect
- Ready-for-pickup notifications
- Location selection
- Zero shipping cost

### Consignments
- Consignor management
- Payout tracking
- Commission splits
- Inventory tracking

## Toggling Features
1. Go to Tenant Settings
2. Click "Features" tab
3. Toggle features on/off
4. Changes apply immediately
        `,
        images: [
          {
            src: 'help/settings/feature-flags.png',
            alt: 'Feature flags toggles',
            caption: 'Enable or disable features for your store'
          },
          {
            src: 'help/settings/encryption-settings.png',
            alt: 'E2E encryption settings',
            caption: 'Configure end-to-end encryption for messages'
          }
        ]
      },
      {
        id: 'payment-settings',
        title: 'Payment Settings',
        content: `
# Payment Settings

## Stripe Configuration
Primary payment processor.

### Setup
1. Create Stripe account
2. Get API keys (Dashboard → Developers)
3. Add keys to environment:
   - Publishable key
   - Secret key
   - Webhook secret
4. Test with test mode first

### Supported Methods
- Credit/debit cards
- Apple Pay
- Google Pay
- Link (Stripe)

## Crypto Payments
Optional crypto checkout.

### Setup (NOWPayments)
1. Create NOWPayments account
2. Get API key
3. Set IPN secret
4. Configure accepted coins
5. Enable in features

### Supported Coins
- Bitcoin (BTC)
- Ethereum (ETH)
- Litecoin (LTC)
- USDT, USDC
- And 100+ more

## Tax Settings
- Tax rate by region
- Tax-inclusive pricing
- Exemptions
- Tax ID collection
- Reporting integration
        `
      },
      {
        id: 'shipping-settings',
        title: 'Shipping Settings',
        content: `
# Shipping Settings

## Shipping Methods

### Standard Shipping
- Cost: $5-15
- Time: 5-7 business days
- Carrier: USPS/FedEx
- Tracking included

### Express Shipping
- Cost: $20-30
- Time: 2-3 business days
- Carrier: FedEx/UPS
- Signature optional

### Overnight
- Cost: $40-60
- Time: Next business day
- Carrier: FedEx/UPS
- Signature required

### Local Delivery
- Custom zones
- Distance-based pricing
- Same-day option
- In-house drivers

### In-Store Pickup
- Free
- Instant availability
- Location selection
- Ready notifications

## Rate Configuration

### Flat Rate
Fixed price per order:
- Simple
- Predictable
- Easy to understand

### Weight-Based
Price by weight:
- More accurate
- Fair for heavy items
- Requires product weights

### Zone-Based
Price by destination:
- Regional pricing
- International rates
- Custom zones

## Delivery Zones
For local delivery:
1. Define geographic zones
2. Set pricing per zone
3. Configure delivery days
4. Set minimum order
5. Enable/disable zones
        `
      },
      {
        id: 'user-management',
        title: 'User & Team Management',
        content: `
# User & Team Management

## User Roles

### Owner
- Full access to everything
- Billing & subscription
- User management
- Dangerous operations

### Admin
- Full operational access
- Product management
- Order processing
- Reports & analytics
- Cannot modify billing

### Staff
- Limited access
- Inventory management
- Order fulfillment
- Customer messages
- No settings/reports

### Customer
- Public access
- Shopping
- Order tracking
- Account management

## Inviting Team Members

1. Go to Settings → Users
2. Click "Invite User"
3. Enter email
4. Select role
5. Send invitation
6. They receive email to join

## Managing Users
- View all team members
- Change roles
- Deactivate access
- View activity logs
- Reset passwords

## Permissions Matrix
| Feature | Owner | Admin | Staff |
|---------|-------|-------|-------|
| Products | ✅ | ✅ | ❌ |
| Inventory | ✅ | ✅ | ✅ |
| Orders | ✅ | ✅ | ✅ |
| Messages | ✅ | ✅ | ✅ |
| Reports | ✅ | ✅ | ❌ |
| Settings | ✅ | ✅ | ❌ |
| Billing | ✅ | ❌ | ❌ |
| Users | ✅ | ✅ | ❌ |
        `
      }
    ]
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z',
    roles: ['owner', 'admin', 'staff'],
    subsections: [
      {
        id: 'common-issues',
        title: 'Common Issues',
        content: `
# Common Issues & Solutions

## Products Not Showing
**Problem**: Products created but not visible on storefront.

![Product Not Showing](help/troubleshooting/product-not-showing.png)
*Check product status and stock levels*

**Solutions**:
1. Check product status is "Active"
2. Verify at least one variant exists
3. Ensure stock > 0
4. Check category/filters
5. Refresh storefront

## Orders Stuck in Pending
**Problem**: Order payment not confirming.

![Order Stuck](help/troubleshooting/order-stuck-pending.png)
*Orders showing pending status for extended time*

**Solutions**:
1. Check Stripe dashboard for payment status
2. Verify webhook is configured
3. For crypto: Check NOWPayments status
4. Wait 15 min for blockchain confirmation
5. Contact customer if >1 hour

## Images Not Uploading
**Problem**: Cannot upload product images.

![Upload Error](help/troubleshooting/image-upload-error.png)

**Solutions**:
1. Check file size < 10MB
2. Use JPG, PNG, or WebP format
3. Clear browser cache
4. Try different browser
5. Check internet connection

## Stock Not Updating
**Problem**: Stock changes not reflecting.

![Stock Not Updating](help/troubleshooting/stock-not-updating.png)
*Stock levels not changing after adjustment*

**Solutions**:
1. Refresh page
2. Check if order is still in cart
3. Verify adjustment was saved
4. Check inventory audit log
5. Look for reserved stock

## Messages Not Sending
**Problem**: Customer messages not delivering.

**Solutions**:
1. Check internet connection
2. Verify customer is eligible (has order)
3. Refresh messages page
4. Check for error message
5. Try different browser

## Report Not Generating
**Problem**: Report generation fails or times out.

**Solutions**:
1. Reduce date range
2. Remove complex filters
3. Try exporting smaller dataset
4. Wait and retry
5. Check during off-peak hours
        `,
        images: [
          {
            src: 'help/troubleshooting/product-not-showing.png',
            alt: 'Product visibility troubleshooting',
            caption: 'Verify product is active and has stock'
          },
          {
            src: 'help/troubleshooting/order-stuck-pending.png',
            alt: 'Order stuck in pending status',
            caption: 'Check payment status in Stripe dashboard'
          },
          {
            src: 'help/troubleshooting/stock-not-updating.png',
            alt: 'Stock level not updating',
            caption: 'Check inventory audit log for adjustments'
          }
        ]
      },
      {
        id: 'performance-tips',
        title: 'Performance Tips',
        content: `
# Performance Tips

## Speed Optimization

### Image Optimization
- Use WebP format when possible
- Compress before upload
- Recommended: 1000x1000px max
- Remove metadata
- Use CDN (automatic)

### Product Catalog
- Limit to 1000 active products
- Archive old/sold items
- Use pagination effectively
- Search instead of scrolling

### Dashboard Loading
- Close unused tabs
- Clear browser cache monthly
- Use modern browser
- Disable unnecessary extensions

## Best Practices

### Inventory
- Update stock in batches
- Use CSV for bulk updates
- Schedule intake during off-hours
- Archive old products

### Orders
- Fulfill orders promptly
- Archive completed orders > 90 days
- Use filters to find orders
- Export old data periodically

### Messages
- Archive resolved conversations
- Set retention policies
- Export old messages
- Delete unnecessary attachments

### Reports
- Schedule during off-peak
- Export and save locally
- Use specific date ranges
- Filter before generating
        `
      },
      {
        id: 'getting-help',
        title: 'Getting Help',
        content: `
# Getting Help

## Support Channels

### In-App Help
- Click "?" icon in any section
- Context-specific guidance
- Search help articles
- Quick reference

### Documentation
- Complete user manual
- Step-by-step guides
- Video tutorials
- Best practices

### Email Support
- support@709exclusive.com
- Response: < 24 hours
- Include screenshots
- Describe issue clearly

### Priority Support
- Owner/admin plans
- Direct Slack/Discord
- Screen sharing available
- Response: < 2 hours

## Before Contacting Support

1. **Check Help Section**
   - Search for your issue
   - Review related articles
   - Try suggested solutions

2. **Gather Information**
   - What were you trying to do?
   - What happened instead?
   - Error messages?
   - Screenshots/videos

3. **Try Basic Troubleshooting**
   - Refresh page
   - Clear cache
   - Different browser
   - Check internet connection

4. **Check Status Page**
   - Platform status
   - Known issues
   - Scheduled maintenance
   - Recent updates

## Reporting Bugs
Include:
- Steps to reproduce
- Expected vs actual behavior
- Browser & OS version
- Screenshots/screen recording
- Error messages (if any)
        `
      }
    ]
  }
]

export function getHelpForRole(role: string): HelpSection[] {
  return helpSections.filter(section => 
    section.roles.includes(role as any)
  )
}

export function searchHelp(query: string, role: string): Array<{
  sectionId: string
  sectionTitle: string
  subsectionId: string
  subsectionTitle: string
  excerpt: string
}> {
  const results: Array<{
    sectionId: string
    sectionTitle: string
    subsectionId: string
    subsectionTitle: string
    excerpt: string
  }> = []
  
  const normalizedQuery = query.toLowerCase()
  const availableSections = getHelpForRole(role)
  
  for (const section of availableSections) {
    for (const subsection of section.subsections) {
      const titleMatch = subsection.title.toLowerCase().includes(normalizedQuery)
      const contentMatch = subsection.content.toLowerCase().includes(normalizedQuery)
      
      if (titleMatch || contentMatch) {
        // Extract excerpt around the match
        let excerpt = ''
        if (titleMatch) {
          excerpt = subsection.content.substring(0, 150)
        } else {
          const index = subsection.content.toLowerCase().indexOf(normalizedQuery)
          const start = Math.max(0, index - 75)
          excerpt = '...' + subsection.content.substring(start, start + 150) + '...'
        }
        
        results.push({
          sectionId: section.id,
          sectionTitle: section.title,
          subsectionId: subsection.id,
          subsectionTitle: subsection.title,
          excerpt: excerpt.trim()
        })
      }
    }
  }
  
  return results
}
