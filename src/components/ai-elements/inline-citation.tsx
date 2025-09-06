'use client';

import * as React from 'react';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';

// InlineCitation component props
export interface InlineCitationProps extends React.ComponentProps<'span'> {}

// InlineCitationText component props
export interface InlineCitationTextProps extends React.ComponentProps<'span'> {}

// InlineCitationCard component props
export interface InlineCitationCardProps extends React.ComponentProps<typeof HoverCardPrimitive.Root> {}

// InlineCitationCardTrigger component props
export interface InlineCitationCardTriggerProps extends React.ComponentProps<typeof HoverCardPrimitive.Trigger> {
  sources: string[];
}

// InlineCitationCardBody component props
export interface InlineCitationCardBodyProps extends React.ComponentProps<typeof HoverCardPrimitive.Content> {}

// InlineCitationCarousel component props
export interface InlineCitationCarouselProps extends React.HTMLAttributes<HTMLDivElement> {}

// InlineCitationCarouselContent component props
export interface InlineCitationCarouselContentProps extends React.HTMLAttributes<HTMLDivElement> {}

// InlineCitationCarouselItem component props
export interface InlineCitationCarouselItemProps extends React.HTMLAttributes<HTMLDivElement> {}

// InlineCitationCarouselHeader component props
export interface InlineCitationCarouselHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

// InlineCitationCarouselIndex component props
export interface InlineCitationCarouselIndexProps extends React.HTMLAttributes<HTMLDivElement> {}

// InlineCitationCarouselPrev component props
export interface InlineCitationCarouselPrevProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

// InlineCitationCarouselNext component props
export interface InlineCitationCarouselNextProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

// InlineCitationSource component props
export interface InlineCitationSourceProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  url?: string;
  description?: string;
}

// InlineCitationQuote component props
export interface InlineCitationQuoteProps extends React.HTMLAttributes<HTMLQuoteElement> {}

// Main InlineCitation component
export function InlineCitation({ 
  children, 
  className,
  ...props 
}: InlineCitationProps) {
  return (
    <span
      className={cn('inline-flex items-center', className)}
      {...props}
    >
      {children}
    </span>
  );
}

// InlineCitationText component
export function InlineCitationText({ 
  children, 
  className,
  ...props 
}: InlineCitationTextProps) {
  return (
    <span
      className={cn('inline', className)}
      {...props}
    >
      {children}
    </span>
  );
}

// InlineCitationCard component
export function InlineCitationCard({ 
  children, 
  className,
  ...props 
}: InlineCitationCardProps) {
  return (
    <HoverCardPrimitive.Root
      openDelay={200}
      closeDelay={300}
      {...props}
    >
      {children}
    </HoverCardPrimitive.Root>
  );
}

// InlineCitationCardTrigger component
export function InlineCitationCardTrigger({ 
  sources = [],
  children,
  className,
  ...props 
}: InlineCitationCardTriggerProps) {
  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const displayText = sources.length > 1 
    ? `${getHostname(sources[0])} +${sources.length - 1}`
    : getHostname(sources[0]);

  return (
    <HoverCardPrimitive.Trigger asChild>
      <button
        type="button"
        className={cn(
          'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium',
          'bg-muted text-muted-foreground rounded-md',
          'hover:bg-muted/80 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className
        )}
        {...props}
      >
        {children || displayText}
      </button>
    </HoverCardPrimitive.Trigger>
  );
}

