// WhatsApp Template Testing Functions
// Use these functions to test WhatsApp template integration

// Test order confirmation template
export const testOrderConfirmationTemplate = async (phoneNumber: string) => {
  try {
    const testOrderData = {
      orderId: 'N-AE-TEST-123',
      customerName: 'Ahmed Ali',
      customerPhone: phoneNumber,
      total: 150.00,
      paymentMethod: 'card',
      address: 'Dubai Marina, Dubai, UAE',
      items: [
        { name: 'Cumin Powder', quantity: 2, price: 25.00 },
        { name: 'Turmeric Powder', quantity: 1, price: 18.00 },
        { name: 'Coriander Seeds', quantity: 3, price: 22.00 }
      ],
      deliveryCharges: 10.00,
      discount: 5.00
    };

    const response = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'order_confirmation',
        orderData: testOrderData
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ WhatsApp order confirmation sent successfully!');
      console.log('Message ID:', result.messageId);
      return { success: true, messageId: result.messageId };
    } else {
      console.error('❌ Failed to send WhatsApp message:', result.error);
      return { success: false, error: result.error };
    }

  } catch (error) {
    console.error('❌ Error testing WhatsApp template:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Test basic template message
export const testBasicTemplate = async (phoneNumber: string) => {
  try {
    const response = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'template',
        phoneNumber: phoneNumber,
        templateName: 'order_confirmation',
        languageCode: 'en',
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: 'Ahmed Ali' },
              { type: 'text', text: 'N-AE-TEST-123' },
              { type: 'text', text: '150.00' },
              { type: 'text', text: 'By Card' },
              { type: 'text', text: 'Natural Spices' }
            ]
          },
          {
            type: 'button',
            sub_type: 'url',
            index: 0,
            parameters: [
              { type: 'text', text: 'invoice-N-AE-TEST-123.pdf' }
            ]
          }
        ]
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ WhatsApp template sent successfully!');
      console.log('Message ID:', result.messageId);
      return { success: true, messageId: result.messageId };
    } else {
      console.error('❌ Failed to send WhatsApp template:', result.error);
      return { success: false, error: result.error };
    }

  } catch (error) {
    console.error('❌ Error testing WhatsApp template:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Check WhatsApp configuration
export const checkWhatsAppConfig = async () => {
  try {
    const response = await fetch('/api/whatsapp/send');
    const result = await response.json();
    
    console.log('📱 WhatsApp Configuration Status:');
    console.log('Configured:', result.configured);
    console.log('Message:', result.message);
    
    return result;

  } catch (error) {
    console.error('❌ Error checking WhatsApp config:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Test functions for browser console
export const whatsAppTests = {
  // Test with your phone number
  testOrder: (phoneNumber: string) => testOrderConfirmationTemplate(phoneNumber),
  
  // Test basic template
  testTemplate: (phoneNumber: string) => testBasicTemplate(phoneNumber),
  
  // Check configuration
  checkConfig: () => checkWhatsAppConfig(),
  
  // Test all
  testAll: async (phoneNumber: string) => {
    console.log('🚀 Starting WhatsApp tests...');
    
    console.log('\n1. Checking configuration...');
    await checkWhatsAppConfig();
    
    console.log('\n2. Testing basic template...');
    await testBasicTemplate(phoneNumber);
    
    console.log('\n3. Testing order confirmation...');
    await testOrderConfirmationTemplate(phoneNumber);
    
    console.log('\n✅ All tests completed!');
  }
};

// Make test functions available globally for browser console
if (typeof window !== 'undefined') {
  (window as any).whatsAppTests = whatsAppTests;
}

export default whatsAppTests;
