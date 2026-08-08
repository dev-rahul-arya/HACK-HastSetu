// Per-joint heatmap (PRD §4.5) — a schematic hand (two hands for two-handed
// signs) whose joint dots are tinted by their error magnitude from jointErrors
// (0 = perfect, 1 = worst). A labelled legend keeps meaning off colour alone.

import { NODES, CONNECTIONS, JOINT_NAMES } from "../tracker/handModel.js";

function band(e) {
  if (e >= 0.6) return "hi";
  if (e >= 0.3) return "mid";
  return "lo";
}

function Hand({ errors, label }) {
  return (
    <svg className="heat__hand" viewBox="0 0 200 250" role="img"
      aria-label={`${label}: joint accuracy map`}>
      <g className="heat__lines">
        {CONNECTIONS.map(([a, b], i) => (
          <line key={i} x1={NODES[a][0]} y1={NODES[a][1]}
            x2={NODES[b][0]} y2={NODES[b][1]} />
        ))}
      </g>
      <g>
        {NODES.map(([x, y], i) => {
          const e = errors[JOINT_NAMES[i]] ?? 0;
          return (
            <circle key={i} cx={x} cy={y} r={3 + e * 3.5}
              className={`heat__node heat__node--${band(e)}`} />
          );
        })}
      </g>
    </svg>
  );
}

export default function JointHeatmap({ jointErrors = {}, twoHanded = false }) {
  // Split the second hand (r_ prefixed) out for two-handed signs.
  const main = {};
  const second = {};
  Object.entries(jointErrors).forEach(([k, v]) => {
    if (k.startsWith("r_")) second[k.slice(2)] = v;
    else main[k] = v;
  });

  // Name the two worst joints for the aria summary.
  const worst = Object.entries(jointErrors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([k]) => k.replace(/_/g, " "))
    .join(", ");

  return (
    <div className="heat">
      <div className="heat__hands" aria-label={`Weakest joints: ${worst || "none"}`}>
        <Hand errors={main} label="Primary hand" />
        {twoHanded && <Hand errors={second} label="Second hand" />}
      </div>
      <div className="heat__legend" aria-hidden="true">
        <span className="heat__key"><i className="heat__swatch heat__swatch--lo" /> On target</span>
        <span className="heat__key"><i className="heat__swatch heat__swatch--mid" /> Close</span>
        <span className="heat__key"><i className="heat__swatch heat__swatch--hi" /> Off</span>
      </div>
    </div>
  );
}
