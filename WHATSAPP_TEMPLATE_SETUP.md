# WhatsApp Business Template Setup Guide

## 📋 Template Configuration

أنت محتاج تنشئ **Template** في WhatsApp Business Manager بالتفاصيل التالية:

### Template Information
- **Template Name**: `order_confirmation`
- **Category**: `TRANSACTIONAL`
- **Language**: `English (en)`

### Template Structure

#### 1. **Header** (اختياري)
```
📦 Order Confirmation
```

#### 2. **Body** (النص الأساسي)
```
Hi {{1}}, thanks for your order. 😊

Order No: # {{2}}
Amount : Dh {{3}}
Payment Method : {{4}}

We've received your order and are preparing it for shipment. We'll notify you when it's on its way!

Team {{5}}
```

#### 3. **Footer** (اختياري)
```
Natural Spices - Fresh & Quality Guaranteed
```

#### 4. **Button** (Call-to-Action)
- **Type**: `URL`
- **Text**: `📥 Download Invoice`
- **URL**: `https://naturalspices.ae/invoice/{{1}}`

### Template Parameters

الـ Template يستخدم 5 parameters:

1. `{{1}}` = Customer Name (اسم العميل)
2. `{{2}}` = Order Number (رقم الطلب)
3. `{{3}}` = Order Amount (قيمة الطلب)
4. `{{4}}` = Payment Method (طريقة الدفع)
5. `{{5}}` = Store Name (اسم المتجر)

## 🚀 Implementation Steps

### Step 1: Create Template in Meta Business Manager

1. اذهب إلى [Meta Business Manager](https://business.facebook.com)
2. اختر WhatsApp Business Account
3. اذهب إلى **Account Tools** → **Templates**
4. اضغط **Create Template**

### Step 2: Fill Template Details

**Template Name**: `order_confirmation`
**Category**: `TRANSACTIONAL`
**Language**: `English`

### Step 3: Add Template Content

**Header**: 
```
📦 Order Confirmation
```

**Body**:
```
Hi {{1}}, thanks for your order. 😊

Order No: # {{2}}
Amount : Dh {{3}}
Payment Method : {{4}}

We've received your order and are preparing it for shipment. We'll notify you when it's on its way!

Team {{5}}
```

**Footer**:
```
Natural Spices - Fresh & Quality Guaranteed
```

**Button**:
- Type: URL
- Text: 📥 Download Invoice
- URL: https://naturalspices.ae/invoice/{{1}}

### Step 4: Submit for Approval

- اضغط **Submit**
- انتظر الموافقة من Meta (عادة 24-48 ساعة)

## 🔧 Code Configuration

بعد الموافقة على الـ Template، تأكد من:

### Environment Variables

أضف المتغيرات التالية لملف `.env.local`:

```env
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id_here
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token_here
WHATSAPP_API_VERSION=v18.0
WHATSAPP_ENABLED=true
```

### Template Usage in Code

الكود جاهز ويستخدم الـ Template بالشكل التالي:

```typescript
// في utils/whatsapp.ts
const templateName = 'order_confirmation';
const components = [
  {
    type: 'body',
    parameters: [
      { type: 'text', text: customerName },    // {{1}}
      { type: 'text', text: orderNumber },     // {{2}}
      { type: 'text', text: orderAmount },     // {{3}}
      { type: 'text', text: paymentMethod },   // {{4}}
      { type: 'text', text: 'Natural Spices' } // {{5}}
    ]
  },
  {
    type: 'button',
    sub_type: 'url',
    index: 0,
    parameters: [
      { type: 'text', text: invoiceUrl }       // Button URL parameter
    ]
  }
];
```

## 🧪 Testing

### Test Template

بعد الموافقة، يمكنك اختبار الـ Template:

```javascript
// في Browser Console
fetch('/api/whatsapp/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'template',
    phoneNumber: '+971xxxxxxxxx',
    templateName: 'order_confirmation',
    languageCode: 'en',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: 'Ahmed Ali' },
          { type: 'text', text: 'N-AE-12345' },
          { type: 'text', text: '150.00' },
          { type: 'text', text: 'By Card' },
          { type: 'text', text: 'Natural Spices' }
        ]
      }
    ]
  })
});
```

## ⚠️ Important Notes

### Template Guidelines

1. **لا تغير النص** بعد الموافقة - أي تغيير يحتاج موافقة جديدة
2. **Parameters only** - يمكن تغيير القيم في المتغيرات فقط
3. **24-hour window** - يمكن إرسال template messages خلال 24 ساعة من آخر رسالة من العميل
4. **Business messages** - Template messages للأعمال التجارية فقط

### Fallback Options

إذا لم يتم الموافقة على الـ Template:

1. **Session messages**: إرسال رسائل text عادية (خلال 24 ساعة من آخر رسالة)
2. **Manual follow-up**: متابعة يدوية مع العملاء

## 📱 Expected Output

عند إكمال الطلب، العميل سيحصل على رسالة:

```
📦 Order Confirmation

Hi Ahmed Ali, thanks for your order. 😊

Order No: # N-AE-12345
Amount : Dh 150.00
Payment Method : By Card

We've received your order and are preparing it for shipment. We'll notify you when it's on its way!

Team Natural Spices

📥 Download Invoice

Natural Spices - Fresh & Quality Guaranteed
```

## 🔗 Useful Links

- [WhatsApp Business API Templates](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates)
- [Meta Business Manager](https://business.facebook.com)
- [Template Guidelines](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/guidelines)

---

✅ **Setup Complete**: بعد إنشاء الـ Template والموافقة عليه، سيتم إرسال رسائل WhatsApp تلقائياً لكل طلب جديد!
