import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

export const runDeskBrief = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { snapshot: string }) => input)
  .handler(async ({ context, data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "Desk IQ is offline in this environment." };
    const sql = await getSql();
    const recent = await sql<{ payload: unknown }>`
      select payload from desk_memory
      where user_id = ${context.userId} and kind = 'brief'
      order by created_at desc
      limit 1
    `;
    const last = recent[0]?.payload as { at?: number } | undefined;
    if (last?.at && Date.now() - last.at < 10 * 60_000) {
      return { ok: true as const, text: String((recent[0]?.payload as { text?: string })?.text || ""), cached: true };
    }
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 420,
        messages: [
          {
            role: "system",
            content:
              "You are Fairline, a football betting desk. Be terse. Never promise wins. Score the PROCESS: sit rate, CLV, gates. Give 3 next actions. No betting tips that ignore sample size.",
          },
          { role: "user", content: data.snapshot.slice(0, 4000) },
        ],
      }),
    });
    if (!res.ok) return { ok: false as const, error: `Desk IQ error ${res.status}` };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content?.trim() || "";
    if (!text) return { ok: false as const, error: "Empty brief" };
    await sql`
      insert into desk_memory (user_id, kind, payload)
      values (${context.userId}, ${"brief"}, ${JSON.stringify({ at: Date.now(), text })}::jsonb)
    `;
    return { ok: true as const, text, cached: false };
  });
