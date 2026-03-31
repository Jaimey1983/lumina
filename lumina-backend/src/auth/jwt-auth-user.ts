import { Role } from '@prisma/client';

/** Usuario adjunto a `request` tras `JwtAuthGuard` (coincide con `JwtStrategy.validate`). */
export type JwtAuthUser = {
  id: string;
  name: string;
  lastName: string;
  email: string;
  role: Role;
  isActive: boolean;
};
