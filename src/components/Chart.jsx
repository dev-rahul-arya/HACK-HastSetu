// Accuracy trend — a hand-drawn SVG polyline (PRD §4.6, no chart library).
// Gaps in data (days with no attempts) break the line. Purely presentational.

const W = 320;
const H = 120;
const PAD = { top: 12, right: 6, bottom: 18, left: 24 };

export default function Chart({ data }) {
  const n = data.length;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (n <= 1 ? 0 : (i / (n - 1)) * innerW);
  const y = (v) => PAD.top + innerH - (v / 100) * innerH;

  // Build path segments, breaking on null values.
  let d = "";
  let pen = false;
  data.forEach((pt, i) => {
    if (pt.value == null) { pen = false; return; }
    d += `${pen ? "L" : "M"}${x(i).toFixed(1)} ${y(pt.value).toFixed(1)} `;
    pen = true;
  });

  const points = data
    .map((pt, i) => (pt.value == null ? null : { cx: x(i), cy: y(pt.value), v: pt.value }))
    .filter(Boolean);

  const hasData = points.length > 0;
  const latest = [...data].reverse().find((p) => p.value != null);

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} className="chart__svg"
        role="img" aria-label={hasData
          ? `Accuracy trend over ${n} days; latest ${latest.value}%`
          : "Accuracy trend; no attempts yet"}>
        {[0, 50, 100].map((g) => (
          <g key={g}>
            <line className="chart__grid" x1={PAD.left} x2={W - PAD.right}
              y1={y(g)} y2={y(g)} />
            <text className="chart__axis" x={PAD.left - 6} y={y(g) + 3}
              textAnchor="end">{g}</text>
          </g>
        ))}
        {hasData ? (
          <>
            <path className="chart__line" d={d.trim()} />
            {points.map((p, i) => (
              <circle key={i} className="chart__dot" cx={p.cx} cy={p.cy} r="2.6" />
            ))}
          </>
        ) : (
          <text className="chart__empty" x={W / 2} y={H / 2} textAnchor="middle">
            No attempts yet
          </text>
        )}
      </svg>
    </div>
  );
}
