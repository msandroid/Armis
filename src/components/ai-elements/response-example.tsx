'use client';

import React from 'react';
import { Response } from './response';

// Basic Response example
export function BasicResponseExample() {
  const markdownContent = `
# Welcome to AI SDK Response Component

This is a **markdown** response that demonstrates various features:

## Features

- **Bold text** and *italic text*
- \`inline code\` and code blocks
- Lists and numbered lists
- Links and images
- Math equations
- Tables

### Code Example

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));
\`\`\`

### Math Equation

Inline math: $E = mc^2$

Block math:
$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

### Table Example

| Feature | Support | Description |
|---------|---------|-------------|
| Markdown | ✅ | Full markdown support |
| Code Highlighting | ✅ | Syntax highlighting |
| Math Equations | ✅ | KaTeX integration |
| Copy Button | ✅ | One-click code copying |

### Task List

- [x] Implement basic markdown rendering
- [x] Add code syntax highlighting
- [x] Integrate math equation support
- [ ] Add custom components support
- [ ] Implement streaming support

### Links and Images

Visit [AI SDK Documentation](https://ai-sdk.dev) for more information.

> This is a blockquote that demonstrates the styling of quoted text.

---

*End of example*
  `;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Basic Response Example</h3>
      
      <Response>
        {markdownContent}
      </Response>
    </div>
  );
}

// Response with custom components example
export function CustomResponseExample() {
  const customComponents = {
    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h1 
        {...props} 
        className="text-4xl font-bold text-blue-600 border-b-2 border-blue-200 pb-2 mb-4"
      >
        {children}
      </h1>
    ),
    blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
      <blockquote 
        {...props} 
        className="border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 pl-4 py-2 my-4"
      >
        {children}
      </blockquote>
    ),
  };

  const markdownContent = `
# Custom Styled Response

This example shows how to customize the appearance of markdown elements.

> This is a custom styled blockquote with a green theme.

## Code with Custom Styling

\`\`\`javascript
// This code block will use the default styling
const message = "Hello, custom components!";
console.log(message);
\`\`\`

### Features Demonstrated

- Custom heading styling
- Custom blockquote styling
- Default code block styling
- Mixed custom and default components
  `;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Custom Response Example</h3>
      
      <Response components={customComponents}>
        {markdownContent}
      </Response>
    </div>
  );
}

// Response with incomplete markdown example
export function IncompleteMarkdownExample() {
  const incompleteMarkdown = `
# Incomplete Markdown Example

This demonstrates the \`parseIncompleteMarkdown\` feature:

## Unclosed Code Block

\`\`\`python
def incomplete_function():
    print("This code block is not properly closed
    return "missing closing backticks"

## Unclosed List

- First item
- Second item
- Third item
  - Nested item
    - Deeply nested

## Unclosed Bold Text

This text is **bold but not properly closed

## Math Equation

Inline: $\\frac{1}{2} + \\frac{1}{3} = \\frac{5}{6}$

Block:
$$
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
$$

> This blockquote is also incomplete
  `;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Incomplete Markdown Example</h3>
      <p className="text-sm text-muted-foreground">
        This example shows how the Response component handles incomplete markdown during streaming.
      </p>
      
      <Response parseIncompleteMarkdown={true}>
        {incompleteMarkdown}
      </Response>
    </div>
  );
}

// Response with restricted content example
export function RestrictedContentExample() {
  const markdownWithLinks = `
# Restricted Content Example

This example demonstrates content restrictions:

## Allowed Links

- [AI SDK](https://ai-sdk.dev) - Allowed domain
- [Vercel](https://vercel.com) - Allowed domain

## Images

![Example Image](https://via.placeholder.com/300x200)

## Code Example

\`\`\`typescript
// This code will be copyable
interface User {
  id: string;
  name: string;
  email: string;
}

const user: User = {
  id: "1",
  name: "John Doe",
  email: "john@example.com"
};
\`\`\`
  `;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Restricted Content Example</h3>
      <p className="text-sm text-muted-foreground">
        This example shows content with restricted image and link prefixes.
      </p>
      
      <Response 
        allowedImagePrefixes={['https://via.placeholder.com']}
        allowedLinkPrefixes={['https://ai-sdk.dev', 'https://vercel.com']}
      >
        {markdownWithLinks}
      </Response>
    </div>
  );
}

// Complete example combining all features
export function CompleteResponseExample() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h2 className="text-2xl font-bold">Response Component Examples</h2>
      
      <BasicResponseExample />
      
      <CustomResponseExample />
      
      <IncompleteMarkdownExample />
      
      <RestrictedContentExample />
    </div>
  );
}
