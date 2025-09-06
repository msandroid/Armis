# Sources Component

The `Sources` component allows users to view the sources or citations used to generate a response. It provides a collapsible interface for displaying multiple sources with proper styling and accessibility features.

## Features

- Collapsible component for viewing sources or citations
- Customizable trigger and content components
- Support for custom sources or citations
- Responsive design with mobile-friendly controls
- Clean, modern styling with customizable themes
- Automatic count display (e.g., "Used 3 sources")
- External link indicators for better UX

## Installation

The Sources component is already included in the project and uses the following dependencies:
- `@radix-ui/react-collapsible`
- `lucide-react`
- Tailwind CSS

## Usage

### Basic Usage

```tsx
import { 
  Source, 
  Sources, 
  SourcesContent, 
  SourcesTrigger 
} from '@/components/ai-elements/sources';

<Sources>
  <SourcesTrigger count={3} />
  <SourcesContent>
    <Source 
      href="https://ai-sdk.dev" 
      title="AI SDK Documentation"
      description="Official documentation for AI SDK"
    />
    <Source 
      href="https://vercel.com/docs" 
      title="Vercel Documentation"
      description="Deploy AI applications with Vercel"
    />
    <Source 
      href="https://react.dev" 
      title="React Documentation"
      description="Learn React with interactive examples"
    />
  </SourcesContent>
</Sources>
```

### Using SourcesList for Multiple Sources

```tsx
import { SourcesList } from '@/components/ai-elements/sources';

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
  }
];

<SourcesList sources={sources} defaultOpen={true} />
```

### Custom Styling

```tsx
<Sources className="bg-blue-50 p-2 rounded-lg">
  <SourcesTrigger count={2} />
  <SourcesContent className="bg-white border rounded-lg p-2">
    <Source 
      href="https://github.com/vercel/ai" 
      title="AI SDK GitHub Repository"
      description="Open source AI SDK for building AI applications"
    />
  </SourcesContent>
</Sources>
```

## API Reference

### Sources

The main container component for sources.

#### Props

- `defaultOpen?: boolean` - Whether the sources content is open by default
- `...props` - All other props are spread to the root div

### SourcesTrigger

The clickable trigger that shows the source count.

#### Props

- `count?: number` - The number of sources to display in the trigger
- `isOpen?: boolean` - Whether the sources are currently open
- `...props` - All other props are spread to the trigger button

**Note**: If `count` is 0, the trigger will not render.

### SourcesContent

The collapsible content area for the sources.

#### Props

- `...props` - All other props are spread to the content container

### Source

A single source or citation link.

#### Props

- `href: string` - The URL of the source
- `title?: string` - The title of the source (defaults to href if not provided)
- `description?: string` - Optional description of the source
- `...props` - All other props are spread to the anchor element

### SourcesList

A container for managing multiple sources with automatic trigger and content management.

#### Props

- `sources?: Array<SourceData>` - Array of source data objects
- `defaultOpen?: boolean` - Whether the sources are open by default
- `...props` - All other props are spread to the underlying div

#### SourceData Interface

```tsx
interface SourceData {
  id: string;
  href: string;
  title?: string;
  description?: string;
}
```

## Styling

The Sources component uses Tailwind CSS classes and follows the project's design system:

- **Trigger**: Small text with muted color, hover effects, and chevron icon
- **Content**: Collapsible area with smooth animations
- **Source Links**: Card-like appearance with hover effects and external link icons
- **Responsive**: Mobile-friendly design with proper touch targets

## Accessibility

- Full keyboard navigation support
- Screen reader compatible
- Proper ARIA attributes via Radix UI
- Focus management for collapsible content
- External link indicators for better UX

## Integration with AI SDK

The Sources component is designed to work seamlessly with AI SDK's streaming responses. When using with AI SDK, you can extract source URLs from message parts:

```tsx
import { useChat } from '@ai-sdk/react';

const { messages } = useChat();

{messages.map((message) => (
  <div key={message.id}>
    {message.role === 'assistant' && (
      <Sources>
        <SourcesTrigger
          count={
            message.parts.filter(
              (part) => part.type === 'source-url',
            ).length
          }
        />
        {message.parts.map((part, i) => {
          switch (part.type) {
            case 'source-url':
              return (
                <SourcesContent key={`${message.id}-${i}`}>
                  <Source
                    key={`${message.id}-${i}`}
                    href={part.url}
                    title={part.url}
                  />
                </SourcesContent>
              );
          }
        })}
      </Sources>
    )}
    {/* Message content */}
  </div>
))}
```

## Examples

See `sources-example.tsx` for complete usage examples including:
- Basic sources usage
- Custom styling examples
- SourcesList with multiple sources
- Different count scenarios
- Complete integration examples
