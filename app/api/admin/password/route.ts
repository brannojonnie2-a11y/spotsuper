import { NextResponse } from 'next/server';
import { validateAuthToken, verifyAdminPassword } from '@/lib/admin-auth';
import { updateAdminPassword, getConfig } from '@/lib/config-storage';

// Helper to check authentication from the Authorization header
const checkAuth = (request: Request): NextResponse | null => {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];
  if (!token || !validateAuthToken(token)) {
    return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }
  return null;
};

// PUT /api/admin/password - Update admin password
export async function PUT(request: Request) {
  const authError = checkAuth(request);
  if (authError) return authError;

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return new NextResponse(JSON.stringify({ message: 'Missing required fields' }), { status: 400 });
    }

    // 1. Verify current password against stored config
    const config = getConfig();
    if (currentPassword !== config.adminPassword) {
      return new NextResponse(JSON.stringify({ message: 'Incorrect current password' }), { status: 403 });
    }

    // 2. Update password
    updateAdminPassword(newPassword);

    return NextResponse.json({ success: true, message: 'Admin password updated successfully' });

  } catch (error) {
    console.error('Error updating admin password:', error);
    return new NextResponse(JSON.stringify({ message: 'Internal Server Error' }), { status: 500 });
  }
}
