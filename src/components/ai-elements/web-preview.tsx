'use client';

import * as React from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, ExternalLink, Maximize, Minimize, Monitor, Tablet, Smartphone } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// WebPreview component props
export interface WebPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultUrl?: string;
  onUrlChange?: (url: string) => void;
}

// WebPreviewNavigation component props
export interface WebPreviewNavigationProps extends React.HTMLAttributes<HTMLDivElement> {}

// WebPreviewNavigationButton component props
export interface WebPreviewNavigationButtonProps extends React.ComponentProps<typeof Button> {
  tooltip?: string;
}

// WebPreviewUrl component props
export interface WebPreviewUrlProps extends React.ComponentProps<typeof Input> {}

// WebPreviewBody component props
export interface WebPreviewBodyProps extends React.IframeHTMLAttributes<HTMLIFrameElement> {
  loading?: React.ReactNode;
}

// WebPreviewConsole component props
export interface WebPreviewConsoleProps extends React.HTMLAttributes<HTMLDivElement> {
  logs?: Array<{ level: 'log' | 'warn' | 'error'; message: string; timestamp: Date }>;
}

// Device type for responsive preview
export type DeviceType = 'desktop' | 'tablet' | 'mobile';

// Main WebPreview component
export function WebPreview({ 
  children, 
  defaultUrl = '',
  onUrlChange,
  className,
  ...props 
}: WebPreviewProps) {
  const [currentUrl, setCurrentUrl] = React.useState(defaultUrl);
  const [deviceType, setDeviceType] = React.useState<DeviceType>('desktop');
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [consoleLogs, setConsoleLogs] = React.useState<Array<{ level: 'log' | 'warn' | 'error'; message: string; timestamp: Date }>>([]);

  const handleUrlChange = (url: string) => {
    setCurrentUrl(url);
    onUrlChange?.(url);
  };

  const deviceWidths = {
    desktop: 'w-full',
    tablet: 'w-[768px]',
    mobile: 'w-[375px]'
  };

  const deviceHeights = {
    desktop: 'h-full',
    tablet: 'h-[1024px]',
    mobile: 'h-[667px]'
  };

  return (
    <div
      className={cn(
        'flex flex-col border rounded-lg bg-background overflow-hidden',
        isFullscreen && 'fixed inset-0 z-50',
        className
      )}
      {...props}
    >
      {children}
      
      {/* Device selector and fullscreen controls */}
      <div className="flex items-center justify-between p-2 border-t bg-muted/50">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeviceType('desktop')}
            className={cn(
              'h-8 w-8 p-0',
              deviceType === 'desktop' && 'bg-background'
            )}
            title="Desktop"
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeviceType('tablet')}
            className={cn(
              'h-8 w-8 p-0',
              deviceType === 'tablet' && 'bg-background'
            )}
            title="Tablet"
          >
            <Tablet className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeviceType('mobile')}
            className={cn(
              'h-8 w-8 p-0',
              deviceType === 'mobile' && 'bg-background'
            )}
            title="Mobile"
          >
            <Smartphone className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-8 w-8 p-0"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Preview container with device sizing */}
      <div className={cn(
        'flex-1 overflow-hidden',
        deviceType !== 'desktop' && 'flex justify-center bg-muted/20'
      )}>
        <div className={cn(
          'h-full transition-all duration-300',
          deviceWidths[deviceType],
          deviceHeights[deviceType]
        )}>
          {/* This will be populated by WebPreviewBody */}
        </div>
      </div>
    </div>
  );
}

// WebPreviewNavigation component
export function WebPreviewNavigation({ 
  children, 
  className,
  ...props 
}: WebPreviewNavigationProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 border-b bg-muted/50',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// WebPreviewNavigationButton component
export function WebPreviewNavigationButton({ 
  tooltip,
  children,
  className,
  ...props 
}: WebPreviewNavigationButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('h-8 w-8 p-0', className)}
      title={tooltip}
      {...props}
    >
      {children}
    </Button>
  );
}

// WebPreviewUrl component
export function WebPreviewUrl({ 
  className,
  ...props 
}: WebPreviewUrlProps) {
  return (
    <Input
      className={cn('flex-1 h-8 text-sm', className)}
      placeholder="Enter URL..."
      {...props}
    />
  );
}

