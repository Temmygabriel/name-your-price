"use client";
import type { Room } from "@/types";
import { makeAccount } from "@/lib/contract";

interface Props {
  room: Room;
  account: ReturnType<typeof makeAccount>;
  onPlayAgain: () => void;
}

export default function FinalResultsScreen({ room, account, onPlayAgain }: Props) {
  const myAddr = account.address;
  const humanPlayers = Object.values(room.players)
    .filter((p) => !p.is_bot)
    .sort((a, b) => b.score - a.score);

  const winner = humanPlayers[0];
  const isWinner = winner?.address === myAddr;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-md fade-up">
        <div className="text-center mb-8">
          <div className="font-label text-xs mb-2" style={{ color: "var(--amber)", letterSpacing: "0.2em" }}>GAME OVER</div>
          <h1 className="font-display mb-1" style={{ fontSize: "3rem" }}>
            {isWinner ? (
              <span style={{ color: "var(--green)" }}>You Won!</span>
            ) : (
              <span>{winner?.name} Wins!</span>
            )}
          </h1>
          <div className="font-mono text-sm" style={{ color: "var(--muted)" }}>
            {room.round_count} rounds · {humanPlayers.length} players
          </div>
        </div>

        <div className="card p-4 mb-6">
          <div className="font-label text-xs mb-4" style={{ color: "var(--muted)", letterSpacing: "0.12em" }}>FINAL STANDINGS</div>
          <div className="flex flex-col gap-2">
            {humanPlayers.map((p, i) => {
              const isMe = p.address === myAddr;
              const isFirst = i === 0;
              return (
                <div
                  key={p.address}
                  className="flex items-center justify-between py-3 px-4"
                  style={{
                    background: isFirst ? "var(--amber-dim)" : isMe ? "var(--green-dim)" : "var(--bg)",
                    borderRadius: 2,
                    border: isFirst ? "1px solid var(--amber)" : isMe ? "1px solid var(--green)" : "1px solid transparent",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="font-label text-lg" style={{ width: 28 }}>{medals[i] ?? `${i + 1}.`}</div>
                    <div>
                      <div className="font-mono text-sm">
                        {p.name}
                        {isMe && <span className="ml-2 font-label text-xs" style={{ color: "var(--muted)", letterSpacing: "0.08em" }}>YOU</span>}
                      </div>
                      <div className="font-mono text-xs" style={{ color: "var(--muted)" }}>
                        {p.rounds_correct}/{room.round_count} correct
                        {p.minority_wins > 0 && ` · ${p.minority_wins} minority ${p.minority_wins === 1 ? "win" : "wins"}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="price-tag text-2xl" style={{ color: isFirst ? "var(--amber)" : isMe ? "var(--green)" : "var(--white)" }}>
                      {p.score}
                    </div>
                    <div className="font-label text-xs" style={{ color: "var(--very-muted)", letterSpacing: "0.08em" }}>PTS</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-4 mb-6">
          <div className="font-label text-xs mb-3" style={{ color: "var(--very-muted)", letterSpacing: "0.12em" }}>SCORING</div>
          <div className="flex flex-col gap-1">
            {[
              ["Correct verdict", "+10 pts"],
              ["Early voter (first 20%)", "+3 pts"],
              ["Minority win (<40% correct)", "+7 pts"],
              ["Max per round", "20 pts"],
            ].map(([label, pts]) => (
              <div key={label} className="flex justify-between font-mono text-xs" style={{ color: "var(--muted)" }}>
                <span>{label}</span>
                <span style={{ color: "var(--white)" }}>{pts}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button className="btn btn-primary btn-full" onClick={onPlayAgain}>
            PLAY AGAIN
          </button>
        </div>
      </div>
    </div>
  );
}