import { NextRequest, NextResponse } from 'next/server';
import { updateUserSchema } from '@/lib/validators/user';
import { userService } from '@/lib/services/user-service';
import { withAuth } from '@/lib/auth-middleware';
import { z } from 'zod';

export const GET = withAuth(async (request: NextRequest, userId: string, userRole: string) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const user = await userService.findById(id);
    return NextResponse.json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    const status = message.includes('não encontrado') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
});

export const PUT = withAuth(async (request: NextRequest, userId: string, userRole: string) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    const user = await userService.update(id, validatedData);
    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Erro interno';
    const status = message.includes('não encontrado') ? 404 : message.includes('em uso') ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
});

export const DELETE = withAuth(async (request: NextRequest, userId: string, userRole: string) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    await userService.delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    const status = message.includes('não encontrado') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
});
