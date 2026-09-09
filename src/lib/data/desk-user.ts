import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

export const bootstrapDesk = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const existing = await sql<{ user_id: string }>`select user_id from desk_profile limit 1`;
    const role = existing.length === 0 ? "admin" : "analyst";
    await sql`
      insert into desk_profile (user_id, role)
      values (${context.userId}, ${role})
      on conflict (user_id) do nothing
    `;
    const row = await sql<{ role: string }>`select role from desk_profile where user_id = ${context.userId}`;
    return { role: row[0]?.role ?? "analyst", userId: context.userId };
  });

export const getDeskRole = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const row = await sql<{ role: string }>`select role from desk_profile where user_id = ${context.userId}`;
    return { role: row[0]?.role ?? null, userId: context.userId };
  });
