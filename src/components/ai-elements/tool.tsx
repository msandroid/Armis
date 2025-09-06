'use client';

import * as React from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { ChevronDown, Play, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

// Tool state types
export type ToolState = 'input-streaming' | 'input-available' | 'output-available' | 'output-error';

// Tool component props
export interface ToolProps extends React.ComponentProps<typeof CollapsiblePrimitive.Root> {
  defaultOpen?: boolean;
}

// ToolHeader component props
export interface ToolHeaderProps extends React.ComponentProps<typeof CollapsiblePrimitive.Trigger> {
  type: string;
  state: ToolState;
  className?: string;
}

// ToolContent component props
export interface ToolContentProps extends React.ComponentProps<typeof CollapsiblePrimitive.Content> {}

// ToolInput component props
export interface ToolInputProps extends React.HTMLAttributes<HTMLDivElement> {
  input: any;
}

// ToolOutput component props
export interface ToolOutputProps extends React.HTMLAttributes<HTMLDivElement> {
  output?: React.ReactNode;
  errorText?: string;
}

// State icon component
const StateIcon = ({ state }: { state: ToolState }) => {
  switch (state) {
    case 'input-streaming':
      return <Clock className="h-4 w-4 text-muted-foreground" />;
    case 'input-available':
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'output-available':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'output-error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Play className="h-4 w-4 text-muted-foreground" />;
  }
};

// State label component
const StateLabel = ({ state }: { state: ToolState }) => {
  switch (state) {
    case 'input-streaming':
      return 'Pending';
    case 'input-available':
      return 'Running';
    case 'output-available':
      return 'Completed';
    case 'output-error':
      return 'Error';
    default:
      return 'Unknown';
  }
};

// Main Tool component
export function Tool({ 
  children, 
  defaultOpen = false,
  className,
  ...props 
}: ToolProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <CollapsiblePrimitive.Root
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn(
        'border rounded-lg bg-background',
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === ToolHeader) {
          return React.cloneElement(child, { isOpen } as any);
        }
        return child;
      })}
    </CollapsiblePrimitive.Root>
  );
}

// ToolHeader component
export function ToolHeader({ 
  type, 
  state, 
  isOpen = false,
  className,
  children,
  ...props 
}: ToolHeaderProps) {
  return (
    <CollapsiblePrimitive.Trigger
      className={cn(
        'flex w-full items-center justify-between p-4 text-left font-medium transition-all hover:bg-muted/50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        <StateIcon state={state} />
        <div className="flex flex-col items-start">
          <span className="text-base font-semibold">{type}</span>
          <span className={cn(
            'text-xs px-2 py-1 rounded-full',
            state === 'input-streaming' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
            state === 'input-available' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
            state === 'output-available' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            state === 'output-error' && 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          )}>
            <StateLabel state={state} />
          </span>
        </div>
      </div>
      <ChevronDown 
        className={cn(
          "h-4 w-4 shrink-0 transition-transform duration-200",
          isOpen && "rotate-180"
        )} 
      />
    </CollapsiblePrimitive.Trigger>
  );
}

// ToolContent component
export function ToolContent({ 
  className,
  children,
  ...props 
}: ToolContentProps) {
  return (
    <CollapsiblePrimitive.Content
      className={cn(
        'overflow-hidden text-base transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down',
        className
      )}
      {...props}
    >
      <div className="p-2 pt-0">
        {children}
      </div>
    </CollapsiblePrimitive.Content>
  );
}

// ToolInput component
export function ToolInput({ 
  input,
  className,
  children,
  ...props 
}: ToolInputProps) {
  const formatInput = (input: any): string => {
    if (typeof input === 'string') {
      return input;
    }
    try {
      return JSON.stringify(input, null, 2);
    } catch {
      return String(input);
    }
  };

  return (
    <div className={cn('space-y-2', className)} {...props}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-muted-foreground">Input</span>
      </div>
      <div className="bg-muted rounded-md p-3">
        <pre className="text-xs overflow-x-auto">
          <code>{formatInput(input)}</code>
        </pre>
      </div>
      {children}
    </div>
  );
}

// ToolOutput component
export function ToolOutput({ 
  output,
  errorText,
  className,
  children,
  ...props 
}: ToolOutputProps) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-muted-foreground">
          {errorText ? 'Error' : 'Output'}
        </span>
      </div>
      
      {errorText ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700 dark:text-red-300">
              {errorText}
            </div>
          </div>
        </div>
      ) : output ? (
        <div className="bg-muted rounded-md p-3">
          {typeof output === 'string' ? (
            <pre className="text-xs overflow-x-auto">
              <code>{output}</code>
            </pre>
          ) : (
            <div className="text-sm">
              {output}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-muted rounded-md p-3">
          <div className="text-xs text-muted-foreground">
            No output available
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

// ToolUIPart type for AI SDK integration
export interface ToolUIPart<T = any> {
  type: string;
  state: ToolState;
  input: any;
  output?: T;
  errorText?: string;
}

// Helper component for rendering ToolUIPart
export function ToolUIPartRenderer({ 
  toolPart,
  defaultOpen,
  className,
  ...props 
}: {
  toolPart: ToolUIPart;
  defaultOpen?: boolean;
  className?: string;
}) {
  const shouldOpenByDefault = defaultOpen ?? 
    (toolPart.state === 'output-available' || 
    toolPart.state === 'output-error');

  return (
    <Tool defaultOpen={shouldOpenByDefault} className={className} {...props}>
      <ToolHeader type={toolPart.type} state={toolPart.state} />
      <ToolContent>
        <ToolInput input={toolPart.input} />
        <ToolOutput 
          output={toolPart.output} 
          errorText={toolPart.errorText} 
        />
      </ToolContent>
    </Tool>
  );
}
