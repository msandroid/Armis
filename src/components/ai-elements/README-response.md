# Response Component

The `Response` component renders a Markdown response from a large language model. It uses Streamdown under the hood to render the markdown with support for GitHub Flavored Markdown (GFM), math equations via KaTeX, and smart streaming support.

## Features

- Renders markdown content with support for paragraphs, links, and code blocks
- Supports GFM features like tables, task lists, and strikethrough text via remark-gfm
- Supports rendering Math Equations via rehype-katex
- **Smart streaming support** - automatically completes incomplete formatting during real-time text streaming
- Code blocks are rendered with syntax highlighting for various programming languages
- Code blocks include a button to easily copy code to clipboard
- Adapts to different screen sizes while maintaining readability
- Seamlessly integrates with both light and dark themes
- Customizable appearance through className props and Tailwind CSS utilities
- Built with accessibility in mind for all users

## Installation

The Response component is already included in the project and uses the following dependencies:
- `streamdown`
- `remark-gfm`
- `rehype-katex`
- `katex`
- `@tailwindcss/typography`

## Usage

### Basic Usage

```tsx
import { Response } from '@/components/ai-elements/response';

<Response>
  **Hi there.** I am an AI model designed to help you.
</Response>
```

### With AI SDK Integration

```tsx
import { useChat } from '@ai-sdk/react';
import { Response } from '@/components/ai-elements/response';

const { messages } = useChat();

{messages.map((message) => (
  <div key={message.id}>
    {message.role === 'assistant' && (
      <Response>
        {message.parts.map((part, i) => {
          switch (part.type) {
            case 'text':
              return part.text;
            default:
              return null;
          }
        }).join('')}
      </Response>
    )}
  </div>
))}
```

### With Custom Components

```tsx
const customComponents = {
  h1: ({ children, ...props }) => (
    <h1 {...props} className="text-4xl font-bold text-blue-600">
      {children}
    </h1>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote {...props} className="border-l-4 border-green-500 bg-green-50">
      {children}
    </blockquote>
  ),
};

<Response components={customComponents}>
  # Custom Styled Heading
  
  > This is a custom styled blockquote.
</Response>
```

### With Content Restrictions

```tsx
<Response 
  allowedImagePrefixes={['https://via.placeholder.com']}
  allowedLinkPrefixes={['https://ai-sdk.dev', 'https://vercel.com']}
>
  ![Example](https://via.placeholder.com/300x200)
  
  [AI SDK](https://ai-sdk.dev) - Allowed link
</Response>
```

## API Reference

### Response

The main component for rendering markdown content.

#### Props

- `children: string` - The markdown content to render
- `parseIncompleteMarkdown?: boolean` - Whether to parse and fix incomplete markdown syntax (e.g., unclosed code blocks or lists). Default: `true`
- `className?: string` - CSS class names to apply to the wrapper div element
- `components?: object` - Custom React components to use for rendering markdown elements (e.g., custom heading, paragraph, code block components)
- `allowedImagePrefixes?: string[]` - Array of allowed URL prefixes for images. Use `["*"]` to allow all images. Default: `["*"]`
- `allowedLinkPrefixes?: string[]` - Array of allowed URL prefixes for links. Use `["*"]` to allow all links. Default: `["*"]`
- `defaultOrigin?: string` - Default origin to use for relative URLs in links and images
- `rehypePlugins?: array` - Array of rehype plugins to use for processing HTML. Includes KaTeX for math rendering by default
- `remarkPlugins?: array` - Array of remark plugins to use for processing markdown. Includes GitHub Flavored Markdown and math support by default
- `...props` - Any other props are spread to the root div

## Markdown Features

### Basic Markdown

- **Bold text** and *italic text*
- `inline code`
- [Links](https://example.com)
- ![Images](https://example.com/image.jpg)
- > Blockquotes
- Headers (# ## ###)
- Lists (ordered and unordered)

### GitHub Flavored Markdown (GFM)

- Tables
- Task lists (`- [x] Completed`, `- [ ] Pending`)
- Strikethrough (`~~text~~`)
- Code blocks with language specification

### Math Equations

Inline math: `$E = mc^2$`

Block math:
```
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

### Code Blocks

Code blocks support syntax highlighting and include a copy button:

````
```typescript
function greet(name: string): string {
  return `Hello, ${name}!`;
}
```
````

## Styling

The Response component uses Tailwind CSS Typography plugin with custom styling:

- **Prose styling**: Clean, readable typography
- **Dark mode support**: Automatic theme adaptation
- **Code blocks**: Custom styling with copy button
- **Math equations**: KaTeX styling
- **Tables**: Responsive table design
- **Task lists**: Custom checkbox styling

## Streaming Support

The component is designed to handle incomplete markdown during streaming:

```tsx
// During streaming, markdown might be incomplete
<Response parseIncompleteMarkdown={true}>
  # Incomplete heading
  - List item 1
  - List item 2
  ```python
  def incomplete_function():
      print("Incomplete code block
</Response>
```

The `parseIncompleteMarkdown` feature automatically fixes common issues like:
- Unclosed code blocks
- Unclosed lists
- Unclosed bold/italic text
- Incomplete math equations

## Custom Components

You can override any markdown element with custom components:

```tsx
const customComponents = {
  h1: ({ children, ...props }) => (
    <h1 {...props} className="text-4xl font-bold text-blue-600">
      {children}
    </h1>
  ),
  code: ({ children, ...props }) => (
    <code {...props} className="bg-yellow-100 px-1 rounded">
      {children}
    </code>
  ),
  pre: ({ children, ...props }) => (
    <pre {...props} className="bg-gray-900 text-white p-4 rounded">
      {children}
    </pre>
  ),
};

<Response components={customComponents}>
  # Custom styled heading
  `Custom styled inline code`
  
  ```javascript
  // Custom styled code block
  console.log('Hello, World!');
  ```
</Response>
```

## Security

The component includes security features for content filtering:

- **Image restrictions**: Control which domains can serve images
- **Link restrictions**: Control which domains can be linked to
- **XSS protection**: Built-in protection against cross-site scripting

## Accessibility

- Semantic HTML structure
- Proper heading hierarchy
- Screen reader compatible
- Keyboard navigation support
- High contrast support
- Focus management

## Examples

See `response-example.tsx` for complete usage examples including:
- Basic markdown rendering
- Custom component styling
- Incomplete markdown handling
- Content restrictions
- AI SDK integration examples
