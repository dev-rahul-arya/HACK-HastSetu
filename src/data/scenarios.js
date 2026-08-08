// Scenario scene graphs (PRD §4.4). Each beat has a scripted AI line (the
// offline fallback) and the signs the learner is expected to make. When an LLM
// key is present, the AI lines are regenerated to react to sign quality; the
// expected signs always come from this graph so demos stay on rails.

export const SCENARIOS = [
  {
    id: "chai",
    title: "Ordering chai",
    blurb: "Order tea and a snack at a roadside stall.",
    brief: "You are a friendly tea-stall vendor in India serving a customer.",
    signs: ["hello", "food", "no", "thankyou"],
    beats: [
      { ai: "Namaste! Welcome to my stall. What would you like?", expect: ["hello"] },
      { ai: "One hot chai coming up. Anything to eat with it?", expect: ["food"] },
      { ai: "Here's a fresh samosa. Would you like anything more?", expect: ["no"] },
      { ai: "That's twenty rupees. Thank you, come again!", expect: ["thankyou"] },
    ],
  },
  {
    id: "directions",
    title: "Asking directions",
    blurb: "A passer-by helps you find the railway station.",
    brief: "You are a helpful passer-by giving a lost traveller directions.",
    signs: ["hello", "yes", "understand", "thankyou"],
    beats: [
      { ai: "Hello! You look a little lost — can I help?", expect: ["hello"] },
      { ai: "Are you looking for the railway station?", expect: ["yes"] },
      { ai: "Go straight, then take the first left. Did you get that?", expect: ["understand"] },
      { ai: "Wonderful. Safe travels!", expect: ["thankyou"] },
    ],
  },
  {
    id: "doctor",
    title: "At the doctor",
    blurb: "Describe how you feel at a clinic visit.",
    brief: "You are a calm, caring doctor seeing a patient at a clinic.",
    signs: ["hello", "pain", "yes", "thankyou"],
    beats: [
      { ai: "Good morning. What brings you in today?", expect: ["hello"] },
      { ai: "I'm sorry to hear that. Are you in pain?", expect: ["pain"] },
      { ai: "I understand. Shall I prescribe some medicine?", expect: ["yes"] },
      { ai: "Please rest well. Take care of yourself.", expect: ["thankyou"] },
    ],
  },
  {
    id: "office",
    title: "First day at office",
    blurb: "Meet a new colleague on your first day.",
    brief: "You are a warm colleague welcoming a new teammate on their first day.",
    signs: ["hello", "name", "understand", "thankyou"],
    beats: [
      { ai: "Welcome to the team! Great to finally meet you.", expect: ["hello"] },
      { ai: "I didn't catch it — what's your name?", expect: ["name"] },
      { ai: "This will be your desk. Everything clear so far?", expect: ["understand"] },
      { ai: "Perfect. Let's get you settled — glad you're here!", expect: ["thankyou"] },
    ],
  },
];

export const SCENARIO_MAP = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));

export function getScenario(id) {
  return SCENARIO_MAP[id] || null;
}
