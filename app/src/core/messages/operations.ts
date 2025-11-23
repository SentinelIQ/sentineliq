import { HttpError } from 'wasp/server';
import type { MessageFilter, MessageQueryResult } from './types';

/**
 * Get contact messages (Admin only)
 */
export const getContactMessages = async (args: MessageFilter, context: any): Promise<MessageQueryResult> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Only admins can view contact messages');
  }

  const {
    isRead,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = args || {};

  const where: any = {};

  if (typeof isRead === 'boolean') {
    where.isRead = isRead;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = startDate;
    }
    if (endDate) {
      where.createdAt.lte = endDate;
    }
  }

  const [messages, total] = await Promise.all([
    context.entities.ContactFormMessage.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            username: true,
          },
        },
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    }),
    context.entities.ContactFormMessage.count({ where }),
  ]);

  return {
    messages,
    total,
    hasMore: offset + messages.length < total,
  };
};

/**
 * Send contact message
 */
export const sendContactMessage = async (args: { content: string }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!args.content || args.content.trim().length === 0) {
    throw new HttpError(400, 'Message content cannot be empty');
  }

  if (args.content.length > 5000) {
    throw new HttpError(400, 'Message content is too long (max 5000 characters)');
  }

  const message = await context.entities.ContactFormMessage.create({
    data: {
      content: args.content.trim(),
      userId: context.user.id,
    },
    include: {
      user: {
        select: {
          email: true,
          username: true,
        },
      },
    },
  });

  // TODO: Send email notification to admins about new contact message

  return message;
};

/**
 * Mark message as read
 */
export const markMessageAsRead = async (args: { id: string }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Only admins can mark messages as read');
  }

  const message = await context.entities.ContactFormMessage.findUnique({
    where: { id: args.id },
  });

  if (!message) {
    throw new HttpError(404, 'Message not found');
  }

  return context.entities.ContactFormMessage.update({
    where: { id: args.id },
    data: {
      isRead: true,
    },
  });
};

/**
 * Mark message as replied
 */
export const markMessageAsReplied = async (args: { id: string }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Only admins can mark messages as replied');
  }

  const message = await context.entities.ContactFormMessage.findUnique({
    where: { id: args.id },
  });

  if (!message) {
    throw new HttpError(404, 'Message not found');
  }

  return context.entities.ContactFormMessage.update({
    where: { id: args.id },
    data: {
      isRead: true,
      repliedAt: new Date(),
    },
  });
};

/**
 * Delete message
 */
export const deleteContactMessage = async (args: { id: string }, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated');
  }

  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Only admins can delete messages');
  }

  const message = await context.entities.ContactFormMessage.findUnique({
    where: { id: args.id },
  });

  if (!message) {
    throw new HttpError(404, 'Message not found');
  }

  return context.entities.ContactFormMessage.delete({
    where: { id: args.id },
  });
};
