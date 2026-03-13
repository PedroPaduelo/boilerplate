import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validators/user';
import { userService } from '@/lib/services/user-service';
import { generateToken } from '@/lib/jwt';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    const user = await userService.authenticate(
      validatedData.email,
      validatedData.password
    );

    const token = generateToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
