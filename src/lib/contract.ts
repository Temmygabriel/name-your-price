import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import type { Room, PlayerStats, LeaderboardEntry } from "@/types";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const MAX_ATTEMPTS = 3;

function makeClient(account: ReturnType<typeof createAccount>) {
  const rpcUrl =
    typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:3000/api/rpc"
      : "https://studio.genlayer.com/api";
  return createClient({
    chain: {
      ...studionet,
      rpcUrls: {
        default: { http: [rpcUrl] },
      },
    },
    account,
  });
}

export function makeAccount(privateKey?: `0x${string}`) {
  return createAccount(privateKey);
}

// ── ACCOUNT MANAGEMENT ────────────────────────────────────────────────────────

export function getAccount(): ReturnType<typeof createAccount> {
  if (typeof window === "undefined") return createAccount();
  try {
    const stored = localStorage.getItem("nyp_pk");
    if (stored && stored.startsWith("0x") && stored.length === 66) {
      return createAccount(stored as `0x${string}`);
    }
  } catch {}
  const account = createAccount();
  try {
    localStorage.setItem("nyp_pk", account.privateKey);
  } catch {}
  return account;
}

export function getPlayerAddress(): string {
  return getAccount().address;
}

// ── WRITE ────────────────────────────────────────────────────────────────────

async function writeContract(
  account: ReturnType<typeof createAccount>,
  method: string,
  args: unknown[]
): Promise<void> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const client = makeClient(account);
      console.log(`writeContract attempt ${attempt}/${MAX_ATTEMPTS}: ${method}`);
      const hash = await client.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: method,
        args,
        account,
        leaderOnly: false,
      } as any);
      await client.waitForTransactionReceipt({
        hash,
        status: TransactionStatus.ACCEPTED,
        retries: 120,
        interval: 4000,
      });
      console.log(`writeContract success: ${method}`);
      return;
    } catch (err: any) {
      console.error(`${method} attempt ${attempt} failed:`, err?.message, err);
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, attempt * 3000));
        continue;
      }
      throw err;
    }
  }
}

async function writeContractWithReturn(
  account: ReturnType<typeof createAccount>,
  method: string,
  args: unknown[]
): Promise<string> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const client = makeClient(account);
      console.log(`writeContractWithReturn attempt ${attempt}/${MAX_ATTEMPTS}: ${method}`);
      const returnValue = await client.simulateWriteContract({
        address: CONTRACT_ADDRESS,
        functionName: method,
        args,
      });
      const hash = await client.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: method,
        args,
        account,
        leaderOnly: false,
      } as any);
      await client.waitForTransactionReceipt({
        hash,
        status: TransactionStatus.ACCEPTED,
        retries: 120,
        interval: 4000,
      });
      console.log(`writeContractWithReturn success: ${method}, returned:`, returnValue);
      return returnValue as string;
    } catch (err: any) {
      console.error(`${method} attempt ${attempt} failed:`, err?.message, err);
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, attempt * 3000));
        continue;
      }
      throw err;
    }
  }
  throw new Error("All attempts failed");
}

// ── READ ─────────────────────────────────────────────────────────────────────

async function readContract(method: string, args: unknown[]): Promise<string> {
  const account = createAccount();
  const client = makeClient(account);
  const result = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: method,
    args,
  });
  return result as string;
}

// ── CONTRACT METHODS ──────────────────────────────────────────────────────────

export async function createRoom(hostName: string, roundCount: number): Promise<string> {
  const account = getAccount();
  const code = await writeContractWithReturn(account, "create_room", [account.address, hostName, roundCount]);
  return code;
}

export async function createRoomDirect(
  hostName: string,
  roundCount: number,
  onCode: (code: string) => void
): Promise<void> {
  const code = await createRoom(hostName, roundCount);
  onCode(code);
}

export async function createSoloRoom(playerName: string, roundCount: number): Promise<string> {
  const account = getAccount();
  // simulateWriteContract captures the return value (room code) directly
  const code = await writeContractWithReturn(account, "create_solo_room", [account.address, playerName, roundCount]);
  return code;
}

export async function joinRoom(roomCode: string, playerName: string): Promise<void> {
  const account = getAccount();
  await writeContract(account, "join_room", [roomCode, account.address, playerName]);
}

export async function toggleReady(roomCode: string): Promise<void> {
  const account = getAccount();
  await writeContract(account, "toggle_ready", [roomCode, account.address]);
}

export async function startGame(roomCode: string): Promise<void> {
  const account = getAccount();
  await writeContract(account, "start_game", [roomCode, account.address]);
}

export async function submitVote(roomCode: string, vote: string): Promise<void> {
  const account = getAccount();
  await writeContract(account, "submit_vote", [roomCode, account.address, vote]);
}

export async function requestVerdict(roomCode: string): Promise<void> {
  const account = getAccount();
  await writeContract(account, "request_verdict", [roomCode]);
}

export async function advanceRound(roomCode: string): Promise<void> {
  const account = getAccount();
  await writeContract(account, "advance_round", [roomCode]);
}

// ── READ METHODS ──────────────────────────────────────────────────────────────

export async function getRoom(roomCode: string): Promise<Room> {
  const raw = await readContract("get_room", [roomCode]);
  const parsed = JSON.parse(raw);
  if (parsed.error) throw new Error(parsed.error);
  return parsed as Room;
}

export async function getPlayerStats(address?: string): Promise<PlayerStats> {
  const addr = address ?? getPlayerAddress();
  const raw = await readContract("get_player_stats", [addr]);
  return JSON.parse(raw) as PlayerStats;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const raw = await readContract("get_global_leaderboard", []);
  return JSON.parse(raw) as LeaderboardEntry[];
}

export async function getRecentGames(limit: number): Promise<Array<{ code: string; game_id: number; winner: string; player_count: number; round_count: number; status: string }>> {
  const raw = await readContract("get_recent_games", [limit]);
  return JSON.parse(raw);
}