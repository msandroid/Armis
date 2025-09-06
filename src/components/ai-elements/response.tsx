'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Streamdown } from 'streamdown';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { Copy, Check } from 'lucide-react';
import 'katex/dist/katex.min.css';

export interface ResponseProps extends React.HTMLAttributes<HTMLDivElement> {
  children: string;
  parseIncompleteMarkdown?: boolean;
  components?: Record<string, React.ComponentType<any>>;
  allowedImagePrefixes?: string[];
  allowedLinkPrefixes?: string[];
  defaultOrigin?: string;
  rehypePlugins?: any[];
  remarkPlugins?: any[];
}

// Custom code block component with copy button
const CodeBlock = React.forwardRef<HTMLPreElement, React.HTMLAttributes<HTMLPreElement> & { 'data-language'?: string }>(
  ({ className, children, 'data-language': language, ...props }, ref) => {
    const [copied, setCopied] = React.useState(false);
    const codeRef = React.useRef<HTMLElement>(null);

    const copyToClipboard = async () => {
      if (codeRef.current) {
        try {
          await navigator.clipboard.writeText(codeRef.current.textContent || '');
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error('Failed to copy code:', err);
        }
      }
    };

    return (
      <div className="relative group">
        <pre
          ref={ref}
          className={cn(
            'relative overflow-x-auto rounded-lg bg-muted p-4',
            className
          )}
          {...props}
        >
          {language && (
            <div className="absolute top-2 right-2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono">
                {language}
              </span>
              <button
                onClick={copyToClipboard}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted-foreground/20"
                title="Copy code"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
          )}
          <code ref={codeRef}>{children}</code>
        </pre>
      </div>
    );
  }
);
CodeBlock.displayName = 'CodeBlock';

// Custom inline code component
const InlineCode = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <code
        ref={ref}
        className={cn(
          'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm',
          className
        )}
        {...props}
      >
        {children}
      </code>
    );
  }
);
InlineCode.displayName = 'InlineCode';

export function Response({
  children,
  parseIncompleteMarkdown = true,
  className,
  components,
  allowedImagePrefixes = ['*'],
  allowedLinkPrefixes = ['*'],
  defaultOrigin,
  rehypePlugins = [rehypeKatex],
  remarkPlugins = [remarkGfm],
  ...props
}: ResponseProps) {
  // Merge custom components with default ones
  const mergedComponents = {
    pre: CodeBlock,
    code: InlineCode,
    ...components,
  };

  return (
    <div
      className={cn(
        'prose prose-gray dark:prose-invert max-w-none',
        'prose-headings:scroll-m-20 prose-headings:font-semibold prose-headings:tracking-tight',
        'prose-h1:text-5xl prose-h1:scroll-m-20 prose-h1:font-bold',
        'prose-h2:text-4xl prose-h2:scroll-m-20 prose-h2:font-bold',
        'prose-h3:text-3xl prose-h3:scroll-m-20 prose-h3:font-semibold',
        'prose-h4:text-2xl prose-h4:scroll-m-20 prose-h4:font-semibold',
        'prose-p:leading-6 prose-p:text-base [&:not(:first-child)]:mt-3',
        'prose-blockquote:mt-3 prose-blockquote:border-l-2 prose-blockquote:pl-6 prose-blockquote:italic',
        'prose-pre:bg-transparent prose-pre:p-0 prose-pre:my-0', // Remove default pre styling
        'prose-code:bg-transparent prose-code:p-0 prose-code:font-mono prose-code:text-sm prose-code:font-semibold', // Remove default code styling
        'prose-ul:my-3 prose-ul:ml-6 prose-ul:list-disc [&>ul]:mt-1 prose-ul:text-base',
        'prose-ol:my-3 prose-ol:ml-6 prose-ol:list-decimal [&>ol]:mt-1 prose-ol:text-base',
        'prose-li:my-1 prose-li:text-base',
        // 箇条書きの「・」を大きくする
        '[&_ul_li::marker]:text-lg [&_ul_li::marker]:font-bold [&_ul_li::marker]:text-white',
        'prose-table:border-collapse prose-table:border prose-table:border-border',
        'prose-th:border prose-th:border-border prose-th:bg-muted prose-th:p-2 prose-th:text-left prose-th:font-medium',
        'prose-td:border prose-td:border-border prose-td:p-2',
        'prose-img:rounded-lg prose-img:border prose-img:border-border',
        'prose-a:text-primary prose-a:underline prose-a:underline-offset-4 hover:prose-a:text-primary/80',
        'prose-hr:my-4 prose-hr:border-border',
        // Task list styling
        'prose-ul:list-none prose-ul:ml-0',
        '[&_ul]:list-none [&_ul]:ml-0',
        '[&_li.task-list-item]:list-none [&_li.task-list-item]:ml-0',
        '[&_input[type="checkbox"]]:mr-2 [&_input[type="checkbox"]]:mt-1',
        className
      )}
      {...props}
    >
      <Streamdown
        parseIncompleteMarkdown={parseIncompleteMarkdown}
        components={mergedComponents}
        allowedImagePrefixes={allowedImagePrefixes}
        allowedLinkPrefixes={allowedLinkPrefixes}
        defaultOrigin={defaultOrigin}
        rehypePlugins={rehypePlugins}
        remarkPlugins={remarkPlugins}
      >
        {children}
      </Streamdown>
    </div>
  );
}
