import { fmt, useText } from "../strings";
import { Icon } from "./Icon";

/** Circular progress: "1/3" in the middle, a check when complete. */
export function ProgressRing({
  done,
  total,
  size = 52,
}: {
  done: number;
  total: number;
  size?: number;
}) {
  const { strings } = useText();
  const stroke = Math.max(4, Math.round(size / 11));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const frac = total > 0 ? Math.min(1, done / total) : 0;
  const complete = total > 0 && done >= total;
  return (
    <div
      className={complete ? "ring is-complete" : "ring"}
      style={{ width: size, height: size }}
      role="img"
      aria-label={fmt(strings.study.doneSummary, { done, total })}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        <circle
          className="ring-track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
        />
        {frac > 0 && (
          <circle
            className="ring-fill"
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${c * frac} ${c}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </svg>
      <span className="ring-label" aria-hidden="true">
        {complete && size >= 64 ? (
          <Icon name="check" size={size * 0.45} strokeWidth={2.5} />
        ) : (
          `${done}/${total}`
        )}
      </span>
    </div>
  );
}
