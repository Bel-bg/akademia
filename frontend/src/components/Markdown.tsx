import { Children, isValidElement, ReactNode, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import { AlertTriangle, Bookmark, GraduationHat, Sparkles } from '@getpapillon/papicons';
import { Mascot, MascotMood } from './Mascot';

const KINDS = {
  retenir: {
    label: 'À retenir',
    icon: Bookmark,
    mood: 'happy' as MascotMood,
    cls: 'border-brand/35 bg-soft/75 pattern-dots',
    badgeCls: 'bg-brand text-white',
  },
  exemple: {
    label: 'Exemple concret',
    icon: Sparkles,
    mood: 'wink' as MascotMood,
    cls: 'border-amber-400/45 bg-amber-50/80 pattern-grid',
    badgeCls: 'bg-amber-500 text-white',
  },
  attention: {
    label: 'Attention / Piège',
    icon: AlertTriangle,
    mood: 'surprised' as MascotMood,
    cls: 'border-bad/35 bg-bad/10 pattern-dots',
    badgeCls: 'bg-bad text-white',
  },
  examen: {
    label: "Pour l'examen",
    icon: GraduationHat,
    mood: 'proud' as MascotMood,
    cls: 'border-good/40 bg-good/10 pattern-grid',
    badgeCls: 'bg-good text-white',
  },
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
          <div className="my-5 overflow-x-auto rounded-2xl border border-line bg-card shadow-sm">
            <table>{children}</table>
          </div>
        ),
        img: ({ src, alt }) => (
          <figure className="my-5">
            <img src={src} alt={alt ?? ''} loading="lazy" className="!my-0 mx-auto w-full max-w-[640px]" />
            {alt && <figcaption className="mt-2 text-center text-xs font-bold text-muted">{alt}</figcaption>}
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

/**
 * Rendu d'un chapitre : Markdown + Cadres d'apprentissage illustrés
 * (:::retenir, :::exemple, :::attention, :::examen) avec motif de fond, icône Papicons et mini-mascotte.
 */
export function Course({ text }: { text: string }) {
  const segs = useMemo(() => split(text), [text]);
  return (
    <div className="prose-k">
      {segs.map((s, i) =>
        s.type === 'md' ? (
          <Md key={i} text={s.text} />
        ) : (
          <aside
            key={i}
            className={`my-6 relative overflow-hidden rounded-3xl border-2 p-5 shadow-sm ${KINDS[s.kind].cls}`}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide shadow-sm ${KINDS[s.kind].badgeCls}`}
                >
                  {(() => {
                    const I = KINDS[s.kind].icon;
                    return <I size={15} />;
                  })()}
                  {KINDS[s.kind].label}
                </span>
                {s.title && (
                  <span className="font-display text-base font-extrabold text-ink">{s.title}</span>
                )}
              </div>
              <Mascot mood={KINDS[s.kind].mood} size={44} animate={false} className="-my-2 shrink-0" />
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

/** Corrigés d'épreuve : bloc de code (SQL/PL-SQL) en tête, puis explications à puces « - ». */
const CODE_START = /^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|DECLARE|BEGIN|SET|ACCEPT|EXEC|WITH|COMMIT|--)/i;

function InlineCode({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith('`') && part.endsWith('`') && part.length > 2 ? (
          <code key={index} className="rounded bg-soft px-1.5 py-0.5 font-mono text-[0.9em]">{part.slice(1, -1)}</code>
        ) : part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
          <strong key={index}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

function renderAnswerText(raw: string[], keyPrefix: string): ReactNode[] {
  const lines = raw.map((line) => line.trim()).filter(Boolean);
  const items: ReactNode[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (!bullets.length) return;
    items.push(
      <ul key={`${keyPrefix}-list-${items.length}`} className="my-1.5 list-disc space-y-1 pl-5 marker:text-accent">
        {bullets.map((bullet, index) => <li key={index}><InlineCode text={bullet} /></li>)}
      </ul>,
    );
    bullets = [];
  };

  for (const line of lines) {
    if (line.startsWith('- ')) bullets.push(line.slice(2));
    else {
      flush();
      items.push(<p key={`${keyPrefix}-p-${items.length}`} className="my-1.5"><InlineCode text={line} /></p>);
    }
  }
  flush();
  return items;
}

const ANSWER_PRE = 'my-1.5 overflow-x-auto rounded-2xl border border-line bg-[#141B2D] p-3.5 font-mono text-[12.5px] leading-relaxed text-slate-100 shadow-card';

export function AnswerText({ text }: { text: string }) {
  const clean = text.replace(/\r/g, '');
  if (clean.includes('```')) {
    const output: ReactNode[] = [];
    clean.split(/```[a-zA-Z]*\n?/).forEach((segment, index) => {
      if (index % 2 === 1) {
        output.push(<pre key={`code-${index}`} className={ANSWER_PRE}><code>{segment.replace(/\s+$/, '')}</code></pre>);
      } else if (segment.trim()) {
        output.push(...renderAnswerText(segment.split('\n'), `text-${index}`));
      }
    });
    return <div className="text-[14.5px] leading-relaxed">{output}</div>;
  }

  const raw = clean.split('\n');
  const firstBullet = raw.findIndex((l) => l.startsWith('- '));
  const head = (firstBullet === -1 ? raw : raw.slice(0, firstBullet)).join('\n').replace(/\s+$/, '');
  const isCode = CODE_START.test(head.trimStart());
  const rest = isCode ? (firstBullet === -1 ? [] : raw.slice(firstBullet)) : raw;

  return (
    <div className="text-[14.5px] leading-relaxed">
      {isCode && (
        <pre className={ANSWER_PRE}>
          <code>{head}</code>
        </pre>
      )}
      {renderAnswerText(rest, 'answer')}
    </div>
  );
}

export function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((c) =>
      typeof c === 'string'
        ? c
        : isValidElement(c)
          ? textOf((c.props as { children?: ReactNode }).children)
          : '',
    )
    .join('');
}
