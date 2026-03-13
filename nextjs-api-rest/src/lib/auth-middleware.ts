import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function withAuth(
  handler: (req: NextRequest, userId: string, userRole: string) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const authHeader = request.headers.get('Authorization');

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Token não fornecido' },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      if (!decoded) {
        return NextResponse.json(
          { error: 'Token inválido' },
          { status: 401 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
        select: { id: true, role: true, isActive: true },
      });

      if (!user || !user.isActive) {
        return NextResponse.json(
          { error: 'Usuário não encontrado ou desativado' },
          { status: 401 }
        );
      }

      return handler(request, user.id, user.role);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro de autenticação';
      return NextResponse.json({ error: message }, { status: 401 });
    }
  };
}

export function requireAdmin(
  handler: (req: NextRequest, userId: string, userRole: string) => Promise<NextResponse>
) {
  return async (request: NextRequest, userId: string, userRole: string) => {
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado. Requer privilégios de administrador' },
        { status: 403 }
      );
    }
    return handler(request, userId, userRole);
  };
}
