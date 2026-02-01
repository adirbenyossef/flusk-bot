'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const AVAILABLE_MODELS = [
  { id: 'anthropic/claude-sonnet-4-20250514', name: 'Claude Sonnet 4', tier: 'balanced' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', tier: 'powerful' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', tier: 'fast' },
  { id: 'google/gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', tier: 'fast' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', tier: 'cheap' },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    defaultModel: 'anthropic/claude-sonnet-4-20250514',
    maxTokens: 2048,
    systemPrompt: `You are a helpful AI assistant for our company. You help users by answering questions and searching our knowledge base.

Guidelines:
- Be concise and helpful
- If you don't know something, say so
- Use the searchKnowledge tool when needed
- Be professional and friendly`,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    alert('Settings saved successfully!');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Agent Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Configuration</CardTitle>
          <CardDescription>Configure the AI agent behavior and model selection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium">Default Model</label>
            <select
              value={settings.defaultModel}
              onChange={(e) => setSettings({ ...settings, defaultModel: e.target.value })}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            >
              {AVAILABLE_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.tier})
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Select the default model for agent responses
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium">Max Tokens</label>
            <input
              type="number"
              value={settings.maxTokens}
              onChange={(e) =>
                setSettings({ ...settings, maxTokens: parseInt(e.target.value) || 2048 })
              }
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            />
            <p className="mt-1 text-sm text-gray-500">
              Maximum tokens per response (recommended: 2048-4096)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium">System Prompt</label>
            <textarea
              value={settings.systemPrompt}
              onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
              rows={10}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm dark:border-gray-700 dark:bg-gray-800"
            />
            <p className="mt-1 text-sm text-gray-500">
              The system prompt that defines the agent&apos;s behavior
            </p>
          </div>

          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* Channel Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Configuration</CardTitle>
          <CardDescription>Configure Slack and WhatsApp integrations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Slack</h3>
                <p className="text-sm text-gray-500">Connect your Slack workspace</p>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">WhatsApp</h3>
                <p className="text-sm text-gray-500">Connect WhatsApp Business API</p>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Web Chat</h3>
                <p className="text-sm text-gray-500">Embed chat widget on your website</p>
              </div>
              <Button variant="outline" size="sm">
                Get Code
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>Manage API keys and integrations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium">OpenRouter API Key</label>
            <div className="mt-1 flex gap-2">
              <input
                type="password"
                value="sk-or-••••••••••••••••"
                readOnly
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
              />
              <Button variant="outline">Update</Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">MongoDB Connection</label>
            <div className="mt-1 flex gap-2">
              <input
                type="password"
                value="mongodb+srv://••••••••••••"
                readOnly
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
              />
              <Button variant="outline">Update</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
