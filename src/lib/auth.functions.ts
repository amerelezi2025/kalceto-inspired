import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  isCodeExpired,
  isLocked,
  isValidEmail,
  MAX_WRONG_ATTEMPTS,
  normalizeEmail,
  sendBlockReason,
} from "./otp-rules";

// Email-code login. Channel-agnostic shape ("identifier") so phone/SMS can be added later.
function publicClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

function clientIp() {
  return (
    getRequestHeader("cf-connecting-ip") ||
    getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

type Fail = { ok: false; error: string; wait?: number; attemptsLeft?: number };

export const requestCode = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ email: z.string().max(255), mode: z.enum(["signup", "login"]) }).parse(d))
  .handler(async ({ data }): Promise<{ ok: true } | Fail> => {
    const email = normalizeEmail(data.email);
    if (!isValidEmail(email)) return { ok: false, error: "Please enter a valid email address." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ip = clientIp();
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 3600_000).toISOString();

    const [last, emailCount, ipCount] = await Promise.all([
      supabaseAdmin.from("otp_requests").select("created_at").eq("email", email).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabaseAdmin.from("otp_requests").select("id", { count: "exact", head: true }).eq("email", email).gte("created_at", hourAgo),
      supabaseAdmin.from("otp_requests").select("id", { count: "exact", head: true }).eq("ip", ip).gte("created_at", hourAgo),
    ]);
    const block = sendBlockReason({
      lastSentAt: last.data ? new Date(last.data.created_at) : null,
      emailSendsLastHour: emailCount.count ?? 0,
      ipSendsLastHour: ipCount.count ?? 0,
      now,
    });
    if (block?.code === "cooldown") return { ok: false, error: `Please wait ${block.wait}s before asking for a new email.`, wait: block.wait };
    if (block) return { ok: false, error: "Too many emails requested. Please try again in an hour." };

    // Send the user back to this same site: new accounts go straight to "choose a password".
    const origin = getRequestHeader("origin");
    const safeOrigin = origin && /^https?:\/\/[^/]+$/.test(origin) ? origin : undefined;
    const emailRedirectTo = safeOrigin ? `${safeOrigin}${data.mode === "signup" ? "/set-password" : "/dashboard"}` : undefined;

    const { error } = await publicClient().auth.signInWithOtp({
      email,
      options: { shouldCreateUser: data.mode === "signup", emailRedirectTo },
    });
    if (error) {
      console.error("signInWithOtp", error.message);
      if (/signups not allowed|not found/i.test(error.message))
        return { ok: false, error: "No account with this email yet. Please sign up first." };
      if (error.status === 429) return { ok: false, error: "Too many emails sent right now. Please try again later." };
      return { ok: false, error: "We couldn't send the email. Please try again." };
    }
    await supabaseAdmin.from("otp_requests").insert({ email, ip });
    return { ok: true };
  });

export const verifyCode = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ email: z.string().max(255), code: z.string().regex(/^\d{6,8}$/) }).parse(d))
  .handler(async ({ data }): Promise<{ ok: true; access_token: string; refresh_token: string } | Fail> => {
    const email = normalizeEmail(data.email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("otp_requests").select("*").eq("email", email)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();

    if (!row || row.used) return { ok: false, error: "No active code. Please request a new one." };
    if (isCodeExpired(new Date(row.created_at), new Date())) return { ok: false, error: "This code has expired. Please request a new one." };
    if (isLocked(row.failed_attempts)) return { ok: false, error: "Too many wrong attempts. Please request a new code.", attemptsLeft: 0 };

    const { data: session, error } = await publicClient().auth.verifyOtp({ email, token: data.code, type: "email" });
    if (error || !session.session) {
      const failed = row.failed_attempts + 1;
      await supabaseAdmin.from("otp_requests").update({ failed_attempts: failed }).eq("id", row.id);
      const left = Math.max(0, MAX_WRONG_ATTEMPTS - failed);
      return { ok: false, error: left ? `Wrong code. ${left} attempt${left === 1 ? "" : "s"} left.` : "Too many wrong attempts. Please request a new code.", attemptsLeft: left };
    }
    await supabaseAdmin.from("otp_requests").update({ used: true }).eq("id", row.id);
    return { ok: true, access_token: session.session.access_token, refresh_token: session.session.refresh_token };
  });
