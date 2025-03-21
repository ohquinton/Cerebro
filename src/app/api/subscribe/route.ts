import { NextResponse } from 'next/server';
import { supabase } from '@/lib/api/supabase';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Store the email in your newsletter/waitlist table
    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert(
        { 
          email: email.toLowerCase().trim(),
          subscribed_at: new Date().toISOString(),
          status: 'active'
        }, 
        { onConflict: 'email' }
      );
    
    if (error) {
      console.error('Error saving subscription:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to subscribe. Please try again.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Successfully subscribed to the newsletter!' 
    });
    
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
