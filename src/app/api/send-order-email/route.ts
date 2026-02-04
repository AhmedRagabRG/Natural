import { NextResponse, NextRequest } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { orderData, customerEmail } = await request.json();
    console.log('📧 Email API called with:', { customerEmail, orderNumber: orderData?.orderNumber });

    if (!orderData || !customerEmail) {
      console.log('❌ Missing required data:', { orderData: !!orderData, customerEmail: !!customerEmail });
      return NextResponse.json({ message: 'Missing required data' }, { status: 400 });
    }

    // إعداد SMTP transporter
    console.log('🔧 Setting up SMTP transporter...');
    const transporter = nodemailer.createTransport({
      host: 'gator4477.hostgator.com',
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: 'emailserver@naturalspicesuae.com',
        pass: 'W0hxghNski@r'
      },
      debug: true, // Enable debug output
      logger: true // Log information in console
    });

    // SMTP transporter ready
    console.log('✅ SMTP transporter configured');

    const emailHTML = generateOrderEmailHTML(orderData);
    console.log('📝 Generated email HTML (length):', emailHTML.length);

    const mailOptions = {
      from: '"Natural Spices UAE" <emailserver@naturalspicesuae.com>',
      to: customerEmail,
      bcc: 'order@naturalspicesuae.com',
      subject: `Order Confirmation - Order #${orderData.orderNumber || ''}`,
      html: emailHTML
    };

    console.log('📤 Sending email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      bcc: mailOptions.bcc,
      subject: mailOptions.subject,
      htmlLength: emailHTML.length
    });

    console.log('🔍 Attempting to send email...');

    // Add timeout for email sending
    const emailPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email sending timeout after 30 seconds')), 30000)
    );
    
    const result = await Promise.race([emailPromise, timeoutPromise]) as any;
    console.log('✅ Email sent successfully:', {
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
      response: result.response
    });

    return NextResponse.json({ 
      message: 'Email sent successfully',
      messageId: result.messageId
    });
  } catch (error: any) {
    console.error('❌ Error sending email:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    return NextResponse.json({ 
      message: 'Failed to send email', 
      error: error?.message || 'Unknown error',
      errorCode: error?.code,
      errorResponse: error?.response
    }, { status: 500 });
  }
}

function safeNumber(val: any, fallback = 0) {
  const n = typeof val === 'number' ? val : Number(val);
  return Number.isFinite(n) ? n : fallback;
}

function safeString(val: any, fallback = '') {
  if (val === null || val === undefined) return fallback;
  return String(val);
}

function formatPriceEmail(n: any) {
  const price = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(price)) return '0.00';
  // Always show 2 decimal places for all prices
  return price.toFixed(2);
}

