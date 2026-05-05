// src/types.ts

export type Screen =
  | "landing"
  | "lobby"
  | "round_active"
  | "round_scoring_wait"
  | "round_reveal"
  | "final_results"
  | "rejoin"
  | "leaderboard";

export type Vote = "fair" | "overpriced" | "steal";

export type ContractStatus =
  | "lobby"
  | "round_active"
  | "round_scoring"
  | "round_reveal"
  | "completed";

export interface Product {
  id: number;
  category: string;
  display_name: string;
  description: string;
  context: string;
}

export interface Player {
  name: string;
  address: string;
  ready: boolean;
  score: number;
  rounds_correct: number;
  minority_wins: number;
  is_bot?: boolean;
}

export interface Verdict {
  verdict: Vote;
  market_price: string;
  reasoning: string;
  confidence: "high" | "medium" | "low";
  contested: boolean;
}

export interface Room {
  code: string;
  host: string;
  status: ContractStatus;
  round_count: number;
  current_round: number;
  players: Record<string, Player>;
  products: Product[];
  shown_prices: string[];
  votes: Record<string, Record<string, Vote>>;
  vote_order: Record<string, string[]>;
  round_scores: Record<string, Record<string, number>>;
  verdicts: Record<string, Verdict>;
  is_solo: boolean;
  game_id: number;
}

export interface PlayerStats {
  games_played: number;
  total_score: number;
  wins: number;
  rounds_correct: number;
  minority_wins: number;
  display_name: string;
  address: string;
}

export interface LeaderboardEntry {
  address: string;
  name: string;
  games_played: number;
  total_score: number;
  wins: number;
  avg_score: number;
  minority_wins: number;
}
