// Real tracker slot (PRD §6, §7). The team's OpenCV/MediaPipe pipeline links
// here by implementing the TrackerInterface from adapter.js.
//
// TWO WAYS TO LINK IT:
//   1. Assign a ready instance to `window.ISLTracker` before the app boots, or
//   2. Export it as the default from this file (replace the `null` below).
//
// Until then this exports null and the app falls back to the mock tracker —
// with no other frontend changes required.

// TODO(team): import and export your real tracker instance, e.g.
//   import { createISLTracker } from '@team/isl-tracker';
//   export default createISLTracker();

export default null;
