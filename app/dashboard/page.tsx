import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data - in production, fetch from API
async function getDashboardStats() {
  return {
    activeConversations: 12,
    resolvedToday: 45,
    knowledgeDocs: 128,
    apiCosts: 24.50,
    recentConversations: [
      {
        id: '1',
        userId: 'user123',
        channel: 'slack',
        lastMessage: 'How do I reset my password?',
        timestamp: new Date().toISOString(),
        status: 'active',
      },
      {
        id: '2',
        userId: 'user456',
        channel: 'whatsapp',
        lastMessage: 'Thanks for the help!',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: 'resolved',
      },
    ],
  };
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Conversations" value={stats.activeConversations} />
        <StatCard title="Resolved Today" value={stats.resolvedToday} />
        <StatCard title="Knowledge Docs" value={stats.knowledgeDocs} />
        <StatCard title="API Costs (MTD)" value={`$${stats.apiCosts.toFixed(2)}`} />
      </div>

      {/* Recent Conversations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentConversations.map((conv) => (
              <div
                key={conv.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{conv.userId}</span>
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800">
                      {conv.channel}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        conv.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {conv.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{conv.lastMessage}</p>
                </div>
                <span className="text-sm text-gray-400">
                  {new Date(conv.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
