import type { Settings } from "./types";

const DAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function nowInSaoPaulo() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  const minutes = (parseInt(get("hour"), 10) % 24) * 60 + parseInt(get("minute"), 10);
  return { day, minutes };
}

/** "09:00" vira "9h", "19:30" vira "19h30" */
const hm = (t: string) => t.replace(/^0/, "").replace(":00", "h").replace(":", "h");

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

export function openStatus(hours: Settings["hours"]) {
  const { day, minutes } = nowInSaoPaulo();
  const today = hours.find((h) => h.days.includes(day));
  if (today && minutes >= toMin(today.open) && minutes < toMin(today.close)) {
    return { open: true, label: `Aberto até ${hm(today.close)}` };
  }
  // próxima abertura
  for (let i = 0; i < 7; i++) {
    const d = (day + i) % 7;
    const slot = hours.find((h) => h.days.includes(d));
    if (!slot) continue;
    if (i === 0 && minutes >= toMin(slot.open)) continue;
    const when = i === 0 ? "hoje" : i === 1 ? "amanhã" : DAY_SHORT[d].toLowerCase();
    return { open: false, label: `Fechado, abre ${when} às ${hm(slot.open)}` };
  }
  return { open: false, label: "Fechado" };
}

export function hoursSummary(hours: Settings["hours"]) {
  return hours.map((h) => {
    const days = [...h.days].sort((a, b) => a - b);
    const contiguous = days.every((d, i) => i === 0 || d === days[i - 1] + 1);
    const label =
      days.length > 2 && contiguous
        ? `${DAY_SHORT[days[0]]} a ${DAY_SHORT[days[days.length - 1]]}`
        : days.map((d) => DAY_SHORT[d]).join(", ");
    return `${label} · ${hm(h.open)} às ${hm(h.close)}`;
  });
}

export { DAY_SHORT };
