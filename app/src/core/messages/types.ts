export interface ContactMessage {
  id: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  repliedAt?: Date | null;
  userId: string;
  user: {
    email?: string | null;
    username?: string | null;
  };
}

export interface MessageFilter {
  isRead?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface MessageQueryResult {
  messages: ContactMessage[];
  total: number;
  hasMore: boolean;
  [key: string]: any;
}
