import { Injectable } from '@nestjs/common';
import { ORPCError } from '@orpc/server';
import { db } from '@repo/db';
import {
  agentSessionSchema,
  z,
  agentSessionsCreateInputSchema,
  agentSessionsListInputSchema,
  agentSessionMessagesInputSchema,
  agentSessionsRenameInputSchema,
  agentSessionsSetPinnedInputSchema,
  agentSessionsDeleteInputSchema,
} from '@repo/zod';

const SESSION_TITLE_MAX = 120;
const HISTORY_WINDOW = 20;

export function deriveSessionTitle(text: string): string {
  const singleLine = text.replace(/\s+/g, ' ').trim();
  if (singleLine.length <= 60) return singleLine || 'New chat';
  return `${singleLine.slice(0, 57).trimEnd()}...`;
}

type SessionShape = z.infer<typeof agentSessionSchema>;

function toSessionShape(row: {
  id: string;
  apiKeyId: number | null;
  title: string;
  model: string | null;
  provider: string | null;
  isPinned: boolean;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
  _count: { messages: number };
}): SessionShape {
  return {
    id: row.id,
    apiKeyId: row.apiKeyId,
    title: row.title,
    model: row.model,
    provider: row.provider,
    isPinned: row.isPinned,
    lastMessageAt: row.lastMessageAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    messageCount: row._count.messages,
  };
}

const sessionSelect = {
  id: true,
  apiKeyId: true,
  title: true,
  model: true,
  provider: true,
  isPinned: true,
  lastMessageAt: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { messages: true } },
} as const;

@Injectable()
export class AgentSessionsService {
  async create(
    input: z.infer<typeof agentSessionsCreateInputSchema>,
    userId: string,
  ): Promise<SessionShape> {
    let provider: string | null = null;
    if (input.apiKeyId !== undefined) {
      const key = await db.userApiKeys.findFirst({
        where: { id: input.apiKeyId, userId },
        select: { id: true, provider: true },
      });
      if (!key) {
        throw new ORPCError('NOT_FOUND', {
          message: 'API key not found.',
        });
      }
      provider = key.provider;
    }

    const row = await db.agentSession.create({
      data: {
        userId,
        apiKeyId: input.apiKeyId ?? null,
        title: input.title ?? 'New chat',
        model: input.model ?? null,
        provider: (provider as never) ?? null,
      },
      select: sessionSelect,
    });

    return toSessionShape(row);
  }

  async list(
    input: z.infer<typeof agentSessionsListInputSchema>,
    userId: string,
  ) {
    const cursorRow = input.cursor
      ? await db.agentSession.findFirst({
          where: { id: input.cursor, userId },
          select: { isPinned: true, lastMessageAt: true, id: true },
        })
      : null;

    if (input.cursor && !cursorRow) {
      throw new ORPCError('NOT_FOUND', { message: 'Session not found.' });
    }

    const afterTimestamp = cursorRow
      ? {
          OR: [
            { lastMessageAt: { lt: cursorRow.lastMessageAt } },
            {
              lastMessageAt: cursorRow.lastMessageAt,
              id: { lt: cursorRow.id },
            },
          ],
        }
      : {};

    const rows = await db.agentSession.findMany({
      where: {
        userId,
        ...(cursorRow
          ? cursorRow.isPinned
            ? { isPinned: true, ...afterTimestamp }
            : {
                OR: [
                  { isPinned: true },
                  { isPinned: false, ...afterTimestamp },
                ],
              }
          : {}),
      },
      select: sessionSelect,
      orderBy: [
        { isPinned: 'desc' },
        { lastMessageAt: 'desc' },
        { id: 'desc' },
      ],
      take: input.limit + 1,
    });

    const hasMore = rows.length > input.limit;
    const items = (hasMore ? rows.slice(0, input.limit) : rows).map(
      toSessionShape,
    );
    const lastItem = items[items.length - 1];
    return {
      items,
      nextCursor: hasMore && lastItem ? lastItem.id : null,
    };
  }

  async getMessages(
    input: z.infer<typeof agentSessionMessagesInputSchema>,
    userId: string,
  ) {
    const session = await db.agentSession.findFirst({
      where: { id: input.id, userId },
      select: sessionSelect,
    });
    if (!session) {
      throw new ORPCError('NOT_FOUND', { message: 'Session not found.' });
    }

    const where =
      input.cursor !== undefined
        ? { sessionId: input.id, sequence: { lt: input.cursor } }
        : { sessionId: input.id };

    const rows = await db.agentMessage.findMany({
      where,
      orderBy: { sequence: 'desc' },
      take: input.limit + 1,
      select: {
        id: true,
        sequence: true,
        role: true,
        content: true,
        model: true,
        createdAt: true,
      },
    });

    const hasMore = rows.length > input.limit;
    const page = hasMore ? rows.slice(0, input.limit) : rows;
    const items = [...page].reverse();
    const oldestInPage = page[page.length - 1];

    return {
      session: toSessionShape(session),
      items,
      nextCursor: hasMore && oldestInPage ? oldestInPage.sequence : null,
    };
  }

  async rename(
    input: z.infer<typeof agentSessionsRenameInputSchema>,
    userId: string,
  ): Promise<SessionShape> {
    const existing = await db.agentSession.findFirst({
      where: { id: input.id, userId },
      select: { id: true },
    });
    if (!existing) {
      throw new ORPCError('NOT_FOUND', { message: 'Session not found.' });
    }
    const row = await db.agentSession.update({
      where: { id: input.id },
      data: { title: input.title.slice(0, SESSION_TITLE_MAX) },
      select: sessionSelect,
    });
    return toSessionShape(row);
  }

  async setPinned(
    input: z.infer<typeof agentSessionsSetPinnedInputSchema>,
    userId: string,
  ): Promise<SessionShape> {
    const existing = await db.agentSession.findFirst({
      where: { id: input.id, userId },
      select: { id: true },
    });
    if (!existing) {
      throw new ORPCError('NOT_FOUND', { message: 'Session not found.' });
    }
    const row = await db.agentSession.update({
      where: { id: input.id },
      data: { isPinned: input.isPinned },
      select: sessionSelect,
    });
    return toSessionShape(row);
  }

  async delete(
    input: z.infer<typeof agentSessionsDeleteInputSchema>,
    userId: string,
  ) {
    // Hard delete; messages cascade. Keeps retention story simple:
    // delete means gone everywhere (messages ON DELETE CASCADE).
    const result = await db.agentSession.deleteMany({
      where: { id: input.id, userId },
    });
    if (result.count === 0) {
      throw new ORPCError('NOT_FOUND', { message: 'Session not found.' });
    }
    return { id: input.id };
  }

  /** Load recent transcript for context assembly. Oldest-first. */
  async loadHistory(sessionId: string, limit = HISTORY_WINDOW) {
    const rows = await db.agentMessage.findMany({
      where: { sessionId },
      orderBy: { sequence: 'desc' },
      take: limit,
      select: { role: true, content: true },
    });
    return [...rows].reverse();
  }
}
