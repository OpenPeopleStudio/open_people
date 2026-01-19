/**
 * Default policy content with placeholders for tenant customization
 * 
 * Available placeholders:
 * - {{brand_name}} - Store brand name
 * - {{support_email}} - Support email address
 * - {{ship_from_city}} - Shipping origin city
 * - {{ship_from_region}} - Shipping origin state/province
 * - {{ship_from_country}} - Shipping origin country
 * - {{product_term}} - Singular product term (e.g., "product", "item")
 * - {{products_term}} - Plural product term (e.g., "products", "items")
 */

export const DEFAULT_SHIPPING_POLICY = `## Shipping Information

We ship all orders from **{{ship_from_city}}{{ship_from_region}}{{ship_from_country}}**.

### Shipping Methods

We offer multiple shipping options to fit your needs:

- **Standard Shipping** - 5-7 business days
- **Express Shipping** - 2-3 business days  
- **Priority Shipping** - 1-2 business days

### Shipping Costs

Shipping costs are calculated at checkout based on your location and selected shipping method.

**Free shipping** is available on qualifying orders - check our current promotions!

### Local Delivery

If you're located in our local delivery area, you may be eligible for:

- Same-day or next-day delivery
- Reduced shipping costs
- Flexible delivery windows

### Local Pickup

Want to save on shipping? Select **Local Pickup** at checkout:

- We'll notify you when your order is ready
- Bring valid ID matching your order name
- Pickup instructions provided in confirmation email

### Order Processing

- Orders are typically processed within 1-2 business days
- You'll receive tracking information once your order ships
- Delivery times are estimates from ship date, not order date

### Questions?

Contact us at **{{support_email}}** for any shipping inquiries.
`

export const DEFAULT_RETURNS_POLICY = `## Returns & Exchanges Policy

At **{{brand_name}}**, we want you to be completely satisfied with your purchase.

### Return Eligibility

**We Accept Returns When:**

- Item condition doesn't match the listing description
- Item has undisclosed defects
- Wrong item or size was shipped
- Item is determined to be inauthentic

**Returns Not Accepted:**

- Change of mind or fit preference
- Items worn, washed, or damaged after delivery
- Items without original tags (for new items)
- Returns requested after 7 days

### Return Process

- **Step 1:** Contact us at {{support_email}} within 7 days of delivery
- **Step 2:** Include your order number and reason for return
- **Step 3:** We'll review and provide return instructions if approved
- **Step 4:** Ship the item back in original packaging
- **Step 5:** Refund issued within 3-5 business days of receiving the return

### Refund Details

- Refunds are issued to the original payment method
- Original shipping costs are non-refundable (unless we made an error)
- Return shipping is provided for items that don't match description

### Exchanges

We process exchanges as a return + new order. Contact us to coordinate.

### Questions?

Email **{{support_email}}** for return inquiries. We respond within 24 hours.
`

export const DEFAULT_AUTHENTICITY_POLICY = `## Authenticity Guarantee

Every {{product_term}} sold on **{{brand_name}}** is guaranteed to be 100% authentic.

### Our Commitment

If any item is ever determined to be inauthentic, we will provide a **full refund** plus pay for return shipping. No questions asked.

### Our Verification Process

**Multi-Point Inspection**
Every item undergoes detailed inspection checking materials, construction, labels, and brand-specific authentication markers.

**Detailed Photography**
We photograph all authentication points. You see exactly what you're getting.

**Expert Review**
Our team has extensive experience identifying authentic {{products_term}} across all major brands.

**Source Verification**
We only source from trusted suppliers with established track records.

### What We Check

- Material quality and feel
- Construction and stitching
- Label and tag details
- Brand-specific markers
- Packaging authenticity

### Our Guarantee

We stand behind every {{product_term}} we sell. If you ever have concerns about authenticity:

- Contact us immediately at {{support_email}}
- We'll review and investigate promptly
- Full refund provided for any authenticity issues

### Questions?

Contact **{{support_email}}** with any authenticity questions.
`

export const DEFAULT_PRIVACY_POLICY = `## Privacy Policy

**{{brand_name}}** respects your privacy and is committed to protecting your personal data.

### Information We Collect

**Personal Information:**
- Name and contact details
- Shipping and billing addresses
- Payment information (processed securely)
- Order history

**Automatically Collected:**
- Device and browser information
- IP address and location data
- Site usage and preferences

### How We Use Your Information

- Process and fulfill orders
- Send order updates and shipping notifications
- Provide customer support
- Improve our products and services
- Send marketing communications (with your consent)

### Information Sharing

We do not sell your personal information. We share data only with:

- Payment processors (to complete transactions)
- Shipping carriers (to deliver orders)
- Service providers (to operate our store)

### Your Rights

You have the right to:

- Access your personal data
- Correct inaccurate data
- Request deletion of your data
- Opt out of marketing communications

### Data Security

We implement appropriate security measures to protect your information, including encryption and secure payment processing.

### Contact Us

For privacy inquiries, contact **{{support_email}}**.
`

export const DEFAULT_TERMS_POLICY = `## Terms of Service

Welcome to **{{brand_name}}**. By using our website and services, you agree to these terms.

### General Terms

- You must be at least 18 years old to make purchases
- You agree to provide accurate information
- We reserve the right to refuse service to anyone
- Prices and availability are subject to change

### Orders and Payment

- All prices are displayed in our store currency
- Payment is required at time of purchase
- We accept major credit cards and other payment methods as displayed
- Orders are subject to acceptance and availability

### Shipping and Delivery

- Shipping times are estimates, not guarantees
- Risk of loss transfers upon delivery to carrier
- Please review our Shipping Policy for full details

### Returns and Refunds

- Returns are subject to our Returns Policy
- Refunds are issued to original payment method
- We reserve the right to refuse returns that don't meet our policy

### Intellectual Property

- All content on this site is owned by {{brand_name}}
- You may not reproduce or distribute our content without permission
- Trademarks and logos are property of their respective owners

### Limitation of Liability

{{brand_name}} is not liable for:

- Indirect or consequential damages
- Loss of profits or data
- Delays beyond our control

### Changes to Terms

We may update these terms at any time. Continued use constitutes acceptance of changes.

### Contact

For questions about these terms, contact **{{support_email}}**.
`
