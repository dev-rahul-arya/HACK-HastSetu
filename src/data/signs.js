// Sign catalog (PRD §9). JSON-as-module. Media is added incrementally under
// public/signs/<id>/ ; the lesson player falls back gracefully (video → anim →
// illo → glyph) so missing assets are fine.

// Generic error codes used across signs; each maps to a tip string on the sign.
// Codes surfaced by the tracker's AttemptResult.errorCodes map to these.

const GENERIC_TIPS = {
  thumb_extended: "Tuck your thumb against your fingers — it's drifting out.",
  wrist_rotation: "Keep your palm facing the camera; your wrist is turning.",
  fingers_loose: "Firm up your fingers — the shape is going slack.",
  finger_spread: "Bring your fingers closer; they're spreading apart.",
  hand_position: "Raise your hand to chest height, centred in view.",
  palm_orientation: "Turn your palm toward the camera.",
  second_hand_misaligned:
    "Line your second hand up under the first — it's off to the side.",
  hold_steady: "Hold the shape a beat longer so it reads clearly.",
};

// Two-handed letters are common in ISL fingerspelling (unlike ASL). This is a
// plausible demo set — the reference media is the source of truth for learners.
const TWO_HANDED_LETTERS = new Set([
  "d", "f", "g", "h", "j", "k", "n", "p", "q", "t", "x", "y", "z",
]);

function letterSign(letter) {
  const id = letter.toLowerCase();
  const two = TWO_HANDED_LETTERS.has(id);
  const unit = id <= "m" ? 1 : 2;
  return {
    id,
    label: letter.toUpperCase(),
    unit,
    twoHanded: two,
    captureMs: 3000,
    steps: two
      ? [
          `Rest your non-dominant hand flat, palm toward you`,
          `Shape "${letter.toUpperCase()}" with your dominant hand against it`,
          `Hold steady, palm angled to the camera`,
        ]
      : [
          `Raise your dominant hand to chest height`,
          `Form the "${letter.toUpperCase()}" handshape`,
          `Face your palm toward the camera and hold`,
        ],
    mistakes: two
      ? ["Hands drifting apart", "Second hand rotated away from camera"]
      : ["Fingers too loose", "Palm turned sideways"],
    tips: two
      ? {
          second_hand_misaligned: GENERIC_TIPS.second_hand_misaligned,
          wrist_rotation: GENERIC_TIPS.wrist_rotation,
          hold_steady: GENERIC_TIPS.hold_steady,
        }
      : {
          thumb_extended: GENERIC_TIPS.thumb_extended,
          fingers_loose: GENERIC_TIPS.fingers_loose,
          palm_orientation: GENERIC_TIPS.palm_orientation,
        },
    media: { video: null, anim: null, illo: `/signs/${id}/demo.svg` },
  };
}

function digitSign(n) {
  const id = String(n);
  return {
    id,
    label: id,
    unit: 3,
    twoHanded: false,
    captureMs: 3000,
    steps: [
      `Raise your hand, palm to the camera`,
      `Show the number ${id} handshape`,
      `Keep fingers crisp and hold`,
    ],
    mistakes: ["Extra fingers showing", "Hand too low"],
    tips: {
      finger_spread: GENERIC_TIPS.finger_spread,
      hand_position: GENERIC_TIPS.hand_position,
      fingers_loose: GENERIC_TIPS.fingers_loose,
    },
    media: { video: null, anim: null, illo: `/signs/${id}/demo.svg` },
  };
}

function phrase(id, label, twoHanded, steps, mistakes, tipCodes) {
  return {
    id,
    label,
    unit: 4,
    twoHanded,
    captureMs: 3500,
    steps,
    mistakes,
    tips: Object.fromEntries(tipCodes.map((c) => [c, GENERIC_TIPS[c]])),
    media: { video: null, anim: null, illo: `/signs/${id}/demo.svg` },
  };
}

