import type { Unit } from "@/lib/types";

const split = (n: number) => {
  const [int, dec] = n.toFixed(2).split(".");
  return { int: Number(int).toLocaleString("pt-BR"), dec };
};

/** Preço em letra de placa: R$ pequeno, reais grandes, centavos elevados. */
export function Price({
  value,
  unit,
  was,
  muted,
  size = "md",
}: {
  value: number;
  unit?: Unit | "kit" | null;
  was?: number | null;
  muted?: boolean;
  size?: "md" | "lg" | "xl";
}) {
  const { int, dec } = split(value);
  const big = size === "xl" ? "text-[64px]" : size === "lg" ? "text-[38px]" : "text-[30px]";
  const small = size === "xl" ? "text-[22px]" : size === "lg" ? "text-[15px]" : "text-[13px]";
  return (
    <div className={`leading-none ${muted ? "text-muted" : was ? "text-tan" : "text-ink"}`}>
      {was ? <p className="sign tabular mb-1 text-[13px] text-muted line-through">R$ {was.toFixed(2).replace(".", ",")}</p> : null}
      <p className="sign tabular flex items-start font-extrabold">
        <span className={`${small} mr-1 mt-[0.2em] font-semibold`}>R$</span>
        <span className={`${big} leading-[0.82] tracking-[-0.01em]`}>{int}</span>
        <span className={`${small} mt-[0.15em] font-bold`}>,{dec}</span>
        {unit && unit !== "kit" && <span className={`${small} ml-1 mt-[0.2em] self-end font-medium text-muted`}>/{unit === "kg" ? "kg" : "un"}</span>}
      </p>
    </div>
  );
}
