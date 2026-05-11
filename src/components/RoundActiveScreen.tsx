"use client";
import { useState, useEffect } from "react";
import type { Room, Vote } from "@/types";
import { createAccount } from "genlayer-js";
import { submitVote } from "@/lib/contract";

interface Props {
  room: Room;
  roomCode: string;
  account: ReturnType<typeof createAccount>;
  onVoted: () => void;
}
// FIXED - removed getPlayerAddress
const VOTE_LABELS: Record<Vote, string> = {
  fair: "FAIR",
  overpriced: "OVERPRICED",
  steal: "STEAL",
};

const VOTE_DESCRIPTIONS: Record<Vote, string> = {
  fair: "Within 15% of market price",
  overpriced: "More than 15% too expensive",
  steal: "More than 15% below market",
};

export default function RoundActiveScreen({ room, roomCode, account, onVoted }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);

  const myAddr = account.address;
  const round = room.current_round;
  const product = room.products[round];
  const price = room.shown_prices[round];
  const roundVotes = room.votes[String(round)] ?? {};
  const myVote = roundVotes[myAddr] as Vote | undefined;
  const humanPlayers = Object.keys(room.players).filter((p) => !p.startsWith("bot_"));
  const votedCount = humanPlayers.filter((p) => roundVotes[p]).length;

  useEffect(() => {
    setTimeLeft(60);
    const interval = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [round]);

  async function handleVote(vote: Vote) {
    if (myVote || loading) return;
    setLoading(true);
    setError("");
    try {
      await submitVote(account, roomCode, vote);
      onVoted();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Vote failed");
    } finally {
      setLoading(false);
    }
  }

  const timerColor = timeLeft <= 10 ? "var(--red)" : timeLeft <= 20 ? "var(--amber)" : "var(--green)";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <div className="flex items-center justify-between px-6 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="font-label text-sm" style={{ color: "var(--muted)", letterSpacing: "0.1em" }}>
          ROUND {round + 1} / {room.round_count}
        </div>
        <div className="flex items-center gap-2">
          <div className="price-tag text-2xl" style={{ color: timerColor, minWidth: 40, textAlign: "right" }}>
            {timeLeft}
          </div>
          <div className="font-mono text-xs" style={{ color: "var(--muted)" }}>SEC</div>
        </div>
        <div className="font-mono text-xs" style={{ color: "var(--muted)" }}>
          {votedCount}/{humanPlayers.length} VOTED
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-lg fade-up">
          <div className="font-label text-xs mb-4 text-center" style={{ color: "var(--muted)", letterSpacing: "0.15em" }}>
            {product.category.toUpperCase()}
          </div>
          <h2 className="font-display text-center mb-2" style={{ fontSize: "clamp(1.6rem,4vw,2.4rem)", lineHeight: 1.2 }}>
            {product.display_name}
          </h2>
          <p className="font-mono text-center mb-2" style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
            {product.description}
          </p>
          <p className="font-mono text-center mb-10" style={{ color: "var(--very-muted)", fontSize: "0.78rem" }}>
            {product.context}
          </p>
          <div className="text-center mb-10">
            <div className="font-label text-xs mb-2" style={{ color: "var(--muted)", letterSpacing: "0.2em" }}>LISTED AT</div>
            <div className="price-tag" style={{ fontSize: "clamp(3.5rem,12vw,6.5rem)", color: myVote ? "var(--muted)" : "var(--white)", transition: "color 0.3s" }}>
              {price}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {(["fair", "overpriced", "steal"] as Vote[]).map((v) => (
              <button
                key={v}
                className={`vote-btn ${v} ${myVote === v ? "selected" : ""}`}
                onClick={() => handleVote(v)}
                disabled={!!myVote || loading}
              >
                <div>{VOTE_LABELS[v]}</div>
                <div className="font-mono text-xs mt-1" style={{ fontFamily: "var(--font-mono)", opacity: 0.6, letterSpacing: 0, textTransform: "none", fontWeight: 400 }}>
                  {VOTE_DESCRIPTIONS[v]}
                </div>
              </button>
            ))}
          </div>
          {myVote && (
            <div className="mt-6 text-center fade-up">
              <div className="font-label text-sm" style={{ color: "var(--green)", letterSpacing: "0.15em" }}>
                VOTE LOCKED: {VOTE_LABELS[myVote]}
              </div>
              <div className="font-mono text-xs mt-1" style={{ color: "var(--muted)" }}>
                AI is checking the market...
              </div>
            </div>
          )}
          {error && (
            <div className="mt-4 text-center font-mono text-sm" style={{ color: "var(--red)" }}>{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}