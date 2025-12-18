export interface Player {
  id: string;
  name: string;
  status: 'ACTIVE' | 'ELIMINATED' | 'WINNER';
  avatarUrl?: string; // Optional Habbo avatar URL construction
}

export interface Nominee {
  playerId: string;
  reason: string; // How they went to wall (Leader choice, House vote, Big Phone)
  voteCount?: number; // Optional vote count for house votes
  isReverseVote?: boolean; // If true, votes were to SAVE, not to eliminate
  isOpenVote?: boolean; // If the vote was public/open
  nominatedBy?: string; // ID of the player who nominated/pulled them (for Counter-coup or specific Leader indication tracking)
}

export interface OtherVote {
  playerId: string;
  count: number;
}

export interface RoundLog {
  roundNumber: number;
  challengeName: string; // "Qual prova eu fiz"
  leaderId: string | null;
  vetoedIds: string[]; // Players vetoed from the challenge
  immuneIds: string[];
  nominees: Nominee[];
  otherVotes: OtherVote[]; // Votes for players who did NOT go to the wall
  eliminatedIds: string[]; // Changed to array to support multiple eliminations
}

export enum GamePhase {
  SETUP = 'SETUP',
  PLAYING = 'PLAYING',
  FINAL = 'FINAL'
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  rounds: RoundLog[];
  currentRound: number;
}