import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import type { Room, PlayerStats, LeaderboardEntry } from "@/types";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const MAX_ATTEMPTS = 3;

function makeClient(account: ReturnType<typeof createAccount>) {
  return createClient({ chain: studionet, account });
}

export function makeAccount(privateKey?: `0x${string}`) {
  return createAccount(privateKey);
}

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
        args: args as any,
        account,
      } as any);
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

async function readContract(method: string, args: unknown[]): Promise<string> {
  const account = createAccount();
  const client = makeClient(account);
  const result = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: method,
    args: args as any,
  });
  return result as string;
}

export async function createRoom(
  account: ReturnType<typeof createAccount>,
  hostName: string,
  roundCount: number
): Promise<string> {
  return await writeContractWithReturn(account, "create_room", [account.address, hostName, roundCount]);
}

export async function createSoloRoom(
  account: ReturnType<typeof createAccount>,
  playerName: string,
  roundCount: number
): Promise<string> {
  return await writeContractWithReturn(account, "create_solo_room", [account.address, playerName, roundCount]);
}

export async function joinRoom(
  account: ReturnType<typeof createAccount>,
  roomCode: string,
  playerName: string
): Promise<void> {
  await writeContract(account, "join_room", [account.address, roomCode, playerName]);
}

export async function toggleReady(
  account: ReturnType<typeof createAccount>,
  roomCode: string
): Promise<void> {
  await writeContract(account, "toggle_ready", [account.address, roomCode]);
}

export async function startGame(
  account: ReturnType<typeof createAccount>,
  roomCode: string
): Promise<void> {
  await writeContract(account, "start_game", [account.address, roomCode]);
}

export async function submitVote(
  account: ReturnType<typeof createAccount>,
  roomCode: string,
  vote: string
): Promise<void> {
  await writeContract(account, "submit_vote", [account.address, roomCode, vote]);
}

export async function requestVerdict(
  account: ReturnType<typeof createAccount>,
  roomCode: string
): Promise<void> {
  await writeContract(account, "request_verdict", [roomCode]);
}

export async function advanceRound(
  account: ReturnType<typeof createAccount>,
  roomCode: string
): Promise<void> {
  await writeContract(account, "advance_round", [roomCode]);
}

export async function getRoom(roomCode: string): Promise<Room> {
  const raw = await readContract("get_room", [roomCode]);
  const parsed = JSON.parse(raw);
  if (parsed.error) throw new Error(parsed.error);
  return parsed as Room;
}

export async function getPlayerStats(address: string): Promise<PlayerStats> {
  const raw = await readContract("get_player_stats", [address]);
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