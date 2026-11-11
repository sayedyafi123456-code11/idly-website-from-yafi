"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type ProfileStatus = "pending" | "approved" | "rejected";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [joinPin, setJoinPin] = useState("");
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
      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
      if (cleanUsername.length < 3 || cleanUsername.length > 24) {
        throw new Error("Username must be 3–24 characters (letters, numbers or _).");
      }
      if (password.length < 8) throw new Error("Password must be at least 8 characters.");
      // Supabase Auth still requires an email-shaped identifier. This private,
      // non-deliverable address keeps email out of the member-facing sign-in flow.
      const authEmail = cleanUsername + "@feradioz.invalid";

      if (mode === "signup") {
        if (joinPin.trim().length < 4) throw new Error("Enter the Join PIN shared by YAFI.");
        const { data: pinIsValid, error: pinError } = await supabase.rpc("verify_feradioz_join_pin", {
          input_pin: joinPin.trim()
        });
        if (pinError) throw new Error("Join PIN system is not set up yet. Ask YAFI to finish the SQL setup.");
        if (pinIsValid !== true) throw new Error("That Join PIN is not correct.");

        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password,
          options: { data: { username: cleanUsername, display_name: displayName.trim() || cleanUsername } }
        });
        if (error) throw error;
        if (data.session?.user) {
          setUserId(data.session.user.id);
          await loadStatus(data.session.user.id);
        } else {
          setMessage("Account created, but email confirmation is still enabled in Supabase. YAFI must turn it off for username-only access.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password });
        if (error) throw new Error("Username or password is incorrect.");
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
  if (userId && status === "pending") return <div className="auth-screen"><div className="auth-card"><div className="auth-mark">F</div><span className="auth-kicker">REQUEST RECEIVED</span><h1>You’re on the list.</h1><p>Your request is waiting for YAFI to approve it. You can sign out and come back later.</p><button className="auth-submit" onClick={signOut}>Sign out</button></div></div>;
  if (userId && status === "rejected") return <div className="auth-screen"><div className="auth-card"><div className="auth-mark">F</div><h1>Request not approved</h1><p>This account has not been approved for the private circle.</p><button className="auth-submit" onClick={signOut}>Sign out</button></div></div>;

  return <div className="auth-screen"><form className="auth-card" onSubmit={submit}>
    <div className="auth-mark">F</div><span className="auth-kicker">YOUR PRIVATE CIRCLE</span>
    <h1>{mode === "signup" ? "Join FERADIOZ" : "Welcome back"}</h1>
    <p>{mode === "signup" ? "Use the Join PIN from YAFI. Every new member still needs approval." : "Sign in with your username and password."}</p>
    {mode === "signup" && <><label>Display name<input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your name" maxLength={40}/></label></>}
    <label>Username<input value={username} onChange={e=>setUsername(e.target.value)} placeholder="your_username" maxLength={24} required autoComplete="username"/></label>
    {mode === "signup" && <label>Join PIN<input value={joinPin} onChange={e=>setJoinPin(e.target.value)} placeholder="PIN from YAFI" required autoComplete="off"/></label>}
    <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} required autoComplete={mode === "signup" ? "new-password" : "current-password"}/></label>
    <button className="auth-submit" disabled={busy}>{busy ? "Please wait…" : mode === "signup" ? "Request to join" : "Sign in"}</button>
    <button type="button" className="auth-switch" onClick={()=>{setMode(mode === "signup" ? "login" : "signup");setMessage("");}}>{mode === "signup" ? "Already a member? Sign in" : "New here? Request access"}</button>
    {message && <p className="auth-message">{message}</p>}
    <small>Private access · Join PIN + owner approval required</small>
  </form></div>;
}
