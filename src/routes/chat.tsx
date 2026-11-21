import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowUp, Building2, Loader2 } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { PropertyCard } from "@/components/PropertyCard";
import { chatFind } from "@/lib/listings.functions";
import type { Listing } from "@/lib/listings";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Property Finder — DubaiNest" },
      { name: "description", content: "Describe your ideal Dubai home in your own words and get ranked matches." },
      { property: "og:title", content: "AI Property Finder — DubaiNest" },
      { property: "og:description", content: "Describe your ideal Dubai home and get ranked matches." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Chat,
});

type Msg = { role: "user" | "assistant"; content: string; listings?: Listing[] };
const CHIPS = [
  "2-bed in Dubai Marina under 150k/year",
  "Family villa to buy under 6M",
  "Best value studio for rent",
  "Biggest apartment in Downtown",
];

function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);
  useEffect(() => { if (!busy) inputRef.current?.focus(); }, [busy]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: t }];
    setMsgs(next); setInput(""); setBusy(true);
    try {
      const res = await chatFind({ data: { messages: next.map(({ role, content }) => ({ role, content })) } });
      setMsgs([...next, { role: "assistant", content: res.reply, listings: res.listings }]);
    } catch {
      setMsgs([...next, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally { setBusy(false); }
  }

  return (
    <div className="flex h-screen flex-col">
      <AppNav />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
          {msgs.length === 0 && (
            <div className="fade-up py-12 text-center">
              <div className="bg-gold mx-auto flex h-14 w-14 items-center justify-center rounded-2xl shadow-glow"><Building2 className="h-7 w-7" /></div>
              <h1 className="mt-6 font-display text-4xl font-semibold sm:text-5xl">Tell me what <span className="text-gold">home</span> you want</h1>
              <p className="mt-3 text-muted-foreground">Write freely — budget, area, bedrooms, lifestyle. I'll rank the best matches.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {CHIPS.map((c) => <button key={c} onClick={() => send(c)} className="glass rounded-full px-4 py-2 text-sm transition-colors hover:text-accent-foreground">{c}</button>)}
              </div>
            </div>
          )}
          {msgs.map((m, i) => m.role === "user" ? (
            <div key={i} className="flex justify-end"><div className="bg-gold max-w-[80%] rounded-2xl rounded-br-sm px-4 py-3 text-sm">{m.content}</div></div>
          ) : (
            <div key={i} className="fade-up space-y-4">
              <div className="prose-sm max-w-none text-sm leading-relaxed [&_p]:mb-2"><ReactMarkdown>{m.content}</ReactMarkdown></div>
              {m.listings && m.listings.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {m.listings.map((l, r) => <PropertyCard key={l.id} l={l} rank={r + 1} compact />)}
                </div>
              )}
            </div>
          ))}
          {busy && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Searching listings…</div>}
          <div ref={endRef} />
        </div>
      </div>
      <div className="border-t border-border/60 bg-background/80 backdrop-blur-xl">
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="glass mx-auto my-4 flex max-w-4xl items-end gap-2 rounded-2xl p-2 mx-4 sm:mx-auto">
          <textarea ref={inputRef} rows={1} value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="e.g. 2-bed near the metro in JLT under 110k" className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground" />
          <button type="submit" disabled={busy || !input.trim()} aria-label="Send" className="bg-gold flex h-11 w-11 shrink-0 items-center justify-center rounded-xl disabled:opacity-40"><ArrowUp className="h-5 w-5" /></button>
        </form>
      </div>
    </div>
  );
}
