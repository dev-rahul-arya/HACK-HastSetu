// The signature motif: a hand-landmark constellation built from the 21
// MediaPipe hand points and their standard connections (shared handModel).
// Reused in the hero, login backdrop, and the tracker's empty state. Dots +
// connecting lines = the app's recurring visual identity.

import { NODES, CONNECTIONS, TIP_INDICES as TIPS } from "../tracker/handModel.js";

export default function HandConstellation({
  className = "",
  activeNode = 8,
  animate = true,
}) {
  return (
    <svg
      className={`hand-constellation${animate ? " is-animated" : ""} ${className}`}
      viewBox="0 0 200 250"
      fill="none"
      role="img"
      aria-label="A hand drawn as connected landmark points"
    >
      <g className="hc-lines">
        {CONNECTIONS.map(([a, b], i) => (
          <line
            key={i}
            x1={NODES[a][0]} y1={NODES[a][1]}
            x2={NODES[b][0]} y2={NODES[b][1]}
            style={{ "--i": i }}
          />
        ))}
      </g>
      <g className="hc-nodes">
        {NODES.map(([x, y], i) => {
          const isActive = i === activeNode;
          const r = isActive ? 6 : TIPS.has(i) ? 4.5 : 3.4;
          return (
            <circle
              key={i}
              cx={x} cy={y} r={r}
              className={isActive ? "hc-node hc-node--active" : "hc-node"}
              style={{ "--i": i }}
            />
          );
        })}
      </g>
    </svg>
  );
}
