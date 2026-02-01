'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Mock data
const mockDocs = [
  {
    id: '1',
    title: 'Password Reset Guide',
    category: 'Account',
    tags: ['password', 'account', 'security'],
    source: 'manual' as const,
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Billing FAQ',
    category: 'Billing',
    tags: ['billing', 'payment', 'invoice'],
    source: 'notion' as const,
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    title: 'API Documentation',
    category: 'Technical',
    tags: ['api', 'integration', 'developer'],
    source: 'confluence' as const,
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

function SourceBadge({ source }: { source: string }) {
  const colors: Record<string, string> = {
    manual: 'bg-blue-100 text-blue-800',
    notion: 'bg-gray-100 text-gray-800',
    confluence: 'bg-orange-100 text-orange-800',
    gdrive: 'bg-green-100 text-green-800',
  };

  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${colors[source] || colors.manual}`}>
      {source}
    </span>
  );
}

export default function KnowledgePage() {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    setIsUploading(true);
    // Simulate upload
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsUploading(false);
    alert('Document uploaded successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Knowledge Base</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Sync Sources
          </Button>
          <Button size="sm" onClick={handleUpload} disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{mockDocs.length}</div>
            <p className="text-sm text-gray-500">Total Documents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">3</div>
            <p className="text-sm text-gray-500">Categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">2</div>
            <p className="text-sm text-gray-500">Connected Sources</p>
          </CardContent>
        </Card>
      </div>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{doc.title}</span>
                    <SourceBadge source={doc.source} />
                  </div>
                  <div className="flex gap-2">
                    <span className="text-sm text-gray-500">{doc.category}</span>
                    <span className="text-gray-300">|</span>
                    <div className="flex gap-1">
                      {doc.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">
                    {new Date(doc.updatedAt).toLocaleDateString()}
                  </span>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm">
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Document</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Title</label>
              <input
                type="text"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                placeholder="Document title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Category</label>
              <select className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                <option>Account</option>
                <option>Billing</option>
                <option>Technical</option>
                <option>General</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Content</label>
              <textarea
                rows={6}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                placeholder="Document content..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Tags (comma-separated)</label>
              <input
                type="text"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                placeholder="tag1, tag2, tag3"
              />
            </div>
            <Button type="submit">Add Document</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
