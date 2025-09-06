'use client';

import * as React from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';

// Sources component props
export interface SourcesProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean;
}

// SourcesTrigger component props
export interface SourcesTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  count?: number;
  isOpen?: boolean;
}

// SourcesContent component props
export interface SourcesContentProps extends React.HTMLAttributes<HTMLDivElement> {}

// Source component props
export interface SourceProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  title?: string;
  description?: string;
}

// Main Sources component
export function Sources({ 
  children, 
  defaultOpen = false,
  className,
  ...props 
}: SourcesProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div
      className={cn(
        'inline-flex items-center',
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === SourcesTrigger) {
          return React.cloneElement(child, { isOpen } as any);
        }
        return child;
      })}
    </div>
  );
}

// SourcesTrigger component
export function SourcesTrigger({ 
  count = 0,
  isOpen = false,
  className,
  children,
  ...props 
}: SourcesTriggerProps) {
  if (count === 0) return null;

  return (
    <CollapsiblePrimitive.Trigger
      asChild
      className={cn(
        'inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded',
        className
      )}
      {...props}
    >
      <button type="button">
        <span>Used {count} source{count !== 1 ? 's' : ''}</span>
        <ChevronDown 
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </button>
    </CollapsiblePrimitive.Trigger>
  );
}

// SourcesContent component
export function SourcesContent({ 
  className,
  children,
  ...props 
}: SourcesContentProps) {
  return (
    <CollapsiblePrimitive.Content
      className={cn(
        'overflow-hidden text-sm transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down',
        'mt-2 space-y-2',
        className
      )}
      {...props}
    >
      {children}
    </CollapsiblePrimitive.Content>
  );
}

// Source component
export function Source({ 
  href,
  title,
  description,
  className,
  children,
  ...props 
}: SourceProps) {
  const displayTitle = title || href;
  const displayDescription = description || href;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'block p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{displayTitle}</span>
            <ExternalLink className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {displayDescription}
            </p>
          )}
        </div>
      </div>
      {children}
    </a>
  );
}

// SourcesList component for managing multiple sources
export interface SourcesListProps extends React.HTMLAttributes<HTMLDivElement> {
  sources?: Array<{
    id: string;
    href: string;
    title?: string;
    description?: string;
  }>;
  defaultOpen?: boolean;
}

export function SourcesList({ 
  sources = [], 
  defaultOpen = false,
  className,
  children,
  ...props 
}: SourcesListProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  if (sources.length === 0) return null;

  return (
    <div className={cn('inline-flex items-center', className)} {...props}>
      <CollapsiblePrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
        <SourcesTrigger count={sources.length} isOpen={isOpen} />
        <SourcesContent>
          {sources.map((source) => (
            <Source
              key={source.id}
              href={source.href}
              title={source.title}
              description={source.description}
            />
          ))}
        </SourcesContent>
      </CollapsiblePrimitive.Root>
    </div>
  );
}
