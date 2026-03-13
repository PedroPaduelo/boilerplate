import { NextRequest, NextResponse } from 'next/server';
import { userQuerySchema, createUserSchema } from '@/lib/validators/user';
import { userService } from '@/lib/services/user-service';
import { withAuth } from '@/lib/auth-middleware';
import { z } from 'zod';

export const GET = withAuth(async (request: NextRequest, userId: string, userRole: string) => {
  try {
    const url = new URL(request.url);
    const query = {
      page: url.searchParams.get('page'),
      pageSize: url.searchParams.get('pageSize'),
      role: url.searchParams.get('role') as 'ADMIN' | 'USER' | null,
      isActive: url.searchParams.get('isActive'),
      search: url.searchParams.get('search'),
    };

    const validatedQuery = userQuerySchema.parse(query);
    const result = await userService.list(validatedQuery);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
});

export const POST = withAuth(async (request: NextRequest, userId: string, userRole: string) => {
  try {
    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    const user = await userService.create(validatedData);

    return NextResponse.json(user, { status: 201 });
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
});
