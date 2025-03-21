import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/api/supabase';

export async function POST(request) {
  try {
    const { username, email, password } = await request.json();
    
    // Basic validation
    if (!username || !email || !password) {
      return NextResponse.json({
        success: false,
        message: 'All fields are required'
      }, { status: 400 });
    }
    
    if (username.length < 3) {
      return NextResponse.json({
        success: false,
        message: 'Username must be at least 3 characters'
      }, { status: 400 });
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({
        success: false,
        message: 'Please enter a valid email address'
      }, { status: 400 });
    }
    
    // Register user with Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          points: 5000 // Starting points for betting
        }
      }
    });
    
    if (authError) {
      console.error('Supabase auth error:', authError);
      
      if (authError.message.includes('email')) {
        return NextResponse.json({
          success: false,
          message: 'Email already registered'
        }, { status: 400 });
      }
      
      return NextResponse.json({
        success: false,
        message: authError.message
      }, { status: 400 });
    }
    
    console.log('User registered:', { username, email, id: authData.user.id });
    
    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({
      success: false,
      message: 'An error occurred during registration'
    }, { status: 500 });
  }
}