'use client';

import React from 'react';
import { 
  Source, 
  Sources, 
  SourcesContent, 
  SourcesTrigger, 
  SourcesList 
} from './sources';

// Basic Sources example
export function BasicSourcesExample() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Basic Sources Example</h3>
      
      <Sources>
        <SourcesTrigger count={3} />
        <SourcesContent>
          <Source 
            href="https://ai-sdk.dev" 
            title="AI SDK Documentation"
            description="Official documentation for AI SDK with examples and API reference"
          />
          <Source 
            href="https://vercel.com/docs" 
            title="Vercel Documentation"
            description="Deploy AI applications with Vercel's infrastructure"
          />
          <Source 
            href="https://react.dev" 
            title="React Documentation"
            description="Learn React with interactive examples and tutorials"
          />
        </SourcesContent>
      </Sources>
    </div>
  );
}

// Sources with custom styling example
export function CustomSourcesExample() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Custom Sources Example</h3>
      
      <Sources className="bg-blue-50 p-2 rounded-lg">
        <SourcesTrigger count={2} />
        <SourcesContent className="bg-white border rounded-lg p-2">
          <Source 
            href="https://github.com/vercel/ai" 
            title="AI SDK GitHub Repository"
            description="Open source AI SDK for building AI applications"
          />
          <Source 
            href="https://nextjs.org/docs" 
            title="Next.js Documentation"
            description="The React framework for production"
          />
        </SourcesContent>
      </Sources>
    </div>
  );
}

// SourcesList example
export function SourcesListExample() {
  const sources = [
    {
      id: '1',
      href: 'https://ai-sdk.dev/elements/components/sources',
      title: 'AI SDK Sources Component',
      description: 'Official documentation for the Sources component'
    },
    {
      id: '2',
      href: 'https://vercel.com/ai',
      title: 'Vercel AI',
      description: 'Build AI applications with Vercel'
    },
    {
      id: '3',
      href: 'https://radix-ui.com/primitives/docs/components/collapsible',
      title: 'Radix UI Collapsible',
      description: 'Unstyled, accessible collapsible component'
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">SourcesList Example</h3>
      
      <SourcesList sources={sources} defaultOpen={true} />
    </div>
  );
}

// Sources with different counts example
export function SourcesCountExample() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Sources Count Examples</h3>
      
      <div className="space-y-2">
        <div>
          <span className="text-sm text-muted-foreground">1 source: </span>
          <Sources>
            <SourcesTrigger count={1} />
            <SourcesContent>
              <Source 
                href="https://example.com" 
                title="Example Source"
              />
            </SourcesContent>
          </Sources>
        </div>
        
        <div>
          <span className="text-sm text-muted-foreground">2 sources: </span>
          <Sources>
            <SourcesTrigger count={2} />
            <SourcesContent>
              <Source 
                href="https://example1.com" 
                title="Example Source 1"
              />
              <Source 
                href="https://example2.com" 
                title="Example Source 2"
              />
            </SourcesContent>
          </Sources>
        </div>
        
        <div>
          <span className="text-sm text-muted-foreground">0 sources (hidden): </span>
          <Sources>
            <SourcesTrigger count={0} />
            <SourcesContent>
              <Source 
                href="https://example.com" 
                title="This won't show"
              />
            </SourcesContent>
          </Sources>
        </div>
      </div>
    </div>
  );
}

// Complete example combining all features
export function CompleteSourcesExample() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">Sources Component Examples</h2>
      
      <BasicSourcesExample />
      
      <CustomSourcesExample />
      
      <SourcesListExample />
      
      <SourcesCountExample />
    </div>
  );
}
