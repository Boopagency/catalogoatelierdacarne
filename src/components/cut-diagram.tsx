"use client";

import { useId } from "react";
import { ANATOMY, type Animal } from "@/lib/anatomy";

type Props = {
  animal: Animal;
  regions?: string[];
  variant?: "full" | "mini";
  className?: string;
  title?: string;
  /** Torna as regiões clicáveis (usado no portal para escolher o corte). */
  onToggle?: (region: string) => void;
};

export function CutDiagram({ animal, regions = [], variant = "full", className, title, onToggle }: Props) {
  const art = ANATOMY[animal];
  const raw = useId().replace(/:/g, "");
  const clipId = `clip-${raw}`;
  const gradId = `grad-${raw}`;
  const active = new Set(regions);
  const mini = variant === "mini";
  const clipped = art.regions.filter((r) => (animal === "frango" ? r.clip === true : r.clip !== false));
  const overlay = art.regions.filter((r) => !clipped.includes(r));

  const clickable = (id: string) =>
    Boolean(onToggle) && (!["cabeca", "pescoco", "dorso"].includes(id) || (animal === "suino" && id === "cabeca"));
  const interactive = (id: string) =>
    clickable(id) ? { onClick: () => onToggle!(id), style: { cursor: "pointer" }, className: "transition-opacity hover:opacity-75" } : {};
  const regionFill = (id: string) => (active.has(id) ? `url(#${gradId})` : "var(--diagram-fill)");

  return (
    <svg
      viewBox="0 0 520 300"
      className={className}
      role="img"
      aria-label={title ?? "Mapa do corte"}
      data-active={regions.length > 0 ? "true" : "false"}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={art.silhouette} />
        </clipPath>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--cut-hi-a)" />
          <stop offset="100%" stopColor="var(--cut-hi-b)" />
        </linearGradient>
      </defs>

      {art.extras.filter((e) => e.back).map((e, i) => (
        <path key={`xb${i}`} d={e.d} fill="var(--diagram-fill)" stroke="var(--diagram-outline)" strokeWidth={mini ? 2 : 1.25} strokeLinejoin="round" />
      ))}

      <g clipPath={`url(#${clipId})`}>
        {clipped.map((r, i) => (
          <path
            key={`r${i}`}
            d={r.d}
            fill={regionFill(r.id)}
            stroke={active.has(r.id) ? "rgb(255 255 255 / 0.9)" : "var(--diagram-line)"}
            strokeWidth={active.has(r.id) ? (mini ? 2 : 1.25) : mini ? 1.5 : 1}
            className={active.has(r.id) && !onToggle ? "cut-active" : undefined}
            {...interactive(r.id)}
          >
            {onToggle && <title>{art.labels[r.id] ?? r.id}</title>}
          </path>
        ))}
      </g>

      <path
        d={art.silhouette}
        fill="none"
        stroke="var(--diagram-outline)"
        strokeWidth={mini ? 2.5 : 1.5}
        strokeLinejoin="round"
      />

      {/* extras com preenchimento (chifre, orelha, crista...) */}
      {art.extras.filter((e) => e.kind !== "line" && !e.back).map((e, i) => (
        <path
          key={`xf${i}`}
          d={e.d}
          fill={e.region && active.has(e.region) ? `url(#${gradId})` : "var(--diagram-fill)"}
          stroke="var(--diagram-outline)"
          strokeWidth={mini ? 2 : 1.25}
          strokeLinejoin="round"
        />
      ))}

      {overlay.map((r, i) => (
        <path
          key={`o${i}`}
          d={r.d}
          fill={regionFill(r.id)}
          stroke="var(--diagram-outline)"
          strokeWidth={mini ? 2 : 1.25}
          strokeDasharray={r.id === "miudos" && !active.has(r.id) ? "3 3" : undefined}
          strokeLinejoin="round"
          className={active.has(r.id) && !onToggle ? "cut-active" : undefined}
          {...interactive(r.id)}
        >
          {onToggle && <title>{art.labels[r.id] ?? r.id}</title>}
        </path>
      ))}

      {art.extras.filter((e) => e.kind === "line").map((e, i) => (
        <path
          key={`xl${i}`}
          d={e.d}
          fill="none"
          stroke={e.region && active.has(e.region) ? "var(--cut-hi-a)" : "var(--diagram-outline)"}
          strokeWidth={e.region && active.has(e.region) ? (mini ? 5 : 4) : mini ? 2.5 : 1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
