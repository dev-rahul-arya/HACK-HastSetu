// Dummy credential list (PRD §4.0). Demo build only — never real security.
// Passwords compared in plain JS; no hashing (explicit non-goal).

export const USERS = [
  { username: "demo", password: "demo123", name: "Demo User", seed: "demo" },
  { username: "aarav", password: "hello123", name: "Aarav", seed: null },
  { username: "meera", password: "signs123", name: "Meera", seed: null },
];

export function findUser(username, password) {
  const u = USERS.find(
    (x) => x.username === username.trim().toLowerCase(),
  );
  if (!u || u.password !== password) return null;
  return u;
}

export function userByName(username) {
  return USERS.find((x) => x.username === username) || null;
}
