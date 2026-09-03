// Admin User Management API
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, COLLECTIONS, DBUser, DBDataset, initDefaultUsers } from '@/lib/db';

async function checkAdminAuth() {
  const session = await auth();
  if (!session?.user?.email) {
    return null;
  }
  const email = session.user.email.toLowerCase();
  const userRole = (session.user as any).role;
  if (userRole === 'ADMIN' || email === 'admin@bob.com') {
    return session;
  }
  return null;
}

// GET: List all users
export async function GET() {
  try {
    const adminSession = await checkAdminAuth();
    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    initDefaultUsers();
    const users = db.findMany<DBUser>(COLLECTIONS.USERS);

    // Filter out passwords
    const safeUsers = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    return NextResponse.json({ success: true, data: safeUsers });
  } catch (error) {
    console.error('Admin GET users error:', error);
    return NextResponse.json({ error: 'Failed to retrieve users' }, { status: 500 });
  }
}

// PATCH: Approve / Reject user
export async function PATCH(req: NextRequest) {
  try {
    const adminSession = await checkAdminAuth();
    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { userId, action, role } = await req.json();

    if (!userId || !action) {
      return NextResponse.json({ error: 'User ID and action are required' }, { status: 400 });
    }

    const targetUser = db.findById<DBUser>(COLLECTIONS.USERS, userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updates: Partial<DBUser> = {};
    if (action === 'APPROVE') {
      updates.status = 'APPROVED';
    } else if (action === 'REJECT') {
      updates.status = 'REJECTED';
    }

    if (role && ['ADMIN', 'ANALYST', 'USER'].includes(role)) {
      updates.role = role;
    }

    const updated = db.update<DBUser>(COLLECTIONS.USERS, userId, updates);

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.email} has been ${updates.status?.toLowerCase() || 'updated'}.`,
      data: updated,
    });
  } catch (error) {
    console.error('Admin PATCH user error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE: Remove account due to suspicious activity
export async function DELETE(req: NextRequest) {
  try {
    const adminSession = await checkAdminAuth();
    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const targetUser = db.findById<DBUser>(COLLECTIONS.USERS, userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Safety: Protect primary admin
    if (targetUser.email.toLowerCase() === 'admin@bob.com') {
      return NextResponse.json({ error: 'Cannot delete primary system administrator account' }, { status: 400 });
    }

    // Delete user
    db.delete(COLLECTIONS.USERS, userId);

    // Clean up associated datasets
    db.deleteMany<DBDataset>(COLLECTIONS.DATASETS, (d) => d.userId === userId);

    return NextResponse.json({
      success: true,
      message: `Account for ${targetUser.email} deleted successfully.`,
    });
  } catch (error) {
    console.error('Admin DELETE user error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
