import type { Request } from 'express';

export type AuthUser = { id: number; email: string };

export type AuthedRequest = Request & { user: AuthUser };