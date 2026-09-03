// Registration Route for BOB Data Analyzer
import { NextRequest, NextResponse } from 'next/server';
import { db, COLLECTIONS, DBUser, initDefaultUsers } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    initDefaultUsers();

    // Check if email already registered
    const existing = db.findOne<DBUser>(COLLECTIONS.USERS, (u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return NextResponse.json(
        {
          error: existing.status === 'PENDING'
            ? 'This email is already registered and awaiting admin approval.'
            : 'An account with this email already exists. Please sign in.',
        },
        { status: 400 }
      );
    }

    // Create user with PENDING status
    const newUser = db.create<DBUser>(COLLECTIONS.USERS, {
      name: name.trim(),
      email: cleanEmail,
      password: password.trim(),
      role: 'USER',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Registration request submitted successfully! An administrator (admin@bob.com) must approve your account before you can log in.',
      userId: newUser.id,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Failed to process registration request' }, { status: 500 });
  }
}
