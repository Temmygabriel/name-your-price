"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import type { Room, Screen, LeaderboardEntry } from "@/types";
import {
  getPlayerAddress,
  getRoom,
  getLeaderboard,
  requestVerdict,
  advanceRound,
} from "@/lib/contract";

import LandingScreen from "@/components/LandingScreen";
import LobbyScreen from "@/components/LobbyScreen";
import RoundActiveScreen from "@/components/RoundActiveScreen";
import RoundScoringWaitScreen from "@/components/RoundScoringWaitScreen";
import RoundRevealScreen from "@/components/RoundRevealScreen";
import FinalResultsScreen from "@/components/FinalResultsScreen";
import { RejoinScreen, LeaderboardScreen } from "@/components/Screens";

const POLL_INTERVAL = 3000;

export default function HomePage() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [room, setRoom] = useState<Room | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const verdictRequestedRef = useRef(false);
  const advancingRoundRef = useRef(false);
  const allVotedAtRef = useRef(0);
  const revealStartRef = useRef(0);
  const prevRoundRef = useRef(-1);
  const pollingRef = useRef(false);
  const roomCodeRef = useRef("");

  roomCodeRef.current = roomCode;

  function resetRoundRefs() {
    verdictRequestedRef.current = false;
    advancingRoundRef.current = false;
    allVotedAtRef.current = 0;
    revealStartRef.current = 0;
  }

  const poll = useCallback(async () => {
    const code = roomCodeRef.current;
    if (!code || pollingRef.current) return;
    pollingRef.current = true;

    try {
      const data = await getRoom(code);
      if (!data) return;

      setRoom(data);

      const myAddr = getPlayerAddress();
      const isHost = data.host === myAddr;

      if (data.current_round !== prevRoundRef.current) {
        resetRoundRefs();
        prevRoundRef.current = data.current_round;
      }

      if (data.status === "lobby") {
        setScreen("lobby");
      }

      else if (data.status === "round_active") {
        const roundKey = String(data.current_round);
        const roundVotes = data.votes[roundKey] ?? {};
        const humanPids = Object.keys(data.players).filter((p) => !p.startsWith("bot_"));
        const allVoted = humanPids.every((p) => roundVotes[p]);
        const myVoted = !!roundVotes[myAddr];

        if (!myVoted) {
          setScreen("round_active");
        } else {
          setScreen("round_scoring_wait");
        }

        if (allVoted && !verdictRequestedRef.current) {
          if (allVotedAtRef.current === 0) allVotedAtRef.current = Date.now();
          const elapsed = Date.now() - allVotedAtRef.current;
          if (isHost || elapsed > 15_000) {
            verdictRequestedRef.current = true;
            try { await requestVerdict(code); } catch { verdictRequestedRef.current = false; }
          }
        }
      }

      else if (data.status === "round_scoring") {
        setScreen("round_scoring_wait");
      }

      else if (data.status === "round_reveal") {
        setScreen("round_reveal");
        if (revealStartRef.current === 0) revealStartRef.current = Date.now();

        if (!advancingRoundRef.current && Date.now() - revealStartRef.current > 12_000) {
          advancingRoundRef.current = true;
          try { await advanceRound(code); } catch { advancingRoundRef.current = false; }
        }
      }

      else if (data.status === "completed") {
        setScreen("final_results");
      }
    } catch {
    } finally {
      pollingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!roomCode) return;
    poll();
    const id = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [roomCode, poll]);

  function handleRoomReady(code: string, name: string) {
    setRoomCode(code);
    setPlayerName(name);
    prevRoundRef.current = -1;
    resetRoundRefs();
    setScreen("lobby");
  }

  function handleLeave() {
    setRoomCode("");
    setRoom(null);
    setScreen("landing");
    resetRoundRefs();
    prevRoundRef.current = -1;
  }

  async function handleLeaderboard() {
    setScreen("leaderboard");
    setLeaderboardLoading(true);
    try {
      const data = await getLeaderboard();
      setLeaderboard(data);
    } catch {
      setLeaderboard([]);
    } finally {
      setLeaderboardLoading(false);
    }
  }

  function handleRejoin() { setScreen("rejoin"); }

  function handleRejoinRoom(code: string) {
    setRoomCode(code);
    prevRoundRef.current = -1;
    resetRoundRefs();
  }

  if (screen === "landing") {
    return <LandingScreen onRoomReady={handleRoomReady} onLeaderboard={handleLeaderboard} onRejoin={handleRejoin} />;
  }

  if (screen === "rejoin") {
    return <RejoinScreen onRejoin={handleRejoinRoom} onBack={() => setScreen("landing")} />;
  }

  if (screen === "leaderboard") {
    return <LeaderboardScreen entries={leaderboard} loading={leaderboardLoading} onBack={() => setScreen("landing")} />;
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="text-center">
          <div className="w-3 h-3 rounded-full pulse mx-auto mb-4" style={{ background: "var(--green)" }} />
          <div className="font-mono text-sm" style={{ color: "var(--muted)" }}>Connecting to room...</div>
        </div>
      </div>
    );
  }

  if (screen === "lobby") {
    return <LobbyScreen room={room} roomCode={roomCode} playerName={playerName} onLeave={handleLeave} />;
  }

  if (screen === "round_active") {
    return <RoundActiveScreen room={room} roomCode={roomCode} onVoted={poll} />;
  }

  if (screen === "round_scoring_wait") {
    return <RoundScoringWaitScreen room={room} />;
  }

  if (screen === "round_reveal") {
    return <RoundRevealScreen room={room} roomCode={roomCode} />;
  }

  if (screen === "final_results") {
    return <FinalResultsScreen room={room} onPlayAgain={handleLeave} />;
  }

  return null;
}