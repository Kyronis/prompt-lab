import jwt from 'jsonwebtoken';
import type { TokenPayload } from '@prompt-lab/shared';

const JWT_SECRET = process.env['JWT_SECRET'] ?? 'fallback-secret-change-me';
const ACCESS_TTL = Number(process.env['JWT_ACCESS_TTL'] ?? 3600);

export function signToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TTL });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
