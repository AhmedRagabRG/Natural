import { whatsappConfig, isWhatsAppConfigured, WHATSAPP_API_BASE_URL, WhatsAppMessageType } from '../config/whatsapp';

// WhatsApp message interface
export interface WhatsAppMessage {
  to: string;
  type: WhatsAppMessageType;
  text?: {
    body: string;
    preview_url?: boolean;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: any[];
  };
}

// Order data interface for WhatsApp messages
export interface OrderData {
  orderId: string;
  customerName: string;
  customerPhone: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  address: string;
  paymentMethod: string;
  deliveryCharges?: number;
  discount?: number;
}

// Format phone number for WhatsApp (remove + and ensure UAE format)
export const formatWhatsAppNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // If number starts with 971 (UAE), use as is
  if (cleanNumber.startsWith('971')) {
    return cleanNumber;
  }
  
  if (cleanNumber.startsWith('1') && cleanNumber.length === 10) {
    return `20${cleanNumber}`;
  }

  // If number starts with 201 (Egypt), use as is
  if (cleanNumber.startsWith('201')) {
    return cleanNumber;
  }
  
  // If number starts with 05 (UAE local), convert to international
  if (cleanNumber.startsWith('05')) {
    return `971${cleanNumber.substring(1)}`;
  }
  
  // If number starts with 5 (UAE without 0), add country code
  if (cleanNumber.startsWith('5') && cleanNumber.length === 9) {
    return `971${cleanNumber}`;
  }
  
  // Default: assume UAE and add country code
  return cleanNumber;
};


// Send WhatsApp message using Meta API
export const sendWhatsAppMessage = async (messageData: WhatsAppMessage): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> => {
  try {
    // Check if WhatsApp is configured
    if (!isWhatsAppConfigured()) {
      console.warn('WhatsApp is not configured. Skipping message send.');
      return { success: false, error: 'WhatsApp not configured' };
    }

    // Format the phone number
    const formattedNumber = formatWhatsAppNumber(messageData.to);
    
    console.log(`📱 Sending WhatsApp message to: ${formattedNumber}`);

    // Prepare the request payload
    const { to, type, ...messageContent } = messageData;
    const payload = {
      messaging_product: 'whatsapp',
      to: formattedNumber,
      type: messageData.type,
      ...messageContent
    };

    // Send the message to Meta WhatsApp API
    const response = await fetch(
      `${WHATSAPP_API_BASE_URL}/${whatsappConfig.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whatsappConfig.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const responseData = await response.json();

    if (response.ok && responseData.messages && responseData.messages[0]) {
      const messageId = responseData.messages[0].id;
      console.log(`✅ WhatsApp message sent successfully. Message ID: ${messageId}`);
      return { success: true, messageId };
    } else {
      console.error('❌ Failed to send WhatsApp message:', responseData);
      return { 
        success: false, 
        error: responseData.error?.message || 'Unknown error' 
      };
    }

  } catch (error) {
    console.error('❌ Failed to send WhatsApp message:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Send text WhatsApp message
export const sendTextWhatsAppMessage = async (
  phoneNumber: string, 
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const messageData: WhatsAppMessage = {
    to: phoneNumber,
    type: WhatsAppMessageType.TEXT,
    text: {
      body: message,
      preview_url: true
    }
  };

  return await sendWhatsAppMessage(messageData);
};

// Send order confirmation WhatsApp message using template
export const sendOrderConfirmationWhatsApp = async (orderData: OrderData): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> => {
  try {
    // Use your approved template configuration
    // Template name: order_received (for card) or order_received_cash (for cash)
    // Body: {{1}} = customer name, {{2}} = order id, {{3}} = amount
    // Button URL: https://dashboard.naturalspicesuae.com/admin/print-invoice/{{1}} → param = orderId

    // Choose template based on payment method
    const templateName = orderData.paymentMethod.toLowerCase() === 'cash' 
      ? 'msg_order_received_cash' 
      : 'msg_order_received_card';

    const components = [
      // Body parameters: {{1}} = customer name, {{2}} = order id, {{3}} = amount
      {
        type: 'body',
        parameters: [
          { type: 'text', text: orderData.customerName },
          { type: 'text', text: orderData.orderId },
          { type: 'text', text: `${orderData.total.toFixed(2)}` }
        ]
      },
      // Quick Reply Button (no parameters needed for quick reply buttons)
      {
        type: 'button',
        sub_type: 'quick_reply',
        index: 0,
        parameters: [
          { type: 'payload', payload: `order_${orderData.orderId}` }
        ]
      },
      // Quick Reply Button at index 1 - for order details
      {
        type: 'button',
        sub_type: 'quick_reply',
        index: 1,
        parameters: [
          { type: 'payload', payload: `details_${orderData.orderId}` }
        ]
      },
      // URL Button at index 2 - for invoice (requires parameter)
      {
        type: 'button',
        sub_type: 'url',
        index: 2,
        parameters: [
          { type: 'text', text: `${orderData.customerPhone.slice(-4)}-${orderData.orderId}` }
        ]
      }
    ];

    return await sendTemplateWhatsAppMessage(
      orderData.customerPhone,
      templateName,
      'en',
      components
    );

  } catch (error) {
    console.error('❌ Failed to send order confirmation WhatsApp:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Send template WhatsApp message (for approved templates)
export const sendTemplateWhatsAppMessage = async (
  phoneNumber: string,
  templateName: string,
  languageCode: string = 'ar',
  components?: any[]
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const messageData: WhatsAppMessage = {
    to: phoneNumber,
    type: WhatsAppMessageType.TEMPLATE,
    template: {
      name: templateName,
      language: {
        code: languageCode
      },
      components: components || []
    }
  };

  return await sendWhatsAppMessage(messageData);
};

// Verify webhook signature (for webhook security)
export const verifyWebhookSignature = (
  payload: string,
  signature: string
): boolean => {
  try {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', whatsappConfig.webhookVerifyToken)
      .update(payload)
      .digest('hex');
    
    return signature === `sha256=${expectedSignature}`;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
};