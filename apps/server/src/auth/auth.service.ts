import { Injectable } from '@nestjs/common';
import { db } from '@repo/db';
import { loginSchema, registerSchema, z } from '@repo/zod';
import { TRPCError } from '@trpc/server';
import argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import { JwtService } from '@nestjs/jwt';

const ACCESS_TOKEN_TTL = '5m';
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type AuthUser = {
  id: string;
  userName: string;
};

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async register({
    displayName,
    userName,
    email,
    password,
  }: z.infer<typeof registerSchema>) {
    const existingUser = await db.user.findFirst({
      where: {
        OR: [{ email }, { userName }],
      },
      select: {
        email: true,
        userName: true,
      },
    });

    if (existingUser?.email === email)
      return {
        ok: false,
        fieldErrors: {
          email: 'Email is already in use',
        },
      };

    if (existingUser?.userName === userName)
      return {
        ok: false,
        fieldErrors: {
          userName: 'Username is already in use',
        },
      };

    const user = await db.user.create({
      data: {
        email,
        userName,
        displayName,
        password: await argon2.hash(password, {
          type: argon2.argon2id,
        }),
      },
      select: {
        id: true,
        userName: true,
      },
    });

    return this.createTokens(user);
  }

  async login({ email, password }: z.infer<typeof loginSchema>) {
    const existingUser = await db.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        userName: true,
        password: true,
      },
    });

    const passwordMatches =
      existingUser?.password &&
      (await argon2.verify(existingUser.password, password));

    if (!existingUser || !passwordMatches)
      return {
        ok: false,
        fieldErrors: {
          email: 'Email or password is incorrect',
          password: 'Email or password is incorrect',
        },
      };

    return this.createTokens(existingUser);
  }

  async refresh(refreshToken: string) {
    const [sessionId, secret] = refreshToken.split('.');

    if (!sessionId || !secret) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const session = await db.session.findUnique({
      where: {
        id: sessionId,
      },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
          },
        },
      },
    });

    if (!session || session.expires <= new Date()) {
      if (session) await db.session.delete({ where: { id: session.id } });

      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const valid = await argon2.verify(session.sessionToken, secret);

    if (!valid) {
      await db.session.delete({ where: { id: session.id } });

      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    return this.rotateTokens(sessionId, session.user);
  }

  async logout(refreshToken: string) {
    const [sessionId] = refreshToken.split('.');
    await db.session.deleteMany({
      where: { id: sessionId },
    });

    return {
      ok: true,
    };
  }

  private async createAccessToken({ id, userName }: AuthUser) {
    return this.jwtService.signAsync(
      {
        id,
        userName,
      },
      {
        expiresIn: ACCESS_TOKEN_TTL,
      },
    );
  }

  private async createTokens(user: AuthUser) {
    const secret = randomBytes(48).toString('base64url');

    const session = await db.session.create({
      data: {
        userId: user.id,
        sessionToken: await argon2.hash(secret, {
          type: argon2.argon2id,
        }),
        expires: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });

    return {
      ok: true,
      accessToken: await this.createAccessToken(user),
      refreshToken: `${session.id}.${secret}`,
    };
  }

  private async rotateTokens(sessionId: string, user: AuthUser) {
    const secret = randomBytes(48).toString('base64url');

    await db.session.update({
      where: {
        id: sessionId,
      },
      data: {
        sessionToken: await argon2.hash(secret, {
          type: argon2.argon2id,
        }),
        expires: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });

    return {
      ok: true,
      accessToken: this.createAccessToken(user),
      refreshToken: `${sessionId}.${secret}`,
    };
  }
}
