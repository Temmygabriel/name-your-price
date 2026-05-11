"use client";
import { useState } from "react";
import type { Room } from "@/types";
import { makeAccount, toggleReady, startGame } from "@/lib/contract";

interface Props {
  room: Room;
  roomCode: string;
  playerName: string;
  account: ReturnType<typeof makeAccount>;
  onLeave: () => void;
}

export default function LobbyScreen({ room, roomCode, playerName, account, onLeave }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const myAddr = account.address;
  const isHost = room.host === myAddr;
  const me = room.players[myAddr];
  const humanPlayers = Object.entries(room.players)
    .filter(([, p]) => !p.is_bot)
    .map(([addr, p]) => ({ ...p, address: addr }));
  const allOthersReady = humanPlayers
    .filter((p) => p.address !== myAddr)
    .every((p) => p.ready);
  const canStart = isHost && humanPlayers.length >= 2 && allOthersReady;

  async function handleReady() {
    setLoading(true); setError("");
    try { await toggleReady(account, roomCode); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setLoading(false); }
  }

  async function handleStart() {
    setLoading(true); setError("");
    try { await startGame(account, roomCode); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-md fade-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="font-label text-xs mb-2" style={{ color: "var(--muted)", letterSpacing: "0.15em" }}>LOBBY</div>
          <div className="font-display mb-1" style={{ fontSize: "2.5rem" }}>
            Room <span style={{ color: "var(--green)" }}>{roomCode}</span>
          </div>
          <div className="font-mono text-sm" style={{ color: "var(--muted)" }}>
            {room.round_count} rounds · {humanPlayers.length}/8 players
          </div>
        </div>

        {/* Room code to share */}
        <div className="card p-4 mb-6 text-center" style={{ border: "1px dashed var(--green)", background: "var(--green-dim)" }}>
          <div className="font-label text-xs mb-1" style={{ color: "var(--green)", letterSpacing: "0.15em" }}>SHARE THIS CODE</div>
          <div className="price-tag" style={{ fontSize: "2.5rem", color: "var(--green)", letterSpacing: "0.2em" }}>{roomCode}</div>
        </div>

        {/* Player list */}
        <div className="card p-4 mb-6">
          <div className="font-label text-xs mb-3" style={{ color: "var(--muted)", letterSpacing: "0.12em" }}>PLAYERS</div>
          <div className="flex flex-col gap-2">
            {humanPlayers.map((p) => (
              <div key={p.address} className="flex items-center justify-between py-2 px-3" style={{ background: "var(--bg)", borderRadius: 2 }}>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{
                    background: p.ready || p.address === room.host ? "var(--green)" : "var(--very-muted)"
                  }} />
                  <span className="font-mono text-sm">
                    {p.name}
                    {p.address === room.host && (
                      <span className="font-label text-xs ml-2" style={{ color: "var(--amber)", letterSpacing: "0.08em" }}>HOST</span>
                    )}
                    {p.address === myAddr && (
                      <span className="font-label text-xs ml-2" style={{ color: "var(--muted)", letterSpacing: "0.08em" }}>YOU</span>
                    )}
                  </span>
                </div>
                <div className="font-label text-xs" style={{
                  color: p.ready || p.address === room.host ? "var(--green)" : "var(--very-muted)",
                  letterSpacing: "0.1em"
                }}>
                  {p.address === room.host ? "HOST" : p.ready ? "READY" : "WAITING"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {isHost ? (
            <button className="btn btn-primary btn-full" onClick={handleStart} disabled={loading || !canStart}>
              {loading ? "STARTING..." : canStart ? "START GAME" : humanPlayers.length < 2 ? "WAITING FOR PLAYERS..." : "WAITING FOR READY..."}
            </button>
          ) : (
            <button
              className={`btn btn-full ${me?.ready ? "btn-ghost" : "btn-primary"}`}
              onClick={handleReady}
              disabled={loading}
            >
              {loading ? "..." : me?.ready ? "CANCEL READY" : "I'M READY"}
            </button>
          )}
          <button className="btn btn-ghost btn-full" onClick={onLeave}>LEAVE</button>
        </div>

        {error && (
          <div className="mt-3 text-center font-mono text-sm" style={{ color: "var(--red)" }}>{error}</div>
        )}
      </div>
    </div>
  );
}