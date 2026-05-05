"use client";
import { useState } from "react";
import { getRoom } from "@/lib/contract";
import type { LeaderboardEntry } from "@/types";

// ── REJOIN SCREEN ─────────────────────────────────────────────────────────────

interface RejoinProps {
  onRejoin: (roomCode: string) => void;
  onBack: () => void;
}

export function RejoinScreen({ onRejoin, onBack }: RejoinProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRejoin() {
    if (!code.trim()) return;
    setLoading(true); setError("");
    try {
      const room = await getRoom(code.trim().toUpperCase());
      if (room && room.code) onRejoin(room.code);
      else setError("Room not found");
    } catch {
      setError("Room not found or expired");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm fade-up">
        <div className="text-center mb-8">
          <div className="font-label text-xs mb-2" style={{ color: "var(--muted)", letterSpacing: "0.15em" }}>REJOIN</div>
          <h2 className="font-display" style={{ fontSize: "2.5rem" }}>Back in the game</h2>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="font-label text-xs block mb-2" style={{ color: "var(--muted)", letterSpacing: "0.12em" }}>ROOM CODE</label>
            <input
              className="input"
              placeholder="ABC123"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              disabled={loading}
            />
          </div>
          <button className="btn btn-primary btn-full" onClick={handleRejoin} disabled={loading || !code.trim()}>
            {loading ? "CHECKING..." : "REJOIN ROOM"}
          </button>
          <button className="btn btn-ghost btn-full" onClick={onBack}>BACK</button>
        </div>
        {error && <div className="mt-4 text-center font-mono text-sm" style={{ color: "var(--red)" }}>{error}</div>}
      </div>
    </div>
  );
}

// ── LEADERBOARD SCREEN ────────────────────────────────────────────────────────

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  loading: boolean;
  onBack: () => void;
}

export function LeaderboardScreen({ entries, loading, onBack }: LeaderboardProps) {
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <button className="btn btn-ghost" style={{ padding: "0.5rem 1rem", fontSize: "0.8rem" }} onClick={onBack}>
          ← BACK
        </button>
        <div className="font-label text-lg" style={{ letterSpacing: "0.15em" }}>GLOBAL LEADERBOARD</div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="w-full max-w-lg mx-auto">
          {loading ? (
            <div className="text-center py-16">
              <div className="w-3 h-3 rounded-full pulse mx-auto mb-3" style={{ background: "var(--green)" }} />
              <div className="font-mono text-sm" style={{ color: "var(--muted)" }}>Loading...</div>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16">
              <div className="font-display" style={{ fontSize: "2rem", color: "var(--muted)" }}>No games yet</div>
              <div className="font-mono text-sm mt-2" style={{ color: "var(--very-muted)" }}>Be the first to play</div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Column headers */}
              <div className="flex items-center justify-between px-4 mb-1">
                <div className="font-label text-xs" style={{ color: "var(--very-muted)", letterSpacing: "0.1em" }}>PLAYER</div>
                <div className="flex gap-6">
                  <div className="font-label text-xs text-right" style={{ color: "var(--very-muted)", letterSpacing: "0.1em", width: 48 }}>GAMES</div>
                  <div className="font-label text-xs text-right" style={{ color: "var(--very-muted)", letterSpacing: "0.1em", width: 40 }}>AVG</div>
                  <div className="font-label text-xs text-right" style={{ color: "var(--very-muted)", letterSpacing: "0.1em", width: 48 }}>TOTAL</div>
                </div>
              </div>

              {entries.map((e, i) => (
                <div
                  key={e.address}
                  className="card p-4 flex items-center justify-between fade-up"
                  style={{
                    animationDelay: `${i * 0.04}s`,
                    border: i === 0 ? "1px solid var(--amber)" : "1px solid var(--border)",
                    background: i === 0 ? "var(--amber-dim)" : "var(--bg-card)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="font-label text-base" style={{ width: 28 }}>{medals[i] ?? `${i + 1}.`}</div>
                    <div>
                      <div className="font-mono text-sm">{e.name || e.address.slice(0, 8)}</div>
                      <div className="font-mono text-xs" style={{ color: "var(--muted)" }}>
                        {e.wins}W · {e.minority_wins} minority
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-6 items-center">
                    <div className="font-mono text-sm text-right" style={{ color: "var(--muted)", width: 48 }}>{e.games_played}</div>
                    <div className="font-mono text-sm text-right" style={{ color: "var(--muted)", width: 40 }}>{e.avg_score}</div>
                    <div className="price-tag text-xl text-right" style={{ color: i === 0 ? "var(--amber)" : "var(--white)", width: 56 }}>{e.total_score}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
