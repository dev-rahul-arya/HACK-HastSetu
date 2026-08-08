// A single sign tile in the Learn unit grid. States: locked / available /
// learned / mastered (PRD §4.2). Locked tiles are inert; the rest link to the
// lesson. Two-handed signs get a small node badge (ISL calls these out).

import { Link } from "react-router-dom";
import { CheckIcon, LockIcon } from "./icons.jsx";

export default function SignTile({ sign, status, best }) {
  const locked = status === "locked";
  const label = status === "mastered" ? "Mastered"
    : status === "learned" ? "Learned"
    : status === "available" ? "Ready" : "Locked";

  const inner = (
    <>
      <div className="tile__top">
        {sign.twoHanded && (
          <span className="tile__two" title="Two-handed sign" aria-label="Two-handed sign" />
        )}
        {status === "mastered" && <span className="tile__star" aria-hidden="true">★</span>}
        {status === "learned" && <CheckIcon size={16} />}
        {locked && <LockIcon size={16} />}
      </div>
      <span className="tile__glyph" aria-hidden="true">{sign.label}</span>
      <div className="tile__foot">
        <span className="tile__status">{label}</span>
        {best > 0 && <span className="tile__score mono">{best}</span>}
      </div>
    </>
  );

  if (locked) {
    return (
      <div className={`tile tile--${status}`} aria-label={`${sign.label}, locked`}>
        {inner}
      </div>
    );
  }

  return (
    <Link
      to={`/learn/${sign.unit}/${sign.id}`}
      className={`tile tile--${status}`}
      aria-label={`${sign.label}, ${label}${best > 0 ? `, best ${best}` : ""}`}
    >
      {inner}
    </Link>
  );
}