function generateOrderEmailHTML(orderData: any) {
  const {
    receiverName,
    area,
    orderNumber,
    deliveryType,
    address,
    contactNumber,
    whatsappNumber,
    subtotal,
    discount,
    redeemAmount,
    shipping,
    overWeightFee,
    transactionFee,
    grandTotal,
    items
  } = orderData || {};

  const sSubtotal = safeNumber(subtotal);
  const sDiscount = safeNumber(discount);
  const sRedeemAmount = safeNumber(redeemAmount);
  const sShipping = safeNumber(shipping);
  const sOverWeightFee = safeNumber(overWeightFee);
  const sTransactionFee = safeNumber(transactionFee);
  const sGrandTotal = safeNumber(grandTotal);

  const listItems = Array.isArray(items) ? items : [];

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Order Confirmation</title>
    <style type="text/css">
        body {
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            font-family: Arial, Helvetica, sans-serif;
        }
        table {
            border-collapse: collapse;
            width: 100%;
        }
        .container {
            max-width: 760px;
            margin: 0 auto;
            background-color: #f9f9f9;
        }
        .content {
            padding: 20px;
            background-color: transparent;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .order-table {
            width: 100%;
            margin-bottom: 20px;
        }
        .order-table td {
            border: 1px solid #dddddd;
            padding: 7px;
            text-align: left;
        }
        .footer {
            text-align: center;
            padding: 10px;
            border-top: 1px solid #fed700;
            margin-top: 20px;
        }
        @media (max-width: 600px) {
            .container {
                width: 100% !important;
                margin: 0 !important;
            }
            .content {
                padding: 10px !important;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="content">
            <div class="header">
                <h1 style="color: black; font-size: 24px; margin: 0;">Thank you for shopping!</h1>
                <p style="font-size: 12px; margin: 10px 0;">We've received your order. Our team is now preparing your items. We will be in touch with you once your package is ready. Please find your order details below.</p>
            </div>
            
            <table class="order-table">
                <tr>
                    <td><strong>Receiver's Name</strong></td>
                    <td>${safeString(receiverName, 'N/A')}</td>
                </tr>
                <tr>
                    <td><strong>Area</strong></td>
                    <td>${safeString(area, 'Not in the List')}</td>
                </tr>
                <tr>
                    <td><strong>Order #</strong></td>
                    <td>${safeString(orderNumber, '')}</td>
                </tr>
                <tr>
                    <td><strong>Delivery Type</strong></td>
                    <td>${safeString(deliveryType, 'cash') === 'cash' ? 'Cash on Delivery' : 'Card on Delivery'}</td>
                </tr>
                <tr>
                    <td><strong>Delivery Address</strong></td>
                    <td>${safeString(address, '')}</td>
                </tr>
                <tr>
                    <td><strong>Contact Number</strong></td>
                    <td>${safeString(contactNumber, '')}</td>
                </tr>
                <tr>
                    <td><strong>WhatsApp</strong></td>
                    <td>https://wa.me/${safeString(whatsappNumber, '')}</td>
                </tr>
                <tr>
                    <td><strong>Subtotal</strong></td>
                    <td>AED ${formatPriceEmail(sSubtotal)}</td>
                </tr>
                ${sDiscount > 0 ? `
                <tr>
                    <td><strong>Discount</strong></td>
                    <td><span style="color:red; font-weight:bold;">-</span> AED ${formatPriceEmail(sDiscount)}</td>
                </tr>
                ` : ''}
                ${sRedeemAmount > 0 ? `
                <tr>
                    <td><strong>Redeem Amount</strong></td>
                    <td><span style="color:red; font-weight:bold;">-</span> AED ${formatPriceEmail(sRedeemAmount)}</td>
                </tr>
                ` : ''}
                <tr>
                    <td><strong>Shipping Charges</strong></td>
                    <td>AED ${formatPriceEmail(sShipping)}</td>
                </tr>
                ${sOverWeightFee > 0 ? `
                <tr>
                    <td><strong>Over Weight Fee</strong></td>
                    <td>AED ${formatPriceEmail(sOverWeightFee)}</td>
                </tr>
                ` : ''}
                ${sTransactionFee > 0 ? `
                <tr>
                    <td><strong>Transaction Fee</strong></td>
                    <td>AED ${formatPriceEmail(sTransactionFee)}</td>
                </tr>
                ` : ''}
                <tr>
                    <td><strong>Grand Total (Incl VAT 5%)</strong></td>
                    <td>AED ${formatPriceEmail(sGrandTotal)}</td>
                </tr>
            </table>
            
            <table class="order-table">
                <tr>
                    <td><strong>Product Name</strong></td>
                    <td><strong>Qty</strong></td>
                    <td><strong>Price</strong></td>
                </tr>
                ${listItems.map(item => {
                  const iName = safeString(item?.name, '');
                  const iSku = safeString(item?.sku, 'N/A');
                  const iQty = safeNumber(item?.quantity, 0);
                  const iPrice = safeNumber(item?.price, 0);
                  return `
                <tr>
                    <td>
                        ${iName}<br>
                        SKU Code: ${iSku}
                    </td>
                    <td>${iQty} pcs</td>
                    <td>AED ${formatPriceEmail(iPrice * iQty)}</td>
                </tr>`;
                }).join('')}
            </table>
            
            <div class="footer">
                <p style="font-size: 10px; margin: 0;"><strong>Copyright © Natural Spices UAE</strong> - All Rights Reserved</p>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}