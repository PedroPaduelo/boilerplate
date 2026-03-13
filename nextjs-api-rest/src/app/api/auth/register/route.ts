import { NextRequest, NextResponse } from 'next/server';
import { createUserSchema } from '@/lib/validators/user';
import { userService } from '@/lib/services/user-service';
import { generateToken } from '@/lib/jwt';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    const user = await userService.create(validatedData);

    const token = generateToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      user: user,
      token,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Erro interno';
    const status = message.includes('já existe') ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
