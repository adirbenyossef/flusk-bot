import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Mock data
async function getConversations() {
  return [
    {
      id: '1',
      userId: 'user123',
      channel: 'slack' as const,
      channelId: 'C123456',
      status: 'active' as const,
      lastMessage: 'How do I reset my password?',
      messageCount: 5,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      userId: 'user456',
      channel: 'whatsapp' as const,
      channelId: '+1234567890',
      status: 'resolved' as const,
      lastMessage: 'Thanks for the help!',
      messageCount: 12,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      userId: 'user789',
      channel: 'web' as const,
      channelId: 'web-user789',
      status: 'escalated' as const,
      lastMessage: 'I need to speak to a human',
      messageCount: 8,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ];
}

function ChannelBadge({ channel }: { channel: 'slack' | 'whatsapp' | 'web' }) {
  const colors = {
    slack: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    whatsapp: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    web: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  };

  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${colors[channel]}`}>
      {channel}
    </span>
  );
}

function StatusBadge({ status }: { status: 'active' | 'resolved' | 'escalated' }) {
  const colors = {
    active: 'bg-green-100 text-green-800',
    resolved: 'bg-gray-100 text-gray-800',
    escalated: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${colors[status]}`}>
      {status}
    </span>
  );
}

export default async function ConversationsPage() {
  const conversations = await getConversations();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Conversations</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Export
          </Button>
          <Button variant="outline" size="sm">
            Filter
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-gray-500">
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Channel</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Last Message</th>
                  <th className="pb-3 font-medium">Messages</th>
                  <th className="pb-3 font-medium">Updated</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((conv) => (
                  <tr key={conv.id} className="border-b last:border-0">
                    <td className="py-4">
                      <span className="font-medium">{conv.userId}</span>
                    </td>
                    <td className="py-4">
                      <ChannelBadge channel={conv.channel} />
                    </td>
                    <td className="py-4">
                      <StatusBadge status={conv.status} />
                    </td>
                    <td className="max-w-xs truncate py-4 text-sm text-gray-500">
                      {conv.lastMessage}
                    </td>
                    <td className="py-4 text-sm">{conv.messageCount}</td>
                    <td className="py-4 text-sm text-gray-500">
                      {new Date(conv.updatedAt).toLocaleString()}
                    </td>
                    <td className="py-4">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
