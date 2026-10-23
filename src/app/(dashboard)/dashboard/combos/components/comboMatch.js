/**
 * Matching a combo member to the usage row the stream recorded for it.
 *
 * A member is stored with the name the operator uses ("cbai/deepseek-v4.1-flash")
 * while the stream reports the provider the gateway resolved, which for a custom
 * provider is a slug ("openai-compatible-chat-<uuid>"). So the match runs in
 * order: provider + model tail, then provider, and only then the model tail.
 *
 * These live outside the component so the rules can be tested directly — the
 * `oc` / `ocz` pair below is the reason to.
 */

/** "cbai/deepseek-v4.1-flash" -> { provider: "cbai", model: "deepseek-v4.1-flash" }. */
export function parseMember(raw) {
  const s = String(raw || "").trim();
  const i = s.indexOf("/");
  return i > 0
    ? { provider: s.slice(0, i), model: s.slice(i + 1) }
    : { provider: s, model: "" };
}

/** Last path segment of a model id: "cbai/deepseek-v4.1-flash" -> "deepseek-v4.1-flash". */
export function modelTail(model) {
  const parts = String(model || "").toLowerCase().trim().split("/");
  return parts[parts.length - 1];
}

/**
 * Whether two provider names denote the same provider.
 *
 * A prefix only counts when it ends on a separator: providers are named things
 * like "lucif" and "lucif.ai", but they are also named "oc" and "ocz", and a
 * bare prefix test makes those two the same provider — which silently labels a
 * member with its twin's result.
 */
export function sameProvider(a, b) {
  const x = String(a || "").toLowerCase().trim();
  const y = String(b || "").toLowerCase().trim();
  if (!x || !y) return false;
  if (x === y) return true;
  const [long, short] = x.length >= y.length ? [x, y] : [y, x];
  if (!long.startsWith(short)) return false;
  return /^[^a-z0-9]/.test(long.slice(short.length));
}

/**
 * The row recorded for one combo member, or undefined when the stream has none.
 *
 * Provider first, so two members that differ only by provider
 * (oc/space-bunny-free vs ocz/space-bunny-free) never swap rows; the model tail
 * is only the fallback for providers the stream reports by slug.
 *
 * `siblings` are the other member providers of the same combo. With them, the
 * tail fallback refuses a row whose provider belongs to a sibling: a slug is
 * unknown, so the tail may stand in for it, but a known provider name is not —
 * otherwise a combo holding both `oc/x` and `ocz/x` would give the `ocz` member
 * the `oc` member's result whenever the `oc` row is the only one present.
 */
export function matchMemberRow(rows, provider, model, siblings) {
  const list = rows || [];
  const tail = modelTail(model);
  const byProviderAndTail = list.find(
    (r) => sameProvider(r.provider, provider) && Boolean(tail) && modelTail(r.model) === tail,
  );
  if (byProviderAndTail) return byProviderAndTail;
  const byProvider = list.find((r) => sameProvider(r.provider, provider));
  if (byProvider) return byProvider;
  if (!tail) return undefined;
  return list.find((r) => {
    if (modelTail(r.model) !== tail) return false;
    if (!siblings) return true;
    // another member of this combo owns that provider name: not a slug
    return !siblings.some((s) => !sameProvider(s, provider) && sameProvider(r.provider, s));
  });
}
