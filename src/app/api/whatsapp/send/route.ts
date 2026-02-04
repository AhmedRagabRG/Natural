import { NextRequest, NextResponse } from 'next/server';
import { 
  sendTextWhatsAppMessage, 
  sendOrderConfirmationWhatsApp, 
  sendTemplateWhatsAppMessage,
  OrderData 
} from '../../../../utils/whatsapp';
import { isWhatsAppConfigured } from '../../../../config/whatsapp';

// POST /api/whatsapp/send - Send WhatsApp message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...data } = body;

    let result: { success: boolean; messageId?: string; error?: string } = { success: false };

    switch (type) {
      case 'order_confirmation':
        // Validate order data
        // const requiredOrderFields = ['orderId', 'customerName', 'customerPhone', 'items', 'total', 'address', 'paymentMethod'];
        // for (const field of requiredOrderFields) {
        //   if (!data[field]) {
        //     return NextResponse.json(
        //       {
        //         success: false,
        //         message: `Missing required field: ${field}`
        //       },
        //       { status: 400 }
        //     );
        //   }
        // }

        // Ensure we pass the OrderData object only (not the whole body)
        // Client sends: { type: 'order_confirmation', to: '...', orderData: {...} }
        const orderData: OrderData = (data as any)?.orderData ?? (data as OrderData);
        result = await sendOrderConfirmationWhatsApp(orderData);
        break;

      case 'text':
        // Validate text message data
        if (!data.phoneNumber || !data.message) {
          return NextResponse.json(
            {
              success: false,
              message: 'Missing required fields: phoneNumber, message'
            },
            { status: 400 }
          );
        }

        result = await sendTextWhatsAppMessage(data.phoneNumber, data.message);
        break;

      case 'template':
        // Validate template message data
        if (!data.phoneNumber || !data.templateName) {
          return NextResponse.json(
            {
              success: false,
              message: 'Missing required fields: phoneNumber, templateName'
            },
            { status: 400 }
          );
        }

        result = await sendTemplateWhatsAppMessage(
          data.phoneNumber,
          data.templateName,
          data.languageCode || 'ar',
          data.components
        );
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid message type. Use "order_confirmation", "text", or "template"'
          },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'WhatsApp message sent successfully',
        messageId: result.messageId
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to send WhatsApp message',
          error: result.error
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in WhatsApp API:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/whatsapp/send - Get WhatsApp configuration status
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      configured: isWhatsAppConfigured(),
      message: isWhatsAppConfigured() 
        ? 'WhatsApp is configured and ready' 
        : 'WhatsApp is not configured. Please check environment variables.'
    });

  } catch (error) {
    console.error('Error checking WhatsApp configuration:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to check WhatsApp configuration'
      },
      { status: 500 }
    );
  }
}