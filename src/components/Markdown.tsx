import { Children, isValidElement, ReactNode, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import { AlertTriangle, GraduationCap, Lightbulb, Pin } from 'lucide-react';

const KINDS = {
  retenir: { label: 'À retenir', icon: Pin, cls: 'border-brand/50 bg-brand/10 text-brand' },
  exemple: { label: 'Exemple', icon: Lightbulb, cls: 'border-accent/60 bg-accent/10 text-accent' },
  attention: { label: 'Attention', icon: AlertTriangle, cls: 'border-bad/50 bg-bad/10 text-bad' },
  examen: { label: "Pour l'examen", icon: GraduationCap, cls: 'border-good/50 bg-good/10 text-good' },
} as const;
type Kind = keyof typeof KINDS;

type Seg = { type: 'md'; text: string } | { type: 'callout'; kind: Kind; title: string; body: string };

function split(md: string): Seg[] {
  const lines = md.split('\n');
  const out: Seg[] = [];
  let buf: string[] = [];
  let i = 0;
  const flush = () => {
    if (buf.length) out.push({ type: 'md', text: buf.join('\n') });
    buf = [];
  };
  while (i < lines.length) {
    const m = lines[i].match(/^:::(retenir|exemple|attention|examen)\s*(.*)$/);
    if (m) {
      flush();
      const body: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ':::') body.push(lines[i++]);
      out.push({ type: 'callout', kind: m[1] as Kind, title: m[2].trim(), body: body.join('\n') });
      i++;
    } else buf.push(lines[i++]);
  }
  flush();
  return out;
}

const plugins = { remark: [remarkGfm], rehype: [rehypeRaw, rehypeSlug] };

function Md({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={plugins.remark}
      rehypePlugins={plugins.rehype}
      components={{
        table: ({ children }) => (
          <div className="my-5 overflow-x-auto rounded-xl border border-line">
            <table>{children}</table>
          </div>
        ),
        img: ({ src, alt }) => (
          <figure className="my-5">
            <img src={src} alt={alt ?? ''} loading="lazy" className="!my-0 mx-auto w-full max-w-[640px]" />
            {alt && <figcaption className="mt-2 text-center text-xs text-muted">{alt}</figcaption>}
          </figure>
        ),
        a: ({ href, children }) => (
          <a href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
            {children}
          </a>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

/** Rendu d'un chapitre : Markdown + encadrés pédagogiques (:::retenir, :::exemple, :::attention, :::examen). */
export function Course({ text }: { text: string }) {
  const segs = useMemo(() => split(text), [text]);
  return (
    <div className="prose-k">
      {segs.map((s, i) =>
        s.type === 'md' ? (
          <Md key={i} text={s.text} />
        ) : (
          <aside key={i} className={`my-5 rounded-2xl border-l-4 p-4 ${KINDS[s.kind].cls}`}>
            <div className="mb-1 flex flex-wrap items-center gap-x-2 text-xs font-extrabold uppercase tracking-wide"><span className="flex items-center gap-2 whitespace-nowrap">
              {(() => {
                const I = KINDS[s.kind].icon;
                return <I size={15} />;
              })()}
              {KINDS[s.kind].label}</span>
              {s.title && <span className="font-bold normal-case tracking-normal text-ink">· {s.title}</span>}
            </div>
            <div className="text-ink [&>*:first-child]:mt-1 [&>*:last-child]:mb-0 [&_p]:my-2 [&_ul]:my-2">
              <Md text={s.body} />
            </div>
          </aside>
        ),
      )}
    </div>
  );
}

/** Rendu inline léger (énoncés, cartes mémoire, corrigés). */
export function Inline({ text, className }: { text: string; className?: string }) {
  return (
    <div className={`prose-k !text-[inherit] [&_p]:my-1.5 [&_ul]:my-1.5 ${className ?? ''}`}>
      <Md text={text} />
    </div>
  );
}

/** Texte brut multi-lignes avec puces « - » (corrigés d'épreuve). */
export function AnswerText({ text }: { text: string }) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const items: ReactNode[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (bullets.length) {
      items.push(
        <ul key={`u${items.length}`} className="my-1.5 list-disc space-y-1 pl-5 marker:text-accent">
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>,
      );
      bullets = [];
    }
  };
  lines.forEach((l) => {
    if (l.startsWith('- ')) bullets.push(l.slice(2));
    else {
      flush();
      items.push(
        <p key={`p${items.length}`} className="my-1.5">
          {l}
        </p>,
      );
    }
  });
  flush();
  return <div className="text-[14.5px] leading-relaxed">{items}</div>;
}

export function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((c) => (typeof c === 'string' ? c : isValidElement(c) ? textOf((c.props as { children?: ReactNode }).children) : ''))
    .join('');
}