// WebPreviewBody component
export function WebPreviewBody({ 
  src,
  loading,
  className,
  children,
  ...props 
}: WebPreviewBodyProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const handleLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleError = () => {
    setIsLoading(false);
    setError('Failed to load preview');
  };

  return (
    <div className={cn('relative h-full', className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          {loading || (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">Loading preview...</span>
            </div>
          )}
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm text-destructive">{error}</span>
          </div>
        </div>
      )}
      
      {src && (
        <iframe
          src={src}
          className="w-full h-full border-0"
          onLoad={handleLoad}
          onError={handleError}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          {...props}
        />
      )}
      
      {children}
    </div>
  );
}

// WebPreviewConsole component
export function WebPreviewConsole({ 
  logs = [],
  className,
  children,
  ...props 
}: WebPreviewConsoleProps) {
  const getLogIcon = (level: 'log' | 'warn' | 'error') => {
    switch (level) {
      case 'warn':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const getLogColor = (level: 'log' | 'warn' | 'error') => {
    switch (level) {
      case 'warn':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div
      className={cn(
        'border-t bg-muted/30 p-3 space-y-2 max-h-32 overflow-y-auto',
        className
      )}
      {...props}
    >
      <div className="text-xs font-medium text-muted-foreground mb-2">
        Console ({logs.length} logs)
      </div>
      
      {logs.length === 0 ? (
        <div className="text-xs text-muted-foreground">
          No console logs yet
        </div>
      ) : (
        <div className="space-y-1">
          {logs.map((log, index) => (
            <div key={index} className="flex items-start gap-2 text-xs">
              <span className="flex-shrink-0">{getLogIcon(log.level)}</span>
              <span className="text-muted-foreground">
                {log.timestamp.toLocaleTimeString()}
              </span>
              <span className={cn('flex-1', getLogColor(log.level))}>
                {log.message}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {children}
    </div>
  );
}

// Enhanced WebPreview with navigation controls
export function WebPreviewWithNavigation({ 
  defaultUrl = '',
  onUrlChange,
  className,
  ...props 
}: WebPreviewProps) {
  const [currentUrl, setCurrentUrl] = React.useState(defaultUrl);
  const [history, setHistory] = React.useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = React.useState(-1);

  const handleUrlChange = (url: string) => {
    setCurrentUrl(url);
    setHistory(prev => [...prev.slice(0, historyIndex + 1), url]);
    setHistoryIndex(prev => prev + 1);
    onUrlChange?.(url);
  };

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  const goBack = () => {
    if (canGoBack) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentUrl(history[newIndex]);
      onUrlChange?.(history[newIndex]);
    }
  };

  const goForward = () => {
    if (canGoForward) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentUrl(history[newIndex]);
      onUrlChange?.(history[newIndex]);
    }
  };

  const refresh = () => {
    // Force iframe refresh by updating the key
    const iframe = document.querySelector('iframe');
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  return (
    <WebPreview defaultUrl={defaultUrl} onUrlChange={onUrlChange} className={className} {...props}>
      <WebPreviewNavigation>
        <WebPreviewNavigationButton
          onClick={goBack}
          disabled={!canGoBack}
          tooltip="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </WebPreviewNavigationButton>
        
        <WebPreviewNavigationButton
          onClick={goForward}
          disabled={!canGoForward}
          tooltip="Go forward"
        >
          <ArrowRight className="h-4 w-4" />
        </WebPreviewNavigationButton>
        
        <WebPreviewNavigationButton
          onClick={refresh}
          tooltip="Refresh"
        >
          <RotateCcw className="h-4 w-4" />
        </WebPreviewNavigationButton>
        
        <WebPreviewUrl
          value={currentUrl}
          onChange={(e) => handleUrlChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleUrlChange(e.currentTarget.value);
            }
          }}
        />
        
        <WebPreviewNavigationButton
          onClick={() => window.open(currentUrl, '_blank')}
          tooltip="Open in new tab"
        >
          <ExternalLink className="h-4 w-4" />
        </WebPreviewNavigationButton>
      </WebPreviewNavigation>
      
      <WebPreviewBody src={currentUrl} />
    </WebPreview>
  );
}
