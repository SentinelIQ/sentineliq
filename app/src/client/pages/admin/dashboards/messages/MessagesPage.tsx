import { useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getContactMessages, markMessageAsRead, markMessageAsReplied, deleteContactMessage } from 'wasp/client/operations';
import type { AuthUser } from "wasp/auth";
import DefaultLayout from "../../layout/DefaultLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Mail, MailOpen, Reply, Trash2 } from 'lucide-react';

function AdminMessages({ user }: { user: AuthUser }) {
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data, isLoading, error, refetch } = useQuery(getContactMessages, {
    isRead: status === 'all' ? undefined : status === 'read',
    limit: pageSize,
    offset: page * pageSize,
  });

  const messages = data?.messages || [];
  const total = data?.total || 0;
  const hasMore = data?.hasMore || false;

  const handleMarkAsRead = async (id: string) => {
    try {
      await markMessageAsRead({ id });
      refetch();
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  const handleMarkAsReplied = async (id: string) => {
    try {
      await markMessageAsReplied({ id });
      refetch();
    } catch (error) {
      console.error('Failed to mark message as replied:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      await deleteContactMessage({ id });
      refetch();
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handlePrevPage = () => setPage((p) => Math.max(0, p - 1));
  const handleNextPage = () => setPage((p) => p + 1);

  return (
    <DefaultLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Contact Messages</h1>
          <p className="text-muted-foreground">
            Manage messages from users via the contact form
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter messages by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1 max-w-xs">
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All messages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Messages</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages List */}
        <Card>
          <CardHeader>
            <CardTitle>Messages ({total} total)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading messages...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                Error loading messages: {error.message}
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No messages found
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message: any) => (
                  <div
                    key={message.id}
                    className={`border rounded-lg p-4 ${!message.isRead ? 'bg-accent/50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {!message.isRead ? (
                            <Badge variant="default">
                              <Mail className="w-3 h-3 mr-1" />
                              New
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <MailOpen className="w-3 h-3 mr-1" />
                              Read
                            </Badge>
                          )}
                          {message.repliedAt && (
                            <Badge variant="secondary">
                              <Reply className="w-3 h-3 mr-1" />
                              Replied
                            </Badge>
                          )}
                          <span className="text-sm font-medium">
                            From: {message.user?.email || message.user?.username || 'Unknown'}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(message.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="prose prose-sm max-w-none">
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {!message.isRead && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsRead(message.id)}
                          >
                            <MailOpen className="w-4 h-4 mr-1" />
                            Mark Read
                          </Button>
                        )}
                        {!message.repliedAt && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsReplied(message.id)}
                          >
                            <Reply className="w-4 h-4 mr-1" />
                            Mark Replied
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(message.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!isLoading && messages.length > 0 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {page * pageSize + 1} - {page * pageSize + messages.length} of {total}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={!hasMore}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DefaultLayout>
  );
}

export default AdminMessages;
