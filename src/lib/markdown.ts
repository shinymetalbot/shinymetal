import { Marked } from "marked";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

// Article bodies come from the publish API; raw HTML is escaped, links open safely.
const marked = new Marked({
  gfm: true,
  renderer: {
    html(token) {
      return esc(token.text);
    },
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const safe = /^(https?:|\/|#|mailto:)/i.test(href) ? href : "#";
      const ext = /^https?:/i.test(safe) && !safe.includes("shinymetal.bot");
      return `<a href="${esc(safe)}"${title ? ` title="${esc(title)}"` : ""}${ext ? ' rel="noopener" target="_blank"' : ""}>${text}</a>`;
    },
  },
});

export function renderMarkdown(md: string): string {
  // Drop a leading H1 if the writer repeated the title.
  return marked.parse(md.replace(/^\s*#\s+[^\n]+\n/, "")) as string;
}

export function plainText(md: string, max = 300): string {
  const t = md.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[#*_>`]/g, "").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}
