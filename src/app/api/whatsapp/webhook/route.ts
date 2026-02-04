import { NextRequest, NextResponse } from 'next/server';
import { whatsappConfig } from '../../../../config/whatsapp';

// GET /api/whatsapp/webhook - Webhook verification
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    // Verify the webhook
    if (mode === 'subscribe' && token === whatsappConfig.webhookVerifyToken) {
      console.log('✅ WhatsApp webhook verified successfully');
      return new NextResponse(challenge, { status: 200 });
    } else {
      console.error('❌ WhatsApp webhook verification failed');
      return NextResponse.json(
        { error: 'Webhook verification failed' },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error('Error in webhook verification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/whatsapp/webhook - Receive webhook notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📨 Received WhatsApp webhook:', JSON.stringify(body, null, 2));

    // Process webhook data
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === 'messages') {
            const value = change.value;
            
            // Handle message status updates
            if (value.statuses) {
              for (const status of value.statuses) {
                console.log(`📱 Message ${status.id} status: ${status.status}`);
                
                // You can store status updates in database here
                // await updateMessageStatus(status.id, status.status);
              }
            }
            
            // Handle incoming messages (if you want to respond to customer messages)
            if (value.messages) {
              for (const message of value.messages) {
                console.log(`📩 Received message from ${message.from}: ${message.text?.body || 'Non-text message'}`);
                
                // You can handle incoming messages here
                // await handleIncomingMessage(message);
              }
            }
          }
        }
      }
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Error processing webhook:', error);
    
    // Still return 200 to avoid webhook retries
    return NextResponse.json({ success: false }, { status: 200 });
  }
}