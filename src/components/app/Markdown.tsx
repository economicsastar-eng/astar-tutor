import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Markdown renderer for lesson content. Supports GitHub-Flavoured Markdown
// (tables, task lists, strikethrough, autolinks) via remark-gfm.
export function Markdown({ source }: { source: string }) {
  return (
    <div className="text-[0.97rem] text-slate-300 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-display font-bold text-white mt-6 mb-3" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-display font-bold text-white mt-6 mb-3" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-display font-semibold text-white mt-5 mb-2" {...props} />
          ),
          p: ({ node, ...props }) => <p className="my-3" {...props} />,
          strong: ({ node, ...props }) => (
            <strong className="text-white font-semibold" {...props} />
          ),
          em: ({ node, ...props }) => <em className="italic" {...props} />,
          code: ({ node, ...props }) => (
            <code
              className="px-1.5 py-0.5 rounded bg-white/10 text-emerald font-mono text-[0.9em]"
              {...props}
            />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-6 space-y-1.5 my-3" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-6 space-y-1.5 my-3" {...props} />
          ),
          li: ({ node, ...props }) => <li {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-emerald/60 pl-4 py-1 my-4 text-slate-300 italic"
              {...props}
            />
          ),
          a: ({ node, ...props }) => (
            <a
              className="text-emerald underline underline-offset-2 hover:text-emerald-hover"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          hr: () => <hr className="my-6 border-white/10" />,
          // GFM table styling — wrap in a horizontally scrollable container
          // so wide comparison tables remain readable on mobile.
          table: ({ node, ...props }) => (
            <div className="my-4 -mx-2 overflow-x-auto">
              <table
                className="w-full border-collapse text-sm border border-white/15 rounded-md overflow-hidden"
                {...props}
              />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-white/10 text-white" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="[&>tr:nth-child(even)]:bg-white/[0.03]" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="border-b border-white/10 last:border-b-0" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th
              className="text-left font-semibold px-3 py-2 border border-white/10 align-top"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td className="px-3 py-2 border border-white/10 align-top text-slate-300" {...props} />
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