// InlineCitationCardBody component
export function InlineCitationCardBody({ 
  children, 
  className,
  ...props 
}: InlineCitationCardBodyProps) {
  return (
    <HoverCardPrimitive.Content
      className={cn(
        'z-50 w-80 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      sideOffset={4}
      {...props}
    >
      {children}
    </HoverCardPrimitive.Content>
  );
}

// Simple carousel implementation
const CarouselContext = React.createContext<{
  currentIndex: number;
  totalItems: number;
  goToNext: () => void;
  goToPrev: () => void;
  goToIndex: (index: number) => void;
} | null>(null);

// InlineCitationCarousel component
export function InlineCitationCarousel({ 
  children, 
  className,
  ...props 
}: InlineCitationCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [totalItems, setTotalItems] = React.useState(0);

  const goToNext = React.useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalItems);
  }, [totalItems]);

  const goToPrev = React.useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
  }, [totalItems]);

  const goToIndex = React.useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  React.useEffect(() => {
    const items = React.Children.count(children);
    setTotalItems(items);
  }, [children]);

  return (
    <CarouselContext.Provider value={{ currentIndex, totalItems, goToNext, goToPrev, goToIndex }}>
      <div className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

// InlineCitationCarouselContent component
export function InlineCitationCarouselContent({ 
  children, 
  className,
  ...props 
}: InlineCitationCarouselContentProps) {
  const context = React.useContext(CarouselContext);
  if (!context) throw new Error('CarouselContent must be used within Carousel');

  const { currentIndex } = context;
  const childrenArray = React.Children.toArray(children);

  return (
    <div className={cn('relative overflow-hidden', className)} {...props}>
      <div 
        className="flex transition-transform duration-300 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {childrenArray.map((child, index) => (
          <div key={index} className="w-full flex-shrink-0">
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}

// InlineCitationCarouselItem component
export function InlineCitationCarouselItem({ 
  children, 
  className,
  ...props 
}: InlineCitationCarouselItemProps) {
  return (
    <div className={cn('w-full', className)} {...props}>
      {children}
    </div>
  );
}

// InlineCitationCarouselHeader component
export function InlineCitationCarouselHeader({ 
  children, 
  className,
  ...props 
}: InlineCitationCarouselHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-3', className)} {...props}>
      {children}
    </div>
  );
}

// InlineCitationCarouselIndex component
export function InlineCitationCarouselIndex({ 
  children, 
  className,
  ...props 
}: InlineCitationCarouselIndexProps) {
  const context = React.useContext(CarouselContext);
  if (!context) throw new Error('CarouselIndex must be used within Carousel');

  const { currentIndex, totalItems } = context;

  return (
    <div className={cn('text-sm text-muted-foreground', className)} {...props}>
      {children || `${currentIndex + 1} / ${totalItems}`}
    </div>
  );
}

// InlineCitationCarouselPrev component
export function InlineCitationCarouselPrev({ 
  children,
  className,
  ...props 
}: InlineCitationCarouselPrevProps) {
  const context = React.useContext(CarouselContext);
  if (!context) throw new Error('CarouselPrev must be used within Carousel');

  const { goToPrev, totalItems } = context;

  return (
    <button
      type="button"
      onClick={goToPrev}
      disabled={totalItems <= 1}
      className={cn(
        'p-1 rounded-md hover:bg-muted transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      {...props}
    >
      {children || <ChevronLeft className="h-4 w-4" />}
    </button>
  );
}

// InlineCitationCarouselNext component
export function InlineCitationCarouselNext({ 
  children,
  className,
  ...props 
}: InlineCitationCarouselNextProps) {
  const context = React.useContext(CarouselContext);
  if (!context) throw new Error('CarouselNext must be used within Carousel');

  const { goToNext, totalItems } = context;

  return (
    <button
      type="button"
      onClick={goToNext}
      disabled={totalItems <= 1}
      className={cn(
        'p-1 rounded-md hover:bg-muted transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      {...props}
    >
      {children || <ChevronRight className="h-4 w-4" />}
    </button>
  );
}

// InlineCitationSource component
export function InlineCitationSource({ 
  title,
  url,
  description,
  children,
  className,
  ...props 
}: InlineCitationSourceProps) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {title && (
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm">{title}</h4>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}
      {url && (
        <p className="text-xs text-muted-foreground break-all">
          {url}
        </p>
      )}
      {description && (
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {children}
    </div>
  );
}

// InlineCitationQuote component
export function InlineCitationQuote({ 
  children,
  className,
  ...props 
}: InlineCitationQuoteProps) {
  return (
    <blockquote
      className={cn(
        'mt-3 pl-3 border-l-2 border-muted-foreground/20 text-sm text-muted-foreground italic',
        className
      )}
      {...props}
    >
      "{children}"
    </blockquote>
  );
}