function emergency(id, label, twoHanded, steps, mistakes, tipCodes) {
  return {
    id,
    label,
    unit: 5,
    twoHanded,
    captureMs: 3500,
    steps,
    mistakes,
    tips: Object.fromEntries(tipCodes.map((c) => [c, GENERIC_TIPS[c]])),
    media: { video: null, anim: null, illo: `/signs/${id}/demo.svg` },
  };
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(letterSign);
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(digitSign);

const PHRASES = [
  phrase("hello", "Hello", false,
    ["Flat hand near your forehead", "Move it outward in a small arc", "Smile — it's a greeting"],
    ["Hand too far from head", "No outward motion"],
    ["hand_position", "palm_orientation"]),
  phrase("thankyou", "Thank You", false,
    ["Flat hand at your chin", "Move it forward and down", "Palm ends facing up"],
    ["Starting too low", "Palm facing down"],
    ["palm_orientation", "hand_position"]),
  phrase("sorry", "Sorry", false,
    ["Make a fist", "Circle it over your chest", "Keep a gentle expression"],
    ["Flat hand instead of fist", "No circular motion"],
    ["fingers_loose", "hand_position"]),
  phrase("please", "Please", false,
    ["Flat hand on your chest", "Circle it once", "Palm stays on the chest"],
    ["Hand off the chest", "Too fast"],
    ["hand_position", "hold_steady"]),
  phrase("water", "Water", false,
    ["Form a 'W' handshape", "Tap it at your chin twice", "Keep fingers together"],
    ["Fingers spread", "Tapping the wrong spot"],
    ["finger_spread", "hand_position"]),
  phrase("food", "Food", false,
    ["Pinch your fingers together", "Bring them to your lips", "Repeat the tap"],
    ["Hand too open", "Missing the mouth"],
    ["fingers_loose", "hand_position"]),
  phrase("yes", "Yes", false,
    ["Make a fist", "Nod it up and down from the wrist", "Small, clear motion"],
    ["Whole-arm motion", "Open hand"],
    ["fingers_loose", "hold_steady"]),
  phrase("no", "No", false,
    ["Extend index and middle fingers", "Tap them to the thumb", "One clear close"],
    ["Too many fingers", "No closing motion"],
    ["finger_spread", "hold_steady"]),
  phrase("name", "Name", true,
    ["Extend two fingers on each hand", "Cross them in an X", "Tap twice"],
    ["Hands not crossing", "Only one hand"],
    ["second_hand_misaligned", "hold_steady"]),
  phrase("good", "Good", false,
    ["Flat hand at your chin", "Move it forward, palm up", "Confident motion"],
    ["Palm down", "Starting too low"],
    ["palm_orientation", "hand_position"]),
  phrase("morning", "Good Morning", true,
    ["One flat arm horizontal", "Other hand rises like the sun", "Smooth upward sweep"],
    ["No rising motion", "Arms crossed wrong"],
    ["second_hand_misaligned", "hand_position"]),
  phrase("eat", "Eat", false,
    ["Pinch fingertips together", "Move toward your mouth", "Repeat once"],
    ["Hand too open", "Missing the mouth"],
    ["fingers_loose", "hand_position"]),
  phrase("drink", "Drink", false,
    ["Curve your hand like a cup", "Tip it toward your mouth", "Small tilt"],
    ["Hand flat, not cupped", "Over-tilting"],
    ["fingers_loose", "hold_steady"]),
  phrase("more", "More", true,
    ["Pinch fingertips on both hands", "Tap the two clusters together", "Repeat once"],
    ["Hands not meeting", "Only one hand"],
    ["second_hand_misaligned", "fingers_loose"]),
  phrase("family", "Family", true,
    ["Both hands in 'F' shapes", "Circle them outward to meet", "Palms end facing you"],
    ["Hands not meeting", "Palms facing away"],
    ["second_hand_misaligned", "palm_orientation"]),
  phrase("mother", "Mother", false,
    ["Open hand, thumb to chin", "Tap the chin lightly", "Keep fingers up"],
    ["Thumb off the chin", "Fingers folded"],
    ["hand_position", "finger_spread"]),
  phrase("father", "Father", false,
    ["Open hand, thumb to forehead", "Tap the forehead lightly", "Fingers spread up"],
    ["Thumb too low", "Hand closed"],
    ["hand_position", "finger_spread"]),
  phrase("friend", "Friend", true,
    ["Hook both index fingers together", "Then switch and hook again", "Keep it relaxed"],
    ["Fingers not hooking", "Only one hand"],
    ["second_hand_misaligned", "hold_steady"]),
  phrase("understand", "Understand", false,
    ["Fist near your temple", "Flick the index finger up", "One clear flick"],
    ["No flick", "Hand too low"],
    ["hand_position", "hold_steady"]),
  phrase("welcome", "Welcome", false,
    ["Flat hand out to the side, palm up", "Sweep it inward toward you", "Warm, open motion"],
    ["Palm down", "No sweeping motion"],
    ["palm_orientation", "hand_position"]),
];

const EMERGENCY = [
  emergency("help", "Help", true,
    ["Make a thumbs-up on one hand", "Rest it on your open flat palm", "Lift both hands up together"],
    ["Hands not stacked", "No upward lift"],
    ["second_hand_misaligned", "hand_position"]),
  emergency("pain", "Pain", true,
    ["Point both index fingers together", "Twist them toward the hurt area", "Tense expression"],
    ["Fingers not meeting", "No twist"],
    ["second_hand_misaligned", "hold_steady"]),
  emergency("doctor", "Doctor", false,
    ["Form a 'D' handshape", "Tap it on your other wrist (pulse)", "Two clear taps"],
    ["Wrong handshape", "Missing the wrist"],
    ["hand_position", "hold_steady"]),
  emergency("police", "Police", false,
    ["Form a 'C' handshape", "Tap it at your shoulder (badge)", "Firm placement"],
    ["Placement too low", "Hand too open"],
    ["hand_position", "fingers_loose"]),
  emergency("danger", "Danger", true,
    ["Make a fist on your dominant hand", "Strike it upward past the other fist", "Sharp motion"],
    ["Soft motion", "Hands not passing"],
    ["second_hand_misaligned", "fingers_loose"]),
  emergency("call", "Call", false,
    ["Extend thumb and pinky (phone shape)", "Bring it to your ear", "Hold briefly"],
    ["Wrong handshape", "Not reaching the ear"],
    ["hand_position", "hold_steady"]),
];

export const SIGNS = [...LETTERS, ...DIGITS, ...PHRASES, ...EMERGENCY];

export const SIGN_MAP = Object.fromEntries(SIGNS.map((s) => [s.id, s]));

export function getSign(id) {
  return SIGN_MAP[id] || null;
}

export const UNITS = [
  { id: 1, title: "Alphabet A–M", subtitle: "Fingerspelling, first half", always: true },
  { id: 2, title: "Alphabet N–Z", subtitle: "Fingerspelling, second half", always: true },
  { id: 3, title: "Digits 0–9", subtitle: "Numbers", always: true },
  { id: 4, title: "Everyday phrases", subtitle: "Greetings & essentials", requires: 1 },
  { id: 5, title: "Emergency pack", subtitle: "Never gated", always: true, emergency: true },
];

export function signsInUnit(unitId) {
  return SIGNS.filter((s) => s.unit === unitId);
}

export function unitById(unitId) {
  return UNITS.find((u) => u.id === Number(unitId)) || null;
}
