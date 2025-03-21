import { NextResponse } from 'next/server';
import { supabase } from '@/lib/api/supabase';
import { ensureUserProfile } from '@/lib/auth';

export async function POST() {
  try {
    // Get current user from Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error getting user in ensure-profile API:', userError);
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Ensure profile exists
    const { success, error } = await ensureUserProfile(user);
    
    if (!success) {
      console.error('Error ensuring user profile:', error);
      return NextResponse.json(
        { error: 'Failed to ensure profile' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error in ensure-profile API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}