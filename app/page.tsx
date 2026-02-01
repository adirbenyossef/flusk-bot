import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4">Agent Platform</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          AI-powered messaging platform for Slack and WhatsApp
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/api/health"
            className="px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Health Check
          </Link>
        </div>
      </main>
    </div>
  );
}
