import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import kotlin from 'react-syntax-highlighter/dist/esm/languages/prism/kotlin';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';

import { Check, Copy } from 'lucide-react';

SyntaxHighlighter.registerLanguage('kotlin', kotlin);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('js', javascript);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('ts', typescript);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('py', python);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('sh', bash);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('html', markup);
SyntaxHighlighter.registerLanguage('xml', markup);
SyntaxHighlighter.registerLanguage('sql', sql);
SyntaxHighlighter.registerLanguage('java', java);

interface Props {
  content: string;
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const normalizedLang = (language || 'text').toLowerCase();

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-white/10 bg-[#121212] shadow-md font-mono text-xs not-prose">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#1e1e1e] border-b border-white/5 text-white/60">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
          {normalizedLang}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-white/60 hover:text-white transition px-2 py-0.5 rounded hover:bg-white/10"
          title="Copiar código"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>

      {/* Syntax Highlighted Code */}
      <div className="overflow-x-auto text-[13px] leading-normal p-3 bg-[#121212]">
        <SyntaxHighlighter
          language={normalizedLang}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: 0,
            background: 'transparent',
            fontSize: '13px',
          }}
          wrapLongLines={false}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

export default function MarkdownRenderer({ content }: Props) {
  return (
    <div className="prose prose-invert max-w-none text-sm text-[#ececec] prose-p:leading-relaxed prose-pre:my-0 prose-pre:p-0 prose-pre:bg-transparent">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');

            if (!inline && match) {
              return <CodeBlock language={match[1]} code={codeString} />;
            } else if (!inline && codeString.includes('\n')) {
              return <CodeBlock language="text" code={codeString} />;
            }

            return (
              <code
                className="px-1.5 py-0.5 mx-0.5 rounded-md bg-white/10 text-charlotte-300 font-mono text-[12px] font-medium border border-white/5"
                {...props}
              >
                {children}
              </code>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="text-paradiso-300 hover:text-charlotte underline font-medium transition"
              >
                {children}
              </a>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-paradiso bg-white/5 pl-4 py-1.5 my-3 rounded-r-lg text-white/80 italic">
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4 rounded-lg border border-white/10">
                <table className="w-full text-left text-xs border-collapse divide-y divide-white/10">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return <th className="p-2.5 bg-white/5 font-semibold text-white/90">{children}</th>;
          },
          td({ children }) {
            return <td className="p-2.5 border-t border-white/5 text-white/80">{children}</td>;
          },
          ul({ children }) {
            return <ul className="list-disc list-outside pl-5 my-2 space-y-1">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal list-outside pl-5 my-2 space-y-1">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
