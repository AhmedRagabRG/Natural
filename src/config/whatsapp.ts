// Meta WhatsApp Business API configuration
export const whatsappConfig = {
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  phoneNumberId: '834899733032900',
  businessAccountId: '4213690345573081',
  webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
  apiVersion: process.env.WHATSAPP_API_VERSION || 'v23.0',
  enabled: process.env.WHATSAPP_ENABLED === 'true'
};

// Meta WhatsApp Business API base URL
export const WHATSAPP_API_BASE_URL = `https://graph.facebook.com/${whatsappConfig.apiVersion}`;

// Validate configuration
export const isWhatsAppConfigured = (): boolean => {
  return !!(
    whatsappConfig.accessToken &&
    whatsappConfig.phoneNumberId &&
    whatsappConfig.enabled
  );
};

// WhatsApp message types
export enum WhatsAppMessageType {
  TEXT = 'text',
  TEMPLATE = 'template',
  INTERACTIVE = 'interactive'
}

// WhatsApp message status
export enum WhatsAppMessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}