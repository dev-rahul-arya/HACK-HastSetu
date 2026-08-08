// The signature motif: a hand-landmark constellation built from the 21
// MediaPipe hand points and their standard connections. Reused in the hero and
// (later) in the tracker's empty state. Dots + connecting lines = the app's
// recurring visual identity, tied directly to what the tracker sees.

// Normalised landmark positions (viewBox 0 0 200 250), a palm-out right hand.
const NODES = [
  [100, 232], // 0  wrist
  [72, 200],  // 1  thumb_cmc
  [52, 176],  // 2  thumb_mcp
  [40, 158],  // 3  thumb_ip
  [31, 142],  // 4  thumb_tip
  [80, 150],  // 5  index_mcp
  [76, 116],  // 6  index_pip
  [73, 92],   // 7  index_dip
  [71, 72],   // 8  index_tip
  [101, 146], // 9  middle_mcp
  [101, 108], // 10 middle_pip
  [101, 82],  // 11 middle_dip
  [101, 58],  // 12 middle_tip
  [122, 150], // 13 ring_mcp
  [126, 114], // 14 ring_pip
  [128, 90],  // 15 ring_dip
  [130, 70],  // 16 ring_tip
  [142, 160], // 17 pinky_mcp
  [150, 134], // 18 pinky_pip
  [154, 114], // 19 pinky_dip
  [156, 96],  // 20 pinky_tip
];

const CONNECTIONS = [
  // palm
  [0, 1], [0, 5], [5, 9], [9, 13], [13, 17], [0, 17],
  // thumb
  [1, 2], [2, 3], [3, 4],
  // index
  [5, 6], [6, 7], [7, 8],
  // middle
  [9, 10], [10, 11], [11, 12],
  // ring
  [13, 14], [14, 15], [15, 16],
  // pinky
  [17, 18], [18, 19], [19, 20],
];

// Fingertips get slightly larger nodes; the active tip is the marigold accent.
const TIPS = new Set([4, 8, 12, 16, 20]);

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
