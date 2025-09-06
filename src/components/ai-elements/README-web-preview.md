# WebPreview Component

The `WebPreview` component provides a flexible way to showcase the result of a generated UI component, along with its source code. It is designed for documentation and demo purposes, allowing users to interact with live examples and view the underlying implementation.

## Features

- Live preview of UI components via iframe
- Composable architecture with dedicated sub-components
- Responsive design modes (Desktop, Tablet, Mobile)
- Navigation controls with back/forward functionality
- URL input and example selector
- Full screen mode support
- Console logging with timestamps
- Context-based state management
- Consistent styling with the design system
- Easy integration into documentation pages

## Installation

The WebPreview component is already included in the project and uses the following dependencies:
- `lucide-react`
- `@radix-ui/react-collapsible` (for other components)
- Tailwind CSS

## Usage

### Basic Usage

```tsx
import {
  WebPreview,
  WebPreviewNavigation,
  WebPreviewUrl,
  WebPreviewBody,
} from '@/components/ai-elements/web-preview';

<WebPreview defaultUrl="https://ai-sdk.dev" style={{ height: '400px' }}>
  <WebPreviewNavigation>
    <WebPreviewUrl src="https://ai-sdk.dev" />
  </WebPreviewNavigation>
  <WebPreviewBody src="https://ai-sdk.dev" />
</WebPreview>
```

### With Navigation Controls

```tsx
import { ArrowLeft, ArrowRight, RotateCcw, ExternalLink } from 'lucide-react';

<WebPreview defaultUrl="https://ai-sdk.dev">
  <WebPreviewNavigation>
    <WebPreviewNavigationButton tooltip="Go back">
      <ArrowLeft className="h-4 w-4" />
    </WebPreviewNavigationButton>
    
    <WebPreviewNavigationButton tooltip="Go forward">
      <ArrowRight className="h-4 w-4" />
    </WebPreviewNavigationButton>
    
    <WebPreviewNavigationButton tooltip="Refresh">
      <RotateCcw className="h-4 w-4" />
    </WebPreviewNavigationButton>
    
    <WebPreviewUrl placeholder="Enter URL..." />
    
    <WebPreviewNavigationButton tooltip="Open in new tab">
      <ExternalLink className="h-4 w-4" />
    </WebPreviewNavigationButton>
  </WebPreviewNavigation>
  <WebPreviewBody src="https://ai-sdk.dev" />
</WebPreview>
```

### With Console Logging

```tsx
const sampleLogs = [
  { level: 'log', message: 'App initialized', timestamp: new Date() },
  { level: 'warn', message: 'Deprecated API used', timestamp: new Date() },
  { level: 'error', message: 'Failed to load resource', timestamp: new Date() }
];

<WebPreview defaultUrl="https://ai-sdk.dev">
  <WebPreviewNavigation>
    <WebPreviewUrl />
  </WebPreviewNavigation>
  <WebPreviewBody src="https://ai-sdk.dev" />
  <WebPreviewConsole logs={sampleLogs} />
</WebPreview>
```

### Using WebPreviewWithNavigation Component

```tsx
import { WebPreviewWithNavigation } from '@/components/ai-elements/web-preview';

<WebPreviewWithNavigation 
  defaultUrl="https://ai-sdk.dev"
  onUrlChange={(url) => console.log('URL changed:', url)}
  style={{ height: '400px' }}
/>
```

## API Reference

### WebPreview

The main container component for web previews.

#### Props

- `defaultUrl?: string` - The initial URL to load in the preview (default: empty string)
- `onUrlChange?: (url: string) => void` - Callback fired when the URL changes
- `...props` - Any other props are spread to the root div

### WebPreviewNavigation

Container for navigation controls.

#### Props

- `...props` - Any other props are spread to the navigation container

### WebPreviewNavigationButton

Navigation button component.

#### Props

- `tooltip?: string` - Tooltip text to display on hover
- `...props` - Any other props are spread to the underlying Button component

### WebPreviewUrl

URL input component.

#### Props

- `...props` - Any other props are spread to the underlying Input component

### WebPreviewBody

The iframe container for the web preview.

#### Props

- `loading?: React.ReactNode` - Optional loading indicator to display over the preview
- `...props` - Any other props are spread to the underlying iframe

### WebPreviewConsole

Console log display component.

#### Props

- `logs?: Array<{ level: "log" | "warn" | "error"; message: string; timestamp: Date }>` - Console log entries to display
- `...props` - Any other props are spread to the root div

### WebPreviewWithNavigation

Enhanced component with built-in navigation controls.

#### Props

- `defaultUrl?: string` - The initial URL to load
- `onUrlChange?: (url: string) => void` - Callback fired when the URL changes
- `...props` - Any other props are spread to the WebPreview component

## Device Types

The WebPreview component supports three device types for responsive preview:

- **Desktop**: Full width and height
- **Tablet**: 768px width, 1024px height
- **Mobile**: 375px width, 667px height

Device selection is controlled by buttons in the preview toolbar.

## Features

### Responsive Design

The component automatically adjusts the preview size based on the selected device type:

```tsx
// The preview will automatically resize based on device selection
<WebPreview defaultUrl="https://example.com">
  {/* Navigation and body components */}
</WebPreview>
```

### Fullscreen Mode

Toggle fullscreen mode to view the preview in full screen:

```tsx
// Fullscreen toggle is available in the toolbar
<WebPreview defaultUrl="https://example.com">
  {/* Components */}
</WebPreview>
```

### Console Logging

Display console logs with different levels and timestamps:

```tsx
const logs = [
  { level: 'log', message: 'Info message', timestamp: new Date() },
  { level: 'warn', message: 'Warning message', timestamp: new Date() },
  { level: 'error', message: 'Error message', timestamp: new Date() }
];

<WebPreviewConsole logs={logs} />
```

### Custom Loading States

Provide custom loading indicators:

```tsx
const customLoading = (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    <span className="ml-2">Loading...</span>
  </div>
);

<WebPreviewBody src="https://example.com" loading={customLoading} />
```

## Security

The WebPreview component uses iframe sandboxing for security:

```tsx
// Default sandbox attributes
sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
```

This allows the preview to run scripts and interact with forms while maintaining security boundaries.

## Accessibility

- Full keyboard navigation support
- Screen reader compatible
- Proper ARIA labels and tooltips
- Focus management for navigation controls

## Examples

See `web-preview-example.tsx` for complete usage examples including:
- Basic web preview usage
- Navigation controls
- Console logging
- Custom loading states
- Multiple preview layouts
- Responsive design examples
