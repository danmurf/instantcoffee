import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageContentProps {
  content: string;
  isUser: boolean;
}

export function MessageContent({ content, isUser }: MessageContentProps) {
  if (isUser) {
    return <p className="whitespace-pre-wrap text-sm">{content}</p>;
  }

  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => (
          <h1 className="mb-2 mt-3 text-xl font-bold text-gray-900">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-2 mt-3 text-lg font-bold text-gray-900">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-1 mt-2 text-base font-semibold text-gray-900">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="mb-2 last:mb-0 text-sm text-gray-900">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="mb-2 list-disc pl-5 text-sm text-gray-900">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 list-decimal pl-5 text-sm text-gray-900">{children}</ol>
        ),
        li: ({ children }) => <li className="mb-1">{children}</li>,
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-indigo-600 underline hover:text-indigo-800"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        code: ({ className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '');
          const isInline = !match;

          if (isInline) {
            return (
              <code className="rounded bg-gray-200 px-1 py-0.5 text-xs font-mono text-gray-800" {...props}>
                {children}
              </code>
            );
          }

          return (
            <SyntaxHighlighter
              style={oneDark}
              language={match[1]}
              PreTag="div"
              className="mb-2 rounded-lg !bg-gray-800"
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          );
        },
        blockquote: ({ children }) => (
          <blockquote className="mb-2 border-l-4 border-gray-300 pl-3 italic text-gray-600">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="my-3 border-gray-300" />,
        strong: ({ children }) => (
          <strong className="font-semibold text-gray-900">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-gray-900">{children}</em>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
