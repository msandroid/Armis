'use client';

import React from 'react';
import { 
  WebPreview, 
  WebPreviewNavigation, 
  WebPreviewNavigationButton, 
  WebPreviewUrl, 
  WebPreviewBody,
  WebPreviewConsole,
  WebPreviewWithNavigation
} from './web-preview';
import { ArrowLeft, ArrowRight, RotateCcw, ExternalLink } from 'lucide-react';

// Basic WebPreview example
export function BasicWebPreviewExample() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Basic WebPreview Example</h3>
      
      <div className="h-96">
        <WebPreview defaultUrl="https://ai-sdk.dev">
          <WebPreviewNavigation>
            <WebPreviewUrl />
          </WebPreviewNavigation>
          <WebPreviewBody src="https://ai-sdk.dev" />
        </WebPreview>
      </div>
    </div>
  );
}

// WebPreview with navigation controls example
export function WebPreviewWithNavigationExample() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">WebPreview with Navigation Example</h3>
      
      <div className="h-96">
        <WebPreview defaultUrl="https://ai-sdk.dev">
          <WebPreviewNavigation>
            <WebPreviewNavigationButton
              tooltip="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </WebPreviewNavigationButton>
            
            <WebPreviewNavigationButton
              tooltip="Go forward"
            >
              <ArrowRight className="h-4 w-4" />
            </WebPreviewNavigationButton>
            
            <WebPreviewNavigationButton
              tooltip="Refresh"
            >
              <RotateCcw className="h-4 w-4" />
            </WebPreviewNavigationButton>
            
            <WebPreviewUrl placeholder="Enter URL..." />
            
            <WebPreviewNavigationButton
              tooltip="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </WebPreviewNavigationButton>
          </WebPreviewNavigation>
          <WebPreviewBody src="https://ai-sdk.dev" />
        </WebPreview>
      </div>
    </div>
  );
}

// WebPreview with console example
export function WebPreviewWithConsoleExample() {
  const sampleLogs = [
    { level: 'log' as const, message: 'App initialized', timestamp: new Date() },
    { level: 'warn' as const, message: 'Deprecated API used', timestamp: new Date() },
    { level: 'error' as const, message: 'Failed to load resource', timestamp: new Date() },
    { level: 'log' as const, message: 'User interaction detected', timestamp: new Date() }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">WebPreview with Console Example</h3>
      
      <div className="h-96">
        <WebPreview defaultUrl="https://ai-sdk.dev">
          <WebPreviewNavigation>
            <WebPreviewUrl />
          </WebPreviewNavigation>
          <WebPreviewBody src="https://ai-sdk.dev" />
          <WebPreviewConsole logs={sampleLogs} />
        </WebPreview>
      </div>
    </div>
  );
}

// WebPreviewWithNavigation component example
export function WebPreviewWithNavigationComponentExample() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">WebPreviewWithNavigation Component Example</h3>
      
      <div className="h-96">
        <WebPreviewWithNavigation 
          defaultUrl="https://ai-sdk.dev"
          onUrlChange={(url) => console.log('URL changed:', url)}
        />
      </div>
    </div>
  );
}

// WebPreview with custom loading example
export function WebPreviewWithCustomLoadingExample() {
  const customLoading = (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="mt-4 text-muted-foreground">Loading custom preview...</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">WebPreview with Custom Loading Example</h3>
      
      <div className="h-96">
        <WebPreview defaultUrl="https://ai-sdk.dev">
          <WebPreviewNavigation>
            <WebPreviewUrl />
          </WebPreviewNavigation>
          <WebPreviewBody 
            src="https://ai-sdk.dev" 
            loading={customLoading}
          />
        </WebPreview>
      </div>
    </div>
  );
}

// Multiple WebPreview examples
export function MultipleWebPreviewExample() {
  const websites = [
    { name: 'AI SDK', url: 'https://ai-sdk.dev' },
    { name: 'Vercel', url: 'https://vercel.com' },
    { name: 'React', url: 'https://react.dev' }
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Multiple WebPreview Examples</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {websites.map((site) => (
          <div key={site.name} className="space-y-2">
            <h4 className="text-sm font-medium">{site.name}</h4>
            <div className="h-64">
              <WebPreview defaultUrl={site.url}>
                <WebPreviewNavigation>
                  <WebPreviewUrl />
                </WebPreviewNavigation>
                <WebPreviewBody src={site.url} />
              </WebPreview>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Complete example combining all features
export function CompleteWebPreviewExample() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h2 className="text-2xl font-bold">WebPreview Component Examples</h2>
      
      <BasicWebPreviewExample />
      
      <WebPreviewWithNavigationExample />
      
      <WebPreviewWithConsoleExample />
      
      <WebPreviewWithNavigationComponentExample />
      
      <WebPreviewWithCustomLoadingExample />
      
      <MultipleWebPreviewExample />
    </div>
  );
}
