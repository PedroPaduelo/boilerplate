import type { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '@/lib/env';

interface JWTPayload {
  sub: string;
  iat: number;
  exp: number;
}

export async function authenticate(
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

    // Attach user info to socket
    (socket as any).user_id = decoded.sub;

    next();
  } catch (error) {
    next(new Error('Invalid or expired token'));
  }
}
