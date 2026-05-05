"use client";
import type { Room, Vote } from "@/types";
import { getPlayerAddress } from "@/lib/contract";

interface Props { room: Room; }

export default function RoundScoringWaitScreen({ room }: Props) {
  const myAddr = getPlayerAddress();
  const round = room.current_round;
  const roundVotes = room.votes[String(round)] ?? {};
  const humanPlayers = Object.keys(room.players).filter((p) => !p.startsWith("bot_"));
  const votedCount = humanPlayers.filter((p) => roundVotes[p]).length;

  // Tally votes anonymously — DON'T reveal which option got which %
  const total = humanPlayers.length;
  const voted = votedCount;
  const pct = total > 0 ? Math.round((voted / total) * 100) : 0;

  // Count each option without revealing labels until verdict
  const counts: Record<Vote, number> = { fair: 0, overpriced: 0, steal: 0 };
  humanPlayers.forEach((pid) => {
    const v = roundVotes[pid] as Vote;
    if (v) counts[v]++;
  });

  // Sort by count desc to show bars but with ANON labels (A, B, C)
  const sorted = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([, count], i) => ({ label: String.fromCharCode(65 + i), count }));

  const product = room.products[round];
  const price = room.shown_prices[round];
  const myVote = roundVotes[myAddr] as Vote | undefined;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-md fade-up">
        {/* Product reminder */}
        <div className="text-center mb-8">
          <div className="font-label text-xs mb-1" style={{ color: "var(--muted)", letterSpacing: "0.15em" }}>ROUND {round + 1}</div>
          <div className="font-display" style={{ fontSize: "1.5rem" }}>{product.display_name}</div>
          <div className="price-tag mt-1" style={{ fontSize: "2rem", color: "var(--muted)" }}>{price}</div>
        </div>

        {/* AI working */}
        <div className="card p-6 mb-6 text-center" style={{ border: "1px solid var(--green)", background: "var(--green-dim)" }}>
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-3 h-3 rounded-full pulse" style={{ background: "var(--green)" }} />
            <div className="w-2 h-2 rounded-full pulse" style={{ background: "var(--green)", animationDelay: "0.3s" }} />
            <div className="w-3 h-3 rounded-full pulse" style={{ background: "var(--green)", animationDelay: "0.6s" }} />
          </div>
          <div className="font-label" style={{ color: "var(--green)", letterSpacing: "0.15em", fontSize: "1rem" }}>
            AI CHECKING THE MARKET
          </div>
          <div className="font-mono text-xs mt-2" style={{ color: "var(--muted)" }}>
            Searching live price data...
          </div>
        </div>

        {/* Anonymous vote bars */}
        <div className="card p-4 mb-4">
          <div className="font-label text-xs mb-3" style={{ color: "var(--muted)", letterSpacing: "0.12em" }}>
            VOTES CAST — {voted}/{total} PLAYERS
          </div>
          <div className="flex flex-col gap-3">
            {sorted.map(({ label, count }) => (
              <div key={label}>
                <div className="flex justify-between mb-1">
                  <div className="font-label text-sm" style={{ color: "var(--white)", letterSpacing: "0.1em" }}>OPTION {label}</div>
                  <div className="font-mono text-sm" style={{ color: "var(--muted)" }}>
                    {total > 0 ? Math.round((count / total) * 100) : 0}%
                  </div>
                </div>
                <div className="w-full h-1.5" style={{ background: "var(--border)", borderRadius: 1 }}>
                  <div
                    className="h-full"
                    style={{
                      width: total > 0 ? `${(count / total) * 100}%` : "0%",
                      background: "var(--white)",
                      borderRadius: 1,
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="font-mono text-xs mt-3" style={{ color: "var(--very-muted)" }}>
            Option labels hidden until AI reveals verdict
          </div>
        </div>

        {myVote && (
          <div className="text-center font-mono text-sm" style={{ color: "var(--muted)" }}>
            Your vote: <span style={{ color: "var(--white)" }}>{myVote.toUpperCase()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
