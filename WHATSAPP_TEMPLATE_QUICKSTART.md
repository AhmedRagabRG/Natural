## WhatsApp Template Quick Setup (Meta)

### 1) Prerequisites
- An active WhatsApp Business account in Meta Business Manager
- A verified phone number (Phone Number ID)
- Permission to create Message Templates

### 2) Create a New Template
1. Go to: Business Settings → WhatsApp Manager → Account tools → Message templates → Create
2. Select:
   - Category: Transactional
   - Language: English (en)
   - Name: order_confirmation
3. Content:
   - Header: optional (e.g., "📦 Order Confirmation")
   - Body (use variables {{1}}…):
```
Hi {{1}}, thanks for your order. 😊

Order No: # {{2}}
Amount : Dh {{3}}
Payment Method : {{4}}

We've received your order and are preparing it for shipment. We'll notify you when it's on its way!

Team {{5}}
```
   - Footer: optional (e.g., "Natural Spices - Fresh & Quality Guaranteed")
   - Buttons → Call To Action → Visit Website:
     - Base URL: https://naturalspicesuae.com/invoice/{{1}}
     - Note: WhatsApp URL buttons support only one dynamic variable {{1}} at the end of the URL.

### 3) Map Variables to Values
- {{1}} = Customer Name
- {{2}} = Order Number (e.g., N-AE-12345)
- {{3}} = Order Amount (e.g., 150.00)
- {{4}} = Payment Method (By Card / Cash on Delivery)
- {{5}} = Store Name (e.g., Natural Spices)
- Button {{1}} in URL = the dynamic suffix you want to append (e.g., invoice-N-AE-12345.pdf or N-AE-12345)

### 4) Submit for Approval
- Click Submit and wait for approval (typically 24–48 hours)

### 5) Test After Approval (from browser)
```javascript
// Sends the order_confirmation template to your phone
fetch('/api/whatsapp/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'template',
    phoneNumber: '+9715XXXXXXXX',
    templateName: 'order_confirmation',
    languageCode: 'en',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: 'Ahmed Ali' },      // {{1}}
          { type: 'text', text: 'N-AE-12345' },     // {{2}}
          { type: 'text', text: '150.00' },         // {{3}}
          { type: 'text', text: 'By Card' },        // {{4}}
          { type: 'text', text: 'Natural Spices' }  // {{5}}
        ]
      },
      {
        type: 'button',
        sub_type: 'url',
        index: 0,
        parameters: [
          { type: 'text', text: 'invoice-N-AE-12345.pdf' } // fills {{1}} at the end of URL
        ]
      }
    ]
  })
});
```

### 6) Code Integration (already implemented)
- Messages are sent automatically after order completion via `sendOrderWhatsApp`.
- File: `src/utils/whatsapp.ts` uses `sendTemplateWhatsAppMessage` with the variables above.

### Important Notes
- URL Button supports only one variable {{1}}. If you need more parts, compose them into a single value.
- Any change to the Body text after approval requires re-approval.
- Template Messages can be sent outside the 24-hour session window; plain Text messages require recent user activity.


