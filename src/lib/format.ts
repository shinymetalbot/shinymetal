export type ClaimKind = "shipped" | "preorder" | "promise" | "rumor" | "research";
export type RobotStatus = "internal" | "announced" | "preorder" | "shipping" | "homes" | "discontinued";

export const CLAIMS: Record<ClaimKind, { word: string; help: string }> = {
  shipped: { word: "Shipped", help: "Customers have it." },
  preorder: { word: "Preorder", help: "Money taken, nothing delivered yet." },
  promise: { word: "Promise", help: "The company said it will happen." },
  rumor: { word: "Rumor", help: "Unconfirmed; see the confidence meter." },
  research: { word: "Research", help: "A lab result, not a product." },
};

export const STATUS: Record<RobotStatus, { word: string; tone: string; help: string }> = {
  internal: { word: "Internal only", tone: "neutral", help: "Demos and the maker's own sites only." },
  announced: { word: "Announced", tone: "rumor", help: "Revealed, but no one can order it." },
  preorder: { word: "Preorder", tone: "preorder", help: "Taking deposits or reservations." },
  shipping: { word: "Shipping", tone: "research", help: "Buyers (often businesses or labs) receive units." },
  homes: { word: "In homes", tone: "shipped", help: "Verified in consumer homes." },
  discontinued: { word: "Discontinued", tone: "danger", help: "Cancelled, shelved or the maker shut down." },
};

export const TYPE_WORD: Record<string, string> = {
  decoded: "Press release, decoded",
  rumor: "Rumor",
  research: "Research explainer",
  case: "Case study",
};

export const CATEGORY_WORD: Record<string, string> = {
  humanoid: "Humanoid",
  quadruped: "Robot dog",
  home: "Home robot",
  arm: "Robot arm",
  kit: "Open-source kit",
};

export const FCC_WORD: Record<string, string> = {
  approved: "Authorized",
  pending: "Pending",
  "not-filed": "Not filed",
  barred: "Barred (new models)",
  "n/a": "Not applicable",
  unknown: "Unknown",
};

export const TELEOP_WORD: Record<string, string> = {
  yes: "Yes, remote operators",
  partial: "Partly",
  no: "No",
  unknown: "Not disclosed",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-09-24" -> "24 Sep 2026" (tolerates "2026-09" and "2026"). */
export function fmtDate(d?: string | null, withYear = true): string {
  if (!d) return "";
  const [y, m, day] = d.slice(0, 10).split("-");
  if (!m) return y;
  if (!day) return `${MONTHS[+m - 1]} ${y}`;
  return `${+day} ${MONTHS[+m - 1]}${withYear ? " " + y : ""}`;
}

export function fmtPrice(n?: number | null): string {
  if (n == null) return "";
  return "$" + Math.round(n).toLocaleString("en-US");
}

export function fmtNum(n: number | null | undefined, unit: string, digits = 2): string {
  if (n == null) return "—";
  const s = Number.isInteger(n) ? String(n) : n.toFixed(digits).replace(/0+$/, "").replace(/\.$/, "");
  return unit ? `${s} ${unit}` : s;
}

export function robotSpecs(r: any): Array<[string, string]> {
  return [
    ["Height", fmtNum(r.heightM, "m")],
    ["Weight", fmtNum(r.weightKg, "kg", 1)],
    ["Payload", fmtNum(r.payloadKg, "kg", 1)],
    ["Runtime", fmtNum(r.runtimeH, "h", 1)],
  ];
}

export function priceLabel(r: any): string {
  if (r.priceUsd != null) return (r.priceClaim === "promise" || r.priceClaim === "rumor" ? "≈ " : "From ") + fmtPrice(r.priceUsd);
  return "Price not announced";
}

export function absUrl(path: string) {
  return new URL(path, "https://shinymetal.bot").toString();
}

/** Card image: the robot's own photo, else the category line drawing (captioned as generic). */
export function robotImage(r: any): { src: string; drawing: boolean; caption: string | null } {
  if (r.imageUrl) return { src: r.imageUrl, drawing: false, caption: r.imageCaption ?? null };
  const cat = ["humanoid", "quadruped", "home", "arm", "kit"].includes(r.category) ? r.category : "humanoid";
  return { src: `/img/category-${cat}.webp`, drawing: true, caption: `Generic ${(CATEGORY_WORD[cat] ?? cat).toLowerCase()} illustration, not the ${r.maker} ${r.name}.` };
}
