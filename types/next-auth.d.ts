import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      avatar?: string;
    } & DefaultSession['user'];
    accessToken: string;
    refreshToken: string;
  }

  interface User extends DefaultUser {
    role: string;
    avatar?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    userId: string;
    role: string;
    accessToken: string;
    refreshToken: string;
    avatar?: string;
  }
}