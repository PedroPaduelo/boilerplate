import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { userService } from '@/lib/services/user-service';

export const GET = withAuth(async (request: NextRequest, userId: string, userRole: string) => {
  try {
    const user = await userService.findById(userId);
    return NextResponse.json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
