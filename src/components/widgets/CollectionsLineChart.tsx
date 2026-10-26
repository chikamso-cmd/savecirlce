import { useMemo, useSyncExternalStore } from "react";
import {
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register only what the line chart uses, so the rest of Chart.js is tree-shaken out
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

export interface CollectionPoint {
  label: string;
  transfer: number; // in thousands of naira
  cash: number; // in thousands of naira
}

const naira = (thousands: number) =>
  `₦${Math.round(thousands * 1000).toLocaleString("en-NG")}`;
const compactNaira = (thousands: number) =>
  `₦${new Intl.NumberFormat("en-NG", { notation: "compact" }).format(thousands * 1000)}`;

// The theme toggles `.dark` and the brand sets `data-brand` on <html>, swapping the
// `--color-*` variables. A canvas can't use classes, so re-read them when either changes.
function subscribeToPalette(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-brand"],
  });
  return () => observer.disconnect();
}

const paletteKey = () => {
  const root = document.documentElement;
  return `${root.classList.contains("dark")}|${root.dataset.brand ?? ""}`;
};

function useChartPalette() {
  const key = useSyncExternalStore(subscribeToPalette, paletteKey);
  return useMemo(() => {
    const css = getComputedStyle(document.documentElement);
    const v = (name: string) => css.getPropertyValue(`--color-${name}`).trim();
    const dark = key.startsWith("true");
    return {
      // Darker greens read poorly on the dark card, so lighter steps are used there
      transfer: v(dark ? "emerald-400" : "emerald-700"),
      cash: v(dark ? "emerald-600" : "emerald-400"),
      card: v("white"),
      grid: v("slate-200"),
      tick: v("slate-500"),
      tooltipBg: v("slate-900"),
      tooltipText: v("white"),
    };
  }, [key]);
}

export function CollectionsLegend() {
  return (
    <div className="flex gap-4 text-xs text-slate-600">
      <span className="flex items-center gap-1.5">
        <span className="w-4 border-t-[2.5px] border-emerald-700 dark:border-emerald-400" />{" "}
        Transfer
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-4 border-t-[2.5px] border-dashed border-emerald-400 dark:border-emerald-600" />{" "}
        Cash
      </span>
    </div>
  );
}

export function CollectionsLineChart({
  points,
  description,
  tickLabel = (p) => p.label,
  className = "h-56",
}: {
  points: CollectionPoint[];
  description: string; // e.g. "over the last 14 days", read out with the chart
  tickLabel?: (p: CollectionPoint) => string;
  className?: string;
}) {
  const palette = useChartPalette();

  const data: ChartData<"line"> = {
    labels: points.map((p) => p.label),
    datasets: [
      {
        label: "Transfer",
        data: points.map((p) => p.transfer),
        borderColor: palette.transfer,
        backgroundColor: palette.transfer,
      },
      {
        label: "Cash",
        data: points.map((p) => p.cash),
        borderColor: palette.cash,
        backgroundColor: palette.cash,
        borderDash: [6, 4],
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    elements: {
      line: { borderWidth: 2.5, tension: 0.3 },
      point: {
        // Short series need visible points, or a 3-point line looks like a stray stroke
        radius: points.length <= 7 ? 3 : 0,
        hoverRadius: 5,
        hoverBorderWidth: 2,
        hoverBorderColor: palette.card,
      },
    },
    plugins: {
      legend: { display: false }, // CollectionsLegend sits in the card header
      tooltip: {
        backgroundColor: palette.tooltipBg,
        titleColor: palette.tooltipText,
        bodyColor: palette.tooltipText,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${naira(ctx.parsed.y ?? 0)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { color: palette.grid },
        ticks: {
          color: palette.tick,
          font: { size: 11 },
          maxRotation: 0,
          autoSkipPadding: 8,
          callback: (_, i) => tickLabel(points[i]),
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: palette.grid },
        border: { display: false },
        ticks: {
          color: palette.tick,
          font: { size: 11 },
          maxTicksLimit: 5,
          callback: (value) => compactNaira(Number(value)),
        },
      },
    },
  };

  return (
    <>
      <div className={className}>
        <Line
          data={data}
          options={options}
          role="img"
          aria-label={`Line chart of collections by transfer and cash ${description}`}
        />
      </div>
      <ul className="sr-only">
        {points.map((p) => (
          <li key={p.label}>
            {`${p.label}: ${naira(p.transfer)} by transfer and ${naira(p.cash)} in cash`}
          </li>
        ))}
      </ul>
    </>
  );
}
