"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [username, setUsername] = useState("");
  const [joinPin, setJoinPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!supabase) { setChecking(false); return; }
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setUserId(data.session?.user?.id ?? null);
      setChecking(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setChecking(false);
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMessage("");
    try {
      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
      const pin = joinPin.trim();
      if (cleanUsername.length < 3 || cleanUsername.length > 24) {
        throw new Error("Instagram username must be 3–24 characters (letters, numbers or _).");
      }
      if (pin.length < 4) throw new Error("Enter the FERADIOZ PIN shared by YAFI.");

      const { data: pinIsValid, error: pinError } = await supabase.rpc("verify_feradioz_join_pin", {
        input_pin: pin
      });
      if (pinError) throw new Error("FERADIOZ PIN setup is not ready. Ask YAFI to check the Supabase SQL setup.");
      if (pinIsValid !== true) throw new Error("The FERADIOZ PIN is not correct.");

      // Supabase Auth requires an email-shaped identifier and a longer password.
      // The member only enters the shared PIN; this deterministic value is never shown.
      const authEmail = cleanUsername + "@feradioz.invalid";
      const authPassword = "FERADIOZ:" + pin;
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword
      });

      if (!loginError && loginData.user) {
        setUserId(loginData.user.id);
        return;
      }

      // First visit: create the member account automatically after PIN verification.
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
        options: { data: { username: cleanUsername, display_name: cleanUsername } }
      });
      if (signupError) {
        throw new Error("This username already has an account, or the PIN is incorrect for that account. Ask YAFI to check the account setup.");
      }
      if (signupData.session?.user) {
        setUserId(signupData.session.user.id);
      } else {
        setMessage("Account created. Email confirmation must be OFF in Supabase before you can enter.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUserId(null);
    setMessage("Signed out.");
  }

  if (checking) return <div className="auth-screen"><div className="auth-card">Loading FERADIOZ…</div></div>;
  if (!supabase) return <div className="auth-screen"><div className="auth-card"><h1>FERADIOZ</h1><p>Supabase connection settings are missing. Please check the Vercel environment variables.</p></div></div>;
  if (userId) return <><div className="auth-session-bar"><span>Signed in to FERADIOZ</span><button onClick={signOut}>Sign out</button></div>{children}</>;

  return <div className="auth-screen"><form className="auth-card" onSubmit={submit}>
    <div className="auth-mark">F</div>
    <span className="auth-kicker">YOUR PRIVATE CIRCLE</span>
    <h1>Enter FERADIOZ</h1>
    <p>Use your Instagram username and the shared FERADIOZ PIN from YAFI.</p>
    <label>Instagram username<input value={username} onChange={e=>setUsername(e.target.value)} placeholder="your_instagram_username" maxLength={24} required autoComplete="username"/></label>
    <label>FERADIOZ PIN<input type="password" value={joinPin} onChange={e=>setJoinPin(e.target.value)} placeholder="Enter shared PIN" required autoComplete="off"/></label>
    <button className="auth-submit" disabled={busy}>{busy ? "Please wait…" : "Enter FERADIOZ"}</button>
    {message && <p className="auth-message">{message}</p>}
    <small>Private access · Instagram username + shared PIN</small>
  </form></div>;
}
