"use client";
import { useEffect, useState } from "react";
import type { Room, Vote } from "@/types";
import { makeAccount } from "@/lib/contract";

interface Props {
  room: Room;
  roomCode: string;
  account: ReturnType<typeof makeAccount>;
}

const VERDICT_LABELS: Record<string, string> = {
  fair: "FAIR",
  overpriced: "OVERPRICED",
  steal: "STEAL",
};
const VERDICT_COLORS: Record<string, string> = {
  fair: "var(--green)",
  overpriced: "var(--red)",
  steal: "var(--amber)",
};
const VERDICT_BG: Record<string, string> = {
  fair: "var(--green-dim)",
  overpriced: "var(--red-dim)",
  steal: "var(--amber-dim)",
};

export default function RoundRevealScreen({ room, roomCode, account }: Props) {
  const [animate, setAnimate] = useState(false);
  const myAddr = account.address;
  const round = room.current_round;
  const verdict = room.verdicts[String(round)];
  const product = room.products[round];
  const price = room.shown_prices[round];
  const roundScores = room.round_scores[String(round)] ?? {};
  const roundVotes = room.votes[String(round)] ?? {};
  const humanPlayers = Object.values(room.players).filter((p) => !p.is_bot);
  const myScore = roundScores[myAddr] ?? 0;
  const myVote = roundVotes[myAddr] as Vote | undefined;
  const gotItRight = myVote === verdict?.verdict;

  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (!verdict) return null;

  const v = verdict.verdict;
  const color = VERDICT_COLORS[v] || "var(--white)";
  const bg = VERDICT_BG[v] || "transparent";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <div className="flex items-center justify-between px-6 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="font-label text-sm" style={{ color: "var(--muted)", letterSpacing: "0.1em" }}>
          ROUND {round + 1} / {room.round_count}
        </div>
        <div className="font-label text-sm" style={{ color: "var(--muted)", letterSpacing: "0.1em" }}>
          VERDICT
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="w-full max-w-lg mx-auto flex flex-col gap-5">
          <div className="text-center">
            <div className="font-mono text-sm mb-1" style={{ color: "var(--muted)" }}>{product.display_name}</div>
            <div className="price-tag" style={{ fontSize: "2rem", color: "var(--muted)" }}>{price}</div>
          </div>

          <div
            className="card p-8 text-center fade-up"
            style={{ border: `2px solid ${color}`, background: bg }}
          >
            <div className="font-label text-xs mb-3" style={{ color, letterSpacing: "0.2em" }}>AI VERDICT</div>
            <div
              className="font-display"
              style={{
                fontSize: "clamp(2.5rem,10vw,4.5rem)",
                color,
                lineHeight: 1,
                transform: animate ? "scale(1)" : "scale(0.85)",
                transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",
              }}
            >
              {VERDICT_LABELS[v]}
            </div>
            <div className="font-mono text-sm mt-3" style={{ color: "var(--muted)" }}>
              Market price: <span style={{ color: "var(--white)" }}>{verdict.market_price}</span>
            </div>
            <div className="font-mono text-xs mt-2" style={{ color: "var(--muted)", lineHeight: 1.5 }}>
              "{verdict.reasoning}"
            </div>
            <div className="font-label text-xs mt-2" style={{ color: "var(--very-muted)", letterSpacing: "0.1em" }}>
              CONFIDENCE: {verdict.confidence.toUpperCase()}
            </div>
          </div>

          {verdict.contested && (
            <div className="card p-3 text-center fade-up" style={{ border: "1px solid var(--amber)", background: "var(--amber-dim)" }}>
              <div className="font-label" style={{ color: "var(--amber)", letterSpacing: "0.15em" }}>⚡ CONTESTED</div>
              <div className="font-mono text-xs mt-1" style={{ color: "var(--muted)" }}>
                Majority disagreed with AI — no penalty. Human consensus logged on-chain.
              </div>
            </div>
          )}

          <div
            className="card p-4 text-center fade-up"
            style={{
              border: `1px solid ${gotItRight ? "var(--green)" : "var(--border)"}`,
              background: gotItRight ? "var(--green-dim)" : "var(--bg-card)",
            }}
          >
            <div className="font-label text-xs mb-1" style={{ color: gotItRight ? "var(--green)" : "var(--muted)", letterSpacing: "0.12em" }}>
              YOUR RESULT
            </div>
            <div className="font-mono text-sm mb-1" style={{ color: "var(--muted)" }}>
              Voted: <span style={{ color: "var(--white)" }}>{myVote?.toUpperCase() ?? "—"}</span>
            </div>
            <div className="price-tag" style={{ fontSize: "2.5rem", color: gotItRight ? "var(--green)" : "var(--red)" }}>
              {myScore > 0 ? `+${myScore}` : "0"} pts
            </div>
          </div>

          <div className="card p-4 fade-up">
            <div className="font-label text-xs mb-3" style={{ color: "var(--muted)", letterSpacing: "0.12em" }}>SCOREBOARD</div>
            <div className="flex flex-col gap-2">
              {humanPlayers
                .sort((a, b) => (room.players[b.address]?.score ?? 0) - (room.players[a.address]?.score ?? 0))
                .map((p) => {
                  const pVote = roundVotes[p.address] as Vote | undefined;
                  const pScore = roundScores[p.address] ?? 0;
                  const correct = pVote === v;
                  return (
                    <div key={p.address} className="flex items-center justify-between py-2 px-3" style={{ background: "var(--bg)", borderRadius: 2 }}>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ background: correct ? "var(--green)" : "var(--very-muted)" }} />
                        <div>
                          <div className="font-mono text-sm">{p.name} {p.address === myAddr && <span style={{ color: "var(--very-muted)" }}>(you)</span>}</div>
                          <div className="font-label text-xs" style={{ color: correct ? VERDICT_COLORS[v] : "var(--very-muted)", letterSpacing: "0.08em" }}>
                            {pVote ? pVote.toUpperCase() : "—"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm" style={{ color: "var(--white)" }}>
                          {p.score} pts
                        </div>
                        {pScore > 0 && (
                          <div className="font-label text-xs score-pop" style={{ color: "var(--green)", letterSpacing: "0.08em" }}>
                            +{pScore}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {room.is_solo && (
            <div className="card p-4 fade-up">
              <div className="font-label text-xs mb-3" style={{ color: "var(--muted)", letterSpacing: "0.12em" }}>AI BOT VOTES</div>
              <div className="flex flex-col gap-1">
                {Object.values(room.players)
                  .filter((p) => p.is_bot)
                  .map((p) => {
                    const bVote = roundVotes[p.address] as Vote | undefined;
                    const correct = bVote === v;
                    return (
                      <div key={p.address} className="flex items-center justify-between py-1.5 px-3" style={{ background: "var(--bg)", borderRadius: 2 }}>
                        <span className="font-mono text-sm" style={{ color: "var(--muted)" }}>{p.name}</span>
                        <span className="font-label text-xs" style={{ color: correct ? "var(--green)" : "var(--very-muted)", letterSpacing: "0.08em" }}>
                          {bVote ? bVote.toUpperCase() : "—"}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}