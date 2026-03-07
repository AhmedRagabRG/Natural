import { NextResponse } from 'next/server';
import { SettingsService } from '@/lib/db';

export async function GET() {
  try {
    const settings = await SettingsService.getDeliverySettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}
