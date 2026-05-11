"use client";
import { useState } from "react";
import { makeAccount, createRoom, createSoloRoom, joinRoom } from "@/lib/contract";

interface Props {
  account: ReturnType<typeof makeAccount>;
  onRoomReady: (roomCode: string, playerName: string) => void;
  onLeaderboard: () => void;
  onRejoin: () => void;
}

type Mode = "idle" | "create" | "join" | "solo";

export default function LandingScreen({ account, onRoomReady, onLeaderboard, onRejoin }: Props) {
  const [mode, setMode] = useState<Mode>("idle");
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [rounds, setRounds] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const address = account.address;

  async function handleCreate() {
    if (!name.trim()) return setError("Enter your name first");
    setLoading(true); setError("");
    try {
      const code = await createRoom(account, name.trim(), rounds);
      if (code) onRoomReady(code, name.trim());
      else setError("Room created — check console for code");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create room");
    } finally { setLoading(false); }
  }

  async function handleJoin() {
    if (!name.trim()) return setError("Enter your name first");
    if (!joinCode.trim()) return setError("Enter a room code");
    setLoading(true); setError("");
    try {
      const code = joinCode.trim().toUpperCase();
      await joinRoom(code, name.trim());
      onRoomReady(code, name.trim());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not join room");
    } finally { setLoading(false); }
  }

  async function handleSolo() {
    if (!name.trim()) return setError("Enter your name first");
    setLoading(true); setError("");
    try {
      const code = await createSoloRoom(account, name.trim(), rounds);
      onRoomReady(code, name.trim());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create solo room");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Ticker */}
      <div style={{ borderBottom: "1px solid var(--border)", overflow: "hidden", height: 36 }}>
        <div className="ticker-inner flex gap-16 items-center h-full whitespace-nowrap" style={{ width: "200%" }}>
          {Array(4).fill(0).map((_, i) => (
            <span key={i} className="font-label text-sm" style={{ color: "var(--very-muted)", letterSpacing: "0.1em" }}>
              FAIR &nbsp;·&nbsp; OVERPRICED &nbsp;·&nbsp; STEAL &nbsp;·&nbsp; YOU DECIDE &nbsp;·&nbsp; AI JUDGES &nbsp;·&nbsp; NAME YOUR PRICE &nbsp;·&nbsp; FAIR &nbsp;·&nbsp; OVERPRICED &nbsp;·&nbsp; STEAL &nbsp;·&nbsp; YOU DECIDE &nbsp;·&nbsp; AI JUDGES &nbsp;·&nbsp; NAME YOUR PRICE &nbsp;·&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <div className="text-center mb-12 fade-up">
          <div className="font-label text-sm mb-3" style={{ color: "var(--green)", letterSpacing: "0.2em" }}>
            POWERED BY GENLAYER AI
          </div>
          <h1 className="font-display" style={{ fontSize: "clamp(3rem,8vw,6rem)", lineHeight: 1.05, color: "var(--white)" }}>
            Name Your<br />
            <span style={{ color: "var(--green)", fontStyle: "italic" }}>Price</span>
          </h1>
          <p className="font-mono mt-4" style={{ color: "var(--muted)", fontSize: "0.95rem", maxWidth: 420, margin: "1rem auto 0" }}>
            Think you know what things cost?<br />
            <span style={{ color: "var(--white)" }}>Prove it. The AI is the judge.</span>
          </p>
        </div>

        {/* Address pill */}
        <div className="mb-8 fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="font-mono text-xs px-3 py-1.5" style={{ color: "var(--very-muted)", border: "1px solid var(--border)", borderRadius: 2 }}>
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
        </div>

        {/* Name input — always visible */}
        <div className="w-full max-w-sm mb-6 fade-up" style={{ animationDelay: "0.15s" }}>
          <label className="font-label text-xs block mb-2" style={{ color: "var(--muted)", letterSpacing: "0.12em" }}>YOUR NAME</label>
          <input
            className="input"
            placeholder="e.g. Tolu"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            disabled={loading}
          />
        </div>

        {/* Mode panels */}
        {mode === "idle" && (
          <div className="w-full max-w-sm flex flex-col gap-3 fade-up" style={{ animationDelay: "0.2s" }}>
            <button className="btn btn-primary btn-full" onClick={() => setMode("create")} disabled={loading}>
              CREATE ROOM
            </button>
            <button className="btn btn-ghost btn-full" onClick={() => setMode("join")} disabled={loading}>
              JOIN ROOM
            </button>
            <button className="btn btn-ghost btn-full" onClick={() => setMode("solo")} disabled={loading}>
              SOLO vs AI BOTS
            </button>
            <div className="flex gap-3">
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onLeaderboard} disabled={loading}>
                LEADERBOARD
              </button>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onRejoin} disabled={loading}>
                REJOIN
              </button>
            </div>
          </div>
        )}

        {(mode === "create" || mode === "solo") && (
          <div className="w-full max-w-sm flex flex-col gap-4 fade-up">
            <div>
              <label className="font-label text-xs block mb-2" style={{ color: "var(--muted)", letterSpacing: "0.12em" }}>ROUNDS</label>
              <div className="flex gap-3">
                {[3, 5].map((r) => (
                  <button
                    key={r}
                    className={`btn ${rounds === r ? "btn-primary" : "btn-ghost"}`}
                    style={{ flex: 1 }}
                    onClick={() => setRounds(r)}
                    disabled={loading}
                  >
                    {r} ROUNDS
                  </button>
                ))}
              </div>
            </div>
            <button
              className="btn btn-primary btn-full"
              onClick={mode === "create" ? handleCreate : handleSolo}
              disabled={loading || !name.trim()}
            >
              {loading ? "CREATING..." : mode === "create" ? "CREATE ROOM" : "START SOLO"}
            </button>
            <button className="btn btn-ghost btn-full" onClick={() => { setMode("idle"); setError(""); }} disabled={loading}>
              BACK
            </button>
          </div>
        )}

        {mode === "join" && (
          <div className="w-full max-w-sm flex flex-col gap-4 fade-up">
            <div>
              <label className="font-label text-xs block mb-2" style={{ color: "var(--muted)", letterSpacing: "0.12em" }}>ROOM CODE</label>
              <input
                className="input"
                placeholder="e.g. ABC123"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                disabled={loading}
              />
            </div>
            <button
              className="btn btn-primary btn-full"
              onClick={handleJoin}
              disabled={loading || !name.trim() || !joinCode.trim()}
            >
              {loading ? "JOINING..." : "JOIN ROOM"}
            </button>
            <button className="btn btn-ghost btn-full" onClick={() => { setMode("idle"); setError(""); }} disabled={loading}>
              BACK
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 fade-up" style={{ color: "var(--red)", fontSize: "0.85rem", fontFamily: "var(--font-mono)", maxWidth: 360, textAlign: "center" }}>
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pb-6" style={{ color: "var(--very-muted)", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
        Optimistic Democracy · GenLayer Studionet
      </div>
    </div>
  );
}