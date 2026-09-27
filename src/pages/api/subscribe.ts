import type { APIRoute } from "astro";
import { m, api } from "../../lib/convex";

export const POST: APIRoute = async ({ request, redirect }) => {
  const wantsJson = (request.headers.get("Accept") ?? "").includes("application/json");
  let email = "";
  let source = "site";
  let trap = "";
  try {
    const form = await request.formData();
    email = String(form.get("email") ?? "");
    source = String(form.get("source") ?? "site");
    trap = String(form.get("website") ?? "");
  } catch {
    /* fall through as invalid */
  }
  let result: { ok: boolean; already?: boolean } = { ok: false };
  if (trap) {
    result = { ok: true }; // honeypot filled: pretend success, store nothing
  } else if (email) {
    try {
      result = await m(api.newsletter.subscribe, { email, source });
    } catch (err) {
      console.error("[subscribe]", err);
      result = { ok: false };
    }
  }
  if (wantsJson) return new Response(JSON.stringify(result), { status: result.ok ? 200 : 400, headers: { "Content-Type": "application/json" } });
  const back = new URL(request.headers.get("Referer") ?? "/newsletter", "https://shinymetal.bot");
  back.searchParams.set("subscribed", result.ok ? "1" : "0");
  back.hash = "newsletter";
  return redirect(back.pathname + back.search + back.hash, 303);
};
