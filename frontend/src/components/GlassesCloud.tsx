import { cn } from '@/lib/utils';

/**
 * Nimbo à lunettes : le nuage-professeur qui annonce les formations.
 * SVG pur ; `talking` anime la bouche, les yeux clignent tout seuls.
 */
export function GlassesCloud({
  size = 150,
  color,
  talking = false,
  bob = true,
  className,
}: {
  size?: number;
  color?: string;
  talking?: boolean;
  bob?: boolean;
  className?: string;
}) {
  const fill = color ?? 'rgb(var(--brand-light))';
  const ink = 'rgb(var(--ink))';
  const puffs: [number, number, number][] = [
    [58, 92, 34], [100, 70, 44], [146, 90, 34], [78, 108, 30], [124, 108, 30],
  ];
  return (
    <svg
      viewBox="0 0 200 150"
      width={size}
      height={size * 0.75}
      className={cn(bob && 'cloud-bob', className)}
      role="img"
      aria-label="Nimbo, le nuage à lunettes"
    >
      {/* contour puis remplissage : silhouette de nuage d'un seul tenant */}
      <g fill={ink} stroke={ink} strokeWidth="7">
        {puffs.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}
      </g>
      <g fill={fill}>
        {puffs.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}
      </g>
      <ellipse cx="88" cy="48" rx="16" ry="7" fill="white" opacity=".45" transform="rotate(-20 88 48)" />
      {/* joues */}
      <circle cx="62" cy="108" r="7" fill="#fb7185" opacity=".4" />
      <circle cx="138" cy="108" r="7" fill="#fb7185" opacity=".4" />
      {/* lunettes */}
      <path d="M40 86 L28 80 M160 86 L172 80" stroke={ink} strokeWidth="4" strokeLinecap="round" />
      <path d="M92 90 Q100 83 108 90" stroke={ink} strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="72" cy="92" r="21" fill="white" fillOpacity=".78" stroke={ink} strokeWidth="4.5" />
      <circle cx="128" cy="92" r="21" fill="white" fillOpacity=".78" stroke={ink} strokeWidth="4.5" />
      <path d="M60 82 Q64 76 72 75" stroke="white" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M116 82 Q120 76 128 75" stroke="white" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      {/* yeux */}
      <g className="cloud-blink">
        <circle cx="74" cy="94" r="7.5" fill={ink} />
        <circle cx="130" cy="94" r="7.5" fill={ink} />
        <circle cx="76.5" cy="91" r="2.6" fill="white" />
        <circle cx="132.5" cy="91" r="2.6" fill="white" />
      </g>
      {/* bouche */}
      {talking ? (
        <ellipse className="cloud-talk" cx="100" cy="124" rx="8" ry="6" fill={ink} />
      ) : (
        <path d="M88 119 Q100 132 112 119" stroke={ink} strokeWidth="4" fill="none" strokeLinecap="round" />
      )}
    </svg>
  );
}
