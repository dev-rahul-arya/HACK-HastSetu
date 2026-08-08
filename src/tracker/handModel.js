// Shared hand-landmark model — the 21 MediaPipe hand points, their connections,
// and canonical joint names. Used by the visual HandConstellation and by the
// mock tracker so both speak the same coordinate/joint vocabulary.

// Normalised positions (viewBox 0 0 200 250), a palm-out right hand.
export const NODES = [
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

export const CONNECTIONS = [
  [0, 1], [0, 5], [5, 9], [9, 13], [13, 17], [0, 17], // palm
  [1, 2], [2, 3], [3, 4],       // thumb
  [5, 6], [6, 7], [7, 8],       // index
  [9, 10], [10, 11], [11, 12],  // middle
  [13, 14], [14, 15], [15, 16], // ring
  [17, 18], [18, 19], [19, 20], // pinky
];

export const TIP_INDICES = new Set([4, 8, 12, 16, 20]);

export const JOINT_NAMES = [
  "wrist",
  "thumb_cmc", "thumb_mcp", "thumb_ip", "thumb_tip",
  "index_mcp", "index_pip", "index_dip", "index_tip",
  "middle_mcp", "middle_pip", "middle_dip", "middle_tip",
  "ring_mcp", "ring_pip", "ring_dip", "ring_tip",
  "pinky_mcp", "pinky_pip", "pinky_dip", "pinky_tip",
];

// Which joints an error code tends to implicate — used by the mock to make
// jointErrors correlate with errorCodes (and later drives the heatmap).
export const ERRORCODE_JOINTS = {
  thumb_extended: ["thumb_tip", "thumb_ip"],
  wrist_rotation: ["wrist", "thumb_cmc"],
  fingers_loose: ["index_tip", "middle_tip", "ring_tip"],
  finger_spread: ["index_mcp", "ring_mcp", "pinky_mcp"],
  hand_position: ["wrist"],
  palm_orientation: ["wrist", "index_mcp"],
  second_hand_misaligned: ["r_wrist", "r_index_mcp"],
  hold_steady: ["middle_tip", "index_tip"],
};
