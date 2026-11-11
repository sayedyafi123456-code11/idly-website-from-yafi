"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type ProfileStatus = "pending" | "approved" | "rejected";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<ProfileStatus | null>(null);
  const [checking, setChecking] = useState(true);

  async function loadStatus(id: string) {
    if (!supabase) return;
    const { data, error } = await supabase.from("profiles").select("status").eq("id", id).single();
    if (error) {
      setMessage("Member database is not ready yet. Ask the owner to run the FERADIOZ SQL setup.");
      setStatus(null);
      setChecking(false);
      return;
    }
    setStatus(data.status as ProfileStatus);
    setChecking(false);
  }

  useEffect(() => {
    if (!supabase) { setChecking(false); return; }
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      const user = data.session?.user;
      setUserId(user?.id ?? null);
      if (user) void loadStatus(user.id);
      else setChecking(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setUserId(user?.id ?? null);
      if (user) void loadStatus(user.id);
      else { setStatus(null); setChecking(false); }
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setMessage("");
    try {
      if (mode === "signup") {
        const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
        if (cleanUsername.length < 3) throw new Error("Username must be at least 3 letters or numbers.");
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { username: cleanUsername, display_name: displayName.trim() || cleanUsername } }
        });
        if (error) throw error;
        if (data.session?.user) {
          setUserId(data.session.user.id);
          await loadStatus(data.session.user.id);
        } else {
          setMessage("Account request created. Check your email to confirm, then sign in. Your account stays pending until the owner approves it.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        if (data.user) {
          setUserId(data.user.id);
          await loadStatus(data.user.id);
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally { setBusy(false); setChecking(false); }
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUserId(null); setStatus(null); setMode("login"); setMessage("Signed out.");
  }

  if (checking) return <div className="auth-screen"><div className="auth-card">Loading FERADIOZ…</div></div>;
  if (!supabase) return <div className="auth-screen"><div className="auth-card"><h1>FERADIOZ</h1><p>Supabase connection settings are missing. Please check the Vercel environment variables.</p></div></div>;
  if (userId && status === "approved") return <><div className="auth-session-bar"><span>Signed in to FERADIOZ</span><button onClick={signOut}>Sign out</button></div>{children}</>;
  if (userId && status === "pending") return <div className="auth-screen"><div className="auth-card"><div className="auth-mark">F</div><span className="auth-kicker">REQUEST RECEIVED</span><h1>You’re on the list.</h1><p>Your account is waiting for YAFI to approve it. You can sign out and come back later.</p><button className="auth-submit" onClick={signOut}>Sign out</button></div></div>;
  if (userId && status === "rejected") return <div className="auth-screen"><div className="auth-card"><div className="auth-mark">F</div><h1>Request not approved</h1><p>This account has not been approved for the private circle.</p><button className="auth-submit" onClick={signOut}>Sign out</button></div></div>;

  return <div className="auth-screen"><form className="auth-card" onSubmit={submit}>
    <div className="auth-mark">F</div><span className="auth-kicker">YOUR PRIVATE CIRCLE</span>
    <h1>{mode === "signup" ? "Join FERADIOZ" : "Welcome back"}</h1>
    <p>{mode === "signup" ? "Create an account. YAFI must approve every new member." : "Sign in to your approved account."}</p>
    {mode === "signup" && <><label>Display name<input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your name" maxLength={40}/></label><label>Username<input value={username} onChange={e=>setUsername(e.target.value)} placeholder="your_username" maxLength={24} required/></label></>}
    <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email"/></label>
    <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} required autoComplete={mode === "signup" ? "new-password" : "current-password"}/></label>
    <button className="auth-submit" disabled={busy}>{busy ? "Please wait…" : mode === "signup" ? "Request to join" : "Sign in"}</button>
    <button type="button" className="auth-switch" onClick={()=>{setMode(mode === "signup" ? "login" : "signup");setMessage("");}}>{mode === "signup" ? "Already a member? Sign in" : "New here? Request access"}</button>
    {message && <p className="auth-message">{message}</p>}
    <small>Private access · Every account needs owner approval</small>
  </form></div>;
}
