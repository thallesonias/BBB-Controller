
import React, { useState, useMemo, useEffect } from 'react';
import { Player, RoundLog, Nominee, OtherVote } from '../types';
import { Button } from './Button';
import { Crown, Shield, Skull, ArrowRight, Save, Activity, CheckSquare, Square, Ban, ThumbsUp, ThumbsDown, Trophy, AlertTriangle, Dice5, Megaphone, Sword, ClipboardList, Plus, Minus, Gavel, LogOut, User, Sparkles, Clock, Info, Share, MousePointer2, Crosshair, Settings2, PlayCircle, BookOpen, Target } from 'lucide-react';

interface RoundManagerProps {
  roundNumber: number;
  players: Player[];
  onFinishRound: (log: RoundLog) => void;
  onEndGame: () => void;
  isCompact?: boolean;
  history: RoundLog[];
  startTime: number;
  targetDuration: number; // in minutes
}

// Full Game Database from CSV + Descriptions provided
interface GameData {
  id: number;
  name: string;
  type: string;
  min: number; // 0 if '-'
  max: number; // 999 if 'Livre'
  duration: string;
  obs: string;
  explanation?: string; // New field for automation text
  score?: number; // Internal use for sorting
}

const GAME_DATABASE: GameData[] = [
  { id: 1, name: "A Escolha", type: "Social / Sorte", min: 8, max: 18, duration: "2 - 3 min", obs: "", explanation: "Chegou a hora de A Escolha. Se for sorteado, você deve eliminar um brother secretamente clicando no piso verde dele ou nele. Quem sobrar, vence!" },
  { id: 2, name: "Balão", type: "Sorte", min: 8, max: 999, duration: "1,5 min", obs: "", explanation: "Prova do Balão! Escolham uma cor e pisem nela. Vou estourar um balão: se sair a sua cor, você perde. O último a sobrar vence!" },
  { id: 3, name: "Banzai", type: "Sorte", min: 0, max: 999, duration: "30s - 1 min", obs: "", explanation: "Hora de testar a sorte no Banzai! Entrem nos teleportes. Quem conseguir sentar na cadeira do outro lado vence a rodada!" },
  { id: 4, name: "Batata Quente", type: "Habilidade", min: 7, max: 999, duration: "Variável", obs: "Elimina 1 a cada 30s", explanation: "Batata Quente! Uma pessoa começa com o fogo. Passem para outro clicando nele! Não segurem por mais de 5s e não terminem a rodada com o fogo!" },
  { id: 5, name: "Cabo de Guerra", type: "Habilidade", min: 6, max: 999, duration: "30s", obs: "Por dupla ou indivíduo", explanation: "Cabo de Guerra! Pisem repetidamente no piso anel para puxar o objeto para o seu lado. Após 30s, quem tiver o objeto do seu lado vence!" },
  { id: 6, name: "Caixas", type: "Habilidade", min: 5, max: 11, duration: "30s", obs: "", explanation: "Empurrem as Caixas! O objetivo é levar a caixa até o piso anel. Quem encaixar primeiro ganha (o wired desempata se for junto)!" },
  { id: 7, name: "Céu ou Inferno", type: "Sorte", min: 6, max: 999, duration: "1 - 2 min", obs: "", explanation: "Céu ou Inferno? A sorte define seu destino. Sorteados para o Céu continuam, Inferno perde. Se todos perderem, eu refaço!" },
  { id: 8, name: "Chão é Lava", type: "Sorte", min: 8, max: 999, duration: "3 - 5 min", obs: "", explanation: "O Chão é Lava! O piso vai sumir aleatoriamente. Não fiquem parados onde não tem chão! No final, corram para o piso verde para vencer." },
  { id: 9, name: "Cliques", type: "Habilidade", min: 5, max: 7, duration: "1,5 min", obs: "", explanation: "Atenção na Prova dos Clicks! Vocês andarão para frente automaticamente. Cliquem rápido para voltar e evitem pisar no piso anel a todo custo!" },
  { id: 10, name: "Cruzamento", type: "Habilidade", min: 6, max: 999, duration: "3 min", obs: "Bom p/ muita gente", explanation: "Atenção ao Cruzamento! Vocês têm exatos 30 segundos para atravessar a arena e chegar ao lado oposto. Quem não conseguir, está fora!" },
  { id: 11, name: "Danger", type: "Habilidade", min: 0, max: 999, duration: "3,5 min", obs: "", explanation: "Cuidado, é Danger! Essas esferas não perseguem, mas mudam de direção ao bater. Quem for tocado por elas está eliminado!" },
  { id: 12, name: "Defenda o seu pufe", type: "Sorte", min: 6, max: 10, duration: "3 min", obs: "", explanation: "Defenda o seu Pufe! Fiquem longe do piso anel. As cadeiras andam sozinhas para frente. Dica: você pode roubar a cadeira do colega para se salvar!" },
  { id: 13, name: "Descubra a Senha", type: "Sorte / Conhec.", min: 8, max: 999, duration: "2 - 3 min", obs: "", explanation: "Vamos jogar Descubra a Senha! Tente adivinhar a resposta correta. O primeiro a acertar e sentar na cadeira vence!" },
  { id: 14, name: "Divertidamente", type: "Habilidade", min: 9, max: 999, duration: "5 min", obs: "Bom p/ muita gente", explanation: "Bem-vindos ao Divertidamente! É simples: o primeiro que pisar no piso anel vence a rodada!" },
  { id: 15, name: "Dodge Ball", type: "Habilidade", min: 4, max: 8, duration: "3 - 4 min", obs: "", explanation: "Hora do Dodge Ball! Dividam-se em dois times. Se o seu número for sorteado, corra para o centro! Quem sentar primeiro marca ponto para a equipe." },
  { id: 16, name: "Elefante Colorido", type: "Sorte", min: 0, max: 4, duration: "4 - 5 min", obs: "", explanation: "O jogo é individual. Abra todas as portas o mais rápido possível. O melhor tempo vence!" },
  { id: 17, name: "Elefante Colorido (Esferas)", type: "Habilidade", min: 7, max: 999, duration: "3 - 4 min", obs: "Bom p/ muita gente", explanation: "Fujam das esferas (2 a cada 30s) e corram para a cor sorteada. Quem não estiver na cor, perde!" },
  { id: 18, name: "Fuja", type: "Habilidade", min: 0, max: 999, duration: "3 min", obs: "Bom p/ muita gente", explanation: "Bem-vindos ao Fuja! O objetivo é simples: desviem das esferas que nascem no centro. A cada 30 segundos, 3 novas esferas entram em jogo. Sobrevivam!" },
  { id: 19, name: "Fuja das Cores", type: "Habilidade", min: 5, max: 6, duration: "5 min", obs: "", explanation: "Fuja das Cores! Vejam a cor do piso no meio e puxem a alavanca igual. Isso zera o tempo e adiciona uma esfera. Quem sobreviver mais tempo ganha!" },
  { id: 20, name: "Fuja em Duplas", type: "Habilidade", min: 8, max: 8, duration: "4 - 5 min", obs: "Apenas 8 pessoas", explanation: "Fuja em Duplas! O objetivo é puxar as alavancas dos adversários. Quem acionar todas ganha. Atenção: as portas têm anti-aus de 10s!" },
  { id: 21, name: "Fujamento", type: "Habilidade", min: 6, max: 999, duration: "4 min", obs: "Bom p/ muita gente", explanation: "Preparem-se para o Fujamento! O desafio é atravessar para o lado oposto em 50 segundos, mas desviando dos obstáculos. Boa sorte!" },
  { id: 22, name: "Fujoller", type: "Habilidade", min: 5, max: 14, duration: "1,5 min", obs: "", explanation: "Bem-vindos ao Fujoller! Sobrevivam nos rollers enquanto esferas surgem nas pontas a cada 30s. Cuidado: os mármores atrás dos rollers são fatais!" },
  { id: 23, name: "Ilhados", type: "Sorte", min: 5, max: 8, duration: "2,5 - 3,5 min", obs: "", explanation: "Vocês estão Ilhados! Sortearei alguém para andar X pisos. Cuidado: quem pisar fora do mármore perde" },
  { id: 24, name: "Ir até cor", type: "Sorte", min: 10, max: 999, duration: "2 - 3 min", obs: "", explanation: "Atenção: Ir até a Cor! Vou sortear uma cor e vocês têm poucos segundos para subir nela. Quem não estiver na cor certa, perde!" },
  { id: 25, name: "Leilão", type: "Habilidade / Sorte", min: 7, max: 11, duration: "2 - 3 min", obs: "", explanation: "Vocês são ladrões no banco! A cada rodada, terão 15s para escolher quantas barras de ouro roubar. Quem pegar MAIS barras na rodada fica pesado e a polícia pega (perde). Se empatar, o wired sorteia quem sai. Quem não for pego, acumula as barras no placar. No final, vence quem tiver mais ouro!" },
  { id: 26, name: "Massacre", type: "Habilidade", min: 0, max: 999, duration: "2,5 min", obs: "Bom p/ muita gente", explanation: "Hora do Massacre! Fujam das esferas que surgem no centro. A arena vai encher rápido: mais 2 esferas a cada 30 segundos!" },
  { id: 27, name: "Nervosos", type: "Habilidade / Social", min: 8, max: 999, duration: "2,5 - 3,5 min", obs: "", explanation: "Nervosos! O meio muda de cor. Só andem no VERDE. Se sentar no meio, elimina um. Quem andar fora do verde congela!" },
  { id: 28, name: "Pacman", type: "-", min: 6, max: 8, duration: "4 - 5 min", obs: "Sempre nº par", explanation: "Hora do Pacman! Corram pela arena e coletem os pisos. Quem tiver coletado mais pisos que o adversário no final vence!" },
  { id: 29, name: "Pegue a Lebre", type: "Habilidade", min: 7, max: 999, duration: "Variável", obs: "Elimina 1 a cada 30s", explanation: "" },
  { id: 30, name: "Pegue o Drink", type: "Habilidade", min: 6, max: 999, duration: "4 min", obs: "Bom p/ muita gente", explanation: "Pegue o Drink! Corram até o outro lado, peguem a bebida e voltem para o início em menos de 50 segundos" },
  { id: 31, name: "Queimada", type: "Habilidade", min: 8, max: 999, duration: "3 - 4 min", obs: "", explanation: "" },
  { id: 32, name: "Resta 1", type: "Habilidade", min: 4, max: 999, duration: "2,5 - 3,5 min", obs: "", explanation: "O clássico Resta 1! Sobrevivam na arena sem pisar no fogo. O último a ficar de pé vence a prova." },
  { id: 33, name: "Sobrevivência", type: "Habilidade", min: 7, max: 999, duration: "1 min", obs: "", explanation: "Prova de Sobrevivência! Aguentem 1 minuto. Pisem apenas quando estiver VERDE (Vermelho congela 1s). Ao final do tempo, sentem para vencer!" },
  { id: 34, name: "Subir nas Portas", type: "Habilidade", min: 8, max: 16, duration: "1 - 2 min", obs: "Sempre nº par", explanation: "Subir nas Portas! Formem grupos. Abrirei uma porta aleatória na frente de cada grupo. Quem subir continua, quem ficar no chão dá tchau!" },
  { id: 35, name: "Tiro ao Alvo", type: "Sorte", min: 8, max: 999, duration: "1 - 2 min", obs: "", explanation: "Tiro ao Alvo! O objetivo é chegar o mais próximo possível do piso verde. Quem ficar longe do alvo será eliminado!" },
  { id: 36, name: "Velocidade é Tudo", type: "Habilidade / Social", min: 8, max: 999, duration: "3,5 - 4,5 min", obs: "", explanation: "Lembrem-se: Velocidade é Tudo! Quem sentar no Pufe Vermelho elimina 2 brothers. Quem pegar o Verde ganha imunidade na rodada!" },
  { id: 37, name: "Verdadeiro ou Falso", type: "Conhecimento", min: 10, max: 999, duration: "5 - 6 min", obs: "", explanation: "Verdadeiro ou Falso? Vou fazer uma afirmação. Corram para o lado que acham ser a resposta correta. Quem errar, perde!" },
  { id: 0, name: "Nenhuma Prova", type: "-", min: 0, max: 999, duration: "-", obs: "Apenas votação", explanation: "" },
].sort((a, b) => a.name.localeCompare(b.name));

export const RoundManager: React.FC<RoundManagerProps> = ({ 
  roundNumber, 
  players, 
  onFinishRound,
  onEndGame,
  isCompact = false,
  history,
  startTime,
  targetDuration
}) => {
  // Sort alphabeticaly: symbols/numbers first, then letters.
  const activePlayers = useMemo(() => {
    return players
      .filter(p => p.status === 'ACTIVE')
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  }, [players]);
  
  // Form State
  const [challengeName, setChallengeName] = useState('');
  // Multiple Leaders State
  const [leaderIds, setLeaderIds] = useState<string[]>([]);
  const [vetoedIds, setVetoedIds] = useState<string[]>([]);
  const [immuneIds, setImmuneIds] = useState<string[]>([]);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  
  // Nominee Form State - Default: Indicação do Líder
  const [currentNomineeId, setCurrentNomineeId] = useState('');
  const [currentNomineeReason, setCurrentNomineeReason] = useState('Indicação do Líder');
  const [currentVoteCount, setCurrentVoteCount] = useState<number | ''>('');
  const [currentNominatedBy, setCurrentNominatedBy] = useState<string>('');
  const [isReverseVote, setIsReverseVote] = useState(false);
  const [isOpenVote, setIsOpenVote] = useState(false);

  // Automation Settings State
  const [clickCoords, setClickCoords] = useState({ x: 500, y: 500 });
  const [showCoordsSettings, setShowCoordsSettings] = useState(false);
  const [isAutomating, setIsAutomating] = useState(false);
  const [captureCountdown, setCaptureCountdown] = useState<number | null>(null);

  // Suggestions State
  const [suggestions, setSuggestions] = useState<GameData[]>([]);

  // Compact Mode Specific State
  const [compactVoteTarget, setCompactVoteTarget] = useState('');

  // Other Votes State
  const [otherVotes, setOtherVotes] = useState<OtherVote[]>([]);
  const [eliminatedIds, setEliminatedIds] = useState<string[]>([]);

  // Load Coords on mount
  useEffect(() => {
    const saved = localStorage.getItem('habbo_bbb_click_coords');
    if (saved) {
      try {
        setClickCoords(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveCoords = (newCoords: {x: number, y: number}) => {
    setClickCoords(newCoords);
    localStorage.setItem('habbo_bbb_click_coords', JSON.stringify(newCoords));
  };

  const handleCaptureCoords = async () => {
    setCaptureCountdown(3);
    const interval = setInterval(() => {
      setCaptureCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    try {
      const response = await fetch('http://localhost:5000/capture-position', { method: 'POST' });
      const data = await response.json();
      
      clearInterval(interval);
      setCaptureCountdown(null);

      if (data.status === 'success') {
        saveCoords({ x: data.x, y: data.y });
        // Beep or visual feedback
      } else {
        alert("Erro na captura: " + data.message);
      }
    } catch (e) {
      clearInterval(interval);
      setCaptureCountdown(null);
      alert("Erro ao conectar com servidor Python");
    }
  };

  // Helpers
  const isLeader = (id: string) => leaderIds.includes(id);
  const isImmune = (id: string) => immuneIds.includes(id);
  const isVetoed = (id: string) => vetoedIds.includes(id);
  const isNominated = (id: string) => nominees.some(n => n.playerId === id);
  const isEliminated = (id: string) => eliminatedIds.includes(id);

  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || '';
  const getChallengeUsageCount = (name: string) => history.filter(h => h.challengeName === name).length;

  // Usage count for current selection
  const currentChallengeCount = useMemo(() => getChallengeUsageCount(challengeName), [challengeName, history]);

  // Selected Challenge Details
  const selectedChallengeData = useMemo(() => GAME_DATABASE.find(g => g.name === challengeName), [challengeName]);

  const toggleLeader = (id: string) => {
    setLeaderIds(prev => {
      // If adding leader, remove from immune/veto just to be clean, though logic handles it
      if (prev.includes(id)) return prev.filter(l => l !== id);
      return [...prev, id];
    });
    // Remove from Immune list if they become leader (redundant but safe)
    setImmuneIds(prev => prev.filter(i => i !== id));
  };

  // Duration Parsing Helper
  const parseDuration = (durationStr: string): number => {
    if (!durationStr || durationStr === '-' || durationStr === 'Variável') return 4; // Default average
    
    // Convert comma to dot
    let clean = durationStr.replace(',', '.').toLowerCase();
    
    if (clean.includes('30s')) return 0.5;
    
    // Extract numbers
    const matches = clean.match(/[\d\.]+/g);
    if (!matches) return 5;
    
    if (matches.length === 2) {
      // Range: "2 - 3 min" -> 2.5
      return (parseFloat(matches[0]) + parseFloat(matches[1])) / 2;
    }
    return parseFloat(matches[0]);
  };

  // Generate Suggestions
  useEffect(() => {
    if (activePlayers.length > 0) {
      refreshSuggestions();
    }
  }, [activePlayers.length, history.length, startTime, targetDuration]); 

  const refreshSuggestions = () => {
    const count = activePlayers.length;
    const now = Date.now();
    const elapsedTimeMinutes = (now - startTime) / 1000 / 60;
    const remainingTime = Math.max(0, targetDuration - elapsedTimeMinutes);

    // 1. Valid Games Filter (Player Count)
    const validGames = GAME_DATABASE.filter(game => {
       if (game.name === "Nenhuma Prova") return false;
       return count >= game.min && (game.max === 999 || count <= game.max);
    });

    // 2. Score Games (Focus on Usage + Time, Type handled separately)
    const scoredGames = validGames.map(game => {
       let score = 0;
       const avgDuration = parseDuration(game.duration);
       
       // Major Penalty for usage (force variety)
       const usage = getChallengeUsageCount(game.name);
       score -= (usage * 1000);

       // Time Adaptation
       if (remainingTime < 15) {
          if (avgDuration > 5) score -= 500; 
          if (avgDuration <= 3) score += 50;
       }

       // Randomness for rotation
       score += Math.random() * 10;
       
       return { ...game, score };
    });

    // 3. Bucket Sort: Skill, Luck, Others
    const skillGames = scoredGames.filter(g => g.type.toLowerCase().includes('habilidade'));
    const luckGames = scoredGames.filter(g => g.type.toLowerCase().includes('sorte') && !g.type.toLowerCase().includes('habilidade'));
    const otherGames = scoredGames.filter(g => !g.type.toLowerCase().includes('habilidade') && !g.type.toLowerCase().includes('sorte'));
    // Include mixed games in 'others' bucket fallback if needed or create specific buckets

    // Sort buckets
    const byScore = (a: GameData, b: GameData) => (b.score || 0) - (a.score || 0);
    skillGames.sort(byScore);
    luckGames.sort(byScore);
    otherGames.sort(byScore);

    // 4. Selection: 1 Skill, 1 Luck, 1 Other/Mixed
    const finalSuggestions: GameData[] = [];

    // Add best Skill
    if (skillGames.length > 0) finalSuggestions.push(skillGames[0]);
    
    // Add best Luck
    if (luckGames.length > 0) finalSuggestions.push(luckGames[0]);

    // Add best Other (or 2nd best Skill/Luck if no Other available)
    if (otherGames.length > 0) {
        finalSuggestions.push(otherGames[0]);
    } else if (skillGames.length > 1) {
        finalSuggestions.push(skillGames[1]);
    } else if (luckGames.length > 1) {
        finalSuggestions.push(luckGames[1]);
    }

    setSuggestions(finalSuggestions);
  };

  // Centralized Workflow Logic
  const getNextWorkflowStep = (currentReason: string, justAddedId: string) => {
    if (currentReason === 'Indicação do Líder') return { reason: 'Contra-golpe', nominatedBy: justAddedId };
    if (currentReason === 'Contra-golpe') return { reason: 'Voto da Casa', nominatedBy: '' };
    if (currentReason === 'Voto da Casa') return { reason: 'Sorteio', nominatedBy: '' };
    if (currentReason === 'Voto da Casa (Desempate)') return { reason: 'Sorteio', nominatedBy: '' };
    if (currentReason === 'Perdeu na Prova') return { reason: 'Sorteio', nominatedBy: '' };
    return { reason: currentReason, nominatedBy: '' };
  };

  const handleAddNominee = () => {
    if (currentNomineeId && !isNominated(currentNomineeId)) {
      const nominee: Nominee = { 
        playerId: currentNomineeId, 
        reason: currentNomineeReason,
        isReverseVote: isReverseVote,
        isOpenVote: isOpenVote
      };

      if (currentVoteCount !== '') {
        nominee.voteCount = Number(currentVoteCount);
      }

      if (currentNomineeReason === 'Contra-golpe' && currentNominatedBy) {
        nominee.nominatedBy = currentNominatedBy;
      }

      setNominees([...nominees, nominee]);
      
      // Remove from other votes if they were added there previously
      setOtherVotes(prev => prev.filter(ov => ov.playerId !== currentNomineeId));

      // --- SMART WORKFLOW UPDATE ---
      const { reason, nominatedBy } = getNextWorkflowStep(currentNomineeReason, currentNomineeId);

      // Reset fields with new smart values
      setCurrentNomineeId('');
      setCurrentNomineeReason(reason);
      setCurrentNominatedBy(nominatedBy);
      setCurrentVoteCount('');
      setIsReverseVote(false);
      setIsOpenVote(false);
    }
  };

  const updateOtherVote = (playerId: string, delta: number) => {
    setOtherVotes(prev => {
      const existing = prev.find(ov => ov.playerId === playerId);
      const currentCount = existing ? existing.count : 0;
      const newCount = Math.max(0, currentCount + delta);
      
      if (newCount === 0) return prev.filter(ov => ov.playerId !== playerId);
      if (existing) return prev.map(ov => ov.playerId === playerId ? { ...ov, count: newCount } : ov);
      return [...prev, { playerId, count: newCount }];
    });
  };

  // Compact Mode Quick Click Helper
  const handleQuickVote = (playerId: string) => {
    if (compactVoteTarget !== playerId) {
      // First click: Select only
      setCompactVoteTarget(playerId);
    } else {
      // Second click (while selected): Add vote
      updateOtherVote(playerId, 1);
    }
  };

  const getVoteCount = (playerId: string) => otherVotes.find(ov => ov.playerId === playerId)?.count || 0;

  // New function: Send House Vote Directly
  const sendHouseVoteToWall = (playerId: string, count: number) => {
    setOtherVotes(prev => prev.filter(ov => ov.playerId !== playerId));
    
    // Clear selection if using compact mode
    if (compactVoteTarget === playerId) setCompactVoteTarget('');

    const nominee: Nominee = { 
        playerId: playerId, 
        reason: 'Voto da Casa',
        voteCount: count,
        isReverseVote: false,
        isOpenVote: false
    };
    setNominees([...nominees, nominee]);

    // Update Workflow (Moves to Sorteio)
    const { reason, nominatedBy } = getNextWorkflowStep('Voto da Casa', playerId);
    setCurrentNomineeReason(reason);
    setCurrentNominatedBy(nominatedBy);
    setCurrentNomineeId(''); // Clear Main Selector
    setCurrentVoteCount('');
  };

  // Updated function: Send Tie Breaker
  const sendTieBreakerToWall = (playerId: string, count: number) => {
    setOtherVotes(prev => prev.filter(ov => ov.playerId !== playerId));
    
    // Clear selection if using compact mode
    if (compactVoteTarget === playerId) setCompactVoteTarget('');

    const nominee: Nominee = { 
        playerId: playerId, 
        reason: 'Voto da Casa (Desempate)',
        voteCount: count,
        isReverseVote: false,
        isOpenVote: false
    };
    setNominees([...nominees, nominee]);

    // Update Workflow (Moves to Sorteio)
    const { reason, nominatedBy } = getNextWorkflowStep('Voto da Casa (Desempate)', playerId);
    setCurrentNomineeReason(reason);
    setCurrentNominatedBy(nominatedBy);
    setCurrentNomineeId(''); // Clear Main Selector
    setCurrentVoteCount('');
  };

  // --- AUTOMATION FEATURE: EXPLAIN CHALLENGE ---
  const explainChallengeToHabbo = async () => {
    if (!selectedChallengeData || !selectedChallengeData.explanation) {
      alert("Esta prova não tem uma explicação cadastrada.");
      return;
    }

    setIsAutomating(true);
    try {
      const response = await fetch('http://localhost:5000/type-long-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: selectedChallengeData.explanation,
          coords: clickCoords
        }),
      });

      if (!response.ok) throw new Error('Falha na automação');
      console.log("Explicação enviada");
    } catch (err) {
      console.error(err);
      navigator.clipboard.writeText(selectedChallengeData.explanation);
      alert("Copiado para a área de transferência (Servidor Python não respondeu).");
    } finally {
      setIsAutomating(false);
    }
  };

  // --- AUTOMATION FEATURE (PYTHON SERVER) ---
  const announceVotesToHabbo = async () => {
    // 1. Collect Other Votes (Not on Wall)
    const votesData = otherVotes.map(ov => ({
        name: getPlayerName(ov.playerId),
        count: ov.count
    }));

    // 2. Collect House Nominees (On Wall)
    nominees.forEach(nom => {
        if ((nom.reason === 'Voto da Casa' || nom.reason === 'Voto da Casa (Desempate)') && nom.voteCount) {
            votesData.push({
                name: getPlayerName(nom.playerId),
                count: nom.voteCount
            });
        }
    });

    // 3. Sort Ascending (Least votes to Most votes)
    votesData.sort((a, b) => a.count - b.count);

    if (votesData.length === 0) {
        alert("Nenhum voto registrado para anunciar.");
        return;
    }

    // 4. Format Strings (Intro + Singular/Plural Logic)
    const linesToType = ["Contagem de votos:"]; // Header phrase
    
    votesData.forEach(v => {
      const label = v.count === 1 ? 'voto' : 'votos';
      linesToType.push(`${v.name}: ${v.count} ${label}`);
    });

    // 5. Trigger Python Automation Server
    setIsAutomating(true);
    try {
      const response = await fetch('http://localhost:5000/automate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lines: linesToType, // Sending pre-formatted lines
          coords: clickCoords
        }),
      });

      if (!response.ok) {
        throw new Error('Falha na conexão com o servidor de automação');
      }
      
      console.log("Comando enviado para o servidor Python");
    } catch (err) {
      console.error("Erro na automação:", err);
      
      // Fallback: Copy to clipboard
      const text = linesToType.join('\n');
      navigator.clipboard.writeText(text);
      alert("⚠️ Servidor Python não detectado (execute 'python automation_server.py').\n\nLista copiada para a área de transferência!");
    } finally {
      setIsAutomating(false);
    }
  };

  const removeNominee = (id: string) => {
    setNominees(nominees.filter(n => n.playerId !== id));
    setEliminatedIds(prev => prev.filter(eId => eId !== id));
  };

  const toggleEliminated = (id: string) => {
    setEliminatedIds(prev => prev.includes(id) ? prev.filter(eId => eId !== id) : [...prev, id]);
  };

  const handleSubmit = () => {
    if (!challengeName || eliminatedIds.length === 0) return;
    const roundLog: RoundLog = { roundNumber, challengeName, leaderIds: leaderIds, vetoedIds, immuneIds, nominees, otherVotes, eliminatedIds };
    onFinishRound(roundLog);
    
    // Reset
    setChallengeName(''); 
    setLeaderIds([]); 
    setVetoedIds([]); 
    setImmuneIds([]); 
    setNominees([]); 
    setOtherVotes([]); 
    setEliminatedIds([]);
    setCompactVoteTarget('');
    
    // Reset to start of workflow
    setCurrentNomineeReason('Indicação do Líder');
    setCurrentNominatedBy('');
    refreshSuggestions();
  };

  // Compact Styles Overrides
  const panelClass = isCompact 
    ? "glass-panel p-2 rounded-lg space-y-2" 
    : "glass-panel p-5 rounded-2xl space-y-5";
    
  const selectClass = isCompact
    ? "w-full bg-slate-950/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none"
    : "w-full bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all custom-select";
  
  const inputClass = isCompact
    ? "w-full bg-slate-950/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 outline-none"
    : "w-full bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-slate-600";

  if (activePlayers.length <= 3) {
     return (
       <div className="text-center space-y-4 py-8 glass-panel rounded-2xl animate-fade-in">
         <Trophy className="w-12 h-12 text-yellow-400 mx-auto" />
         <h2 className="text-2xl font-bold text-white">Reta Final!</h2>
         <Button onClick={onEndGame} className="mx-auto"><Crown className="w-4 h-4" /> Ir para Grande Final</Button>
       </div>
     );
  }

  // Filter eligible voters for dropdown (Full & Compact)
  const eligibleVoters = activePlayers.filter(p => !isNominated(p.id) && !isLeader(p.id));

  return (
    <div className={`space-y-3 animate-slide-up ${isCompact ? 'pb-10' : 'pb-20'}`}>
      
      {/* Title only in full mode, in compact mode it's in header */}
      {!isCompact && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">{roundNumber}</span>
            <span className="font-display tracking-tight">Gerenciar Rodada</span>
          </h2>
          <div className="glass-card px-3 py-1 rounded-full text-xs font-medium text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> {activePlayers.length} Jogadores
          </div>
        </div>
      )}

      {/* COMPACT LAYOUT: Stack Everything tightly */}
      <div className={`grid gap-3 ${isCompact ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
        
        {/* 1. Challenge */}
        <div className={panelClass}>
           {!isCompact && (
              <div className="flex items-center justify-between text-indigo-300 border-b border-white/5 pb-2 mb-2">
                <div className="flex items-center gap-2">
                   <Activity className="w-4 h-4" /> <h3 className="font-semibold text-sm uppercase">A Prova</h3>
                </div>
                <button onClick={refreshSuggestions} className="text-xs text-indigo-400 hover:text-indigo-200 flex items-center gap-1">
                   <Dice5 className="w-3 h-3" /> Sugerir
                </button>
              </div>
            )}
            
            {/* AI Suggestions Block */}
            {suggestions.length > 0 && (
              <div className="mb-3 grid grid-cols-3 gap-2">
                 {suggestions.map(s => (
                   <div 
                     key={s.id} 
                     onClick={() => setChallengeName(s.name)}
                     className={`cursor-pointer rounded border p-1.5 flex flex-col justify-between h-full transition-all hover:scale-105 active:scale-95 ${challengeName === s.name ? 'bg-indigo-600 border-indigo-400 ring-2 ring-indigo-500/50' : 'bg-slate-900/60 border-slate-700 hover:border-indigo-500/50'}`}
                   >
                     <span className="text-[10px] font-bold text-white leading-tight mb-1 line-clamp-2">{s.name}</span>
                     <div className="flex items-center gap-1 text-[9px] text-slate-400">
                        {s.type.toLowerCase().includes('habilidade') && <span className="text-orange-400">Hab</span>}
                        {s.type.toLowerCase().includes('sorte') && <span className="text-green-400">Sor</span>}
                        {!s.type.toLowerCase().includes('habilidade') && !s.type.toLowerCase().includes('sorte') && <span className="text-blue-400">Mix</span>}
                        <span className="opacity-50">•</span>
                        <Clock className="w-2.5 h-2.5" /> {s.duration.replace('min', 'm')}
                     </div>
                   </div>
                 ))}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex gap-2">
                 <select value={challengeName} onChange={e => setChallengeName(e.target.value)} className={`${selectClass} ${currentChallengeCount > 0 ? 'border-yellow-500 text-yellow-200 font-bold' : ''}`}>
                    <option value="">Selecione a Prova...</option>
                    {GAME_DATABASE.map(c => {
                    const count = getChallengeUsageCount(c.name);
                    return (
                        <option key={c.id} value={c.name} className={count > 0 ? "font-bold text-yellow-500 bg-slate-900" : ""}>
                        {count > 0 ? `⚠️ (${count}x) ${c.name}` : `${c.name}`}
                        </option>
                    );
                    })}
                </select>
                {/* Explain Challenge Button */}
                <button 
                  onClick={explainChallengeToHabbo}
                  disabled={!selectedChallengeData?.explanation || isAutomating}
                  className={`px-3 rounded border flex items-center justify-center transition-colors ${
                      isAutomating 
                        ? 'bg-yellow-500/20 border-yellow-500 text-yellow-200 cursor-wait' 
                        : 'bg-indigo-500/20 border-indigo-500 text-indigo-300 hover:bg-indigo-500 hover:text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={selectedChallengeData?.explanation ? "Explicar Prova (Digitar no Habbo)" : "Sem explicação cadastrada"}
                >
                  <BookOpen className="w-4 h-4" />
                </button>
              </div>
              
              {/* Selected Challenge Details */}
              {selectedChallengeData && selectedChallengeData.name !== "Nenhuma Prova" && selectedChallengeData.obs && (
                 <div className="bg-slate-900/40 rounded-lg p-2 text-xs space-y-1 border border-white/5 animate-fade-in">
                    <div className="flex justify-between">
                       <span className="text-slate-400">Tipo: <span className="text-indigo-300">{selectedChallengeData.type}</span></span>
                       <span className="text-slate-400">Jogadores: <span className="text-white">{selectedChallengeData.min === 0 ? 'Livre' : selectedChallengeData.min} a {selectedChallengeData.max === 999 ? 'Livre' : selectedChallengeData.max}</span></span>
                    </div>
                    {/* Only show Obs if it exists */}
                    {selectedChallengeData.obs && (
                       <div className="flex gap-1 text-orange-300/80 italic">
                          <Info className="w-3 h-3 mt-0.5 shrink-0" /> {selectedChallengeData.obs}
                       </div>
                    )}
                 </div>
              )}
              
              {/* Very visible alert badge if the selected challenge was used before */}
              {currentChallengeCount > 0 && (
                <div className="animate-pulse bg-red-500/20 border border-red-500/50 rounded px-2 py-1.5 flex items-center justify-center gap-2 text-red-200 font-bold text-xs uppercase shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Atenção: Prova já realizada {currentChallengeCount}x!
                </div>
              )}
            </div>
        </div>

        {/* 2. Leaders (Now Multi-Select) */}
        <div className={panelClass}>
            {!isCompact && (
               <div className="flex items-center gap-2 text-yellow-300 border-b border-white/5 pb-2 mb-2">
                 <Crown className="w-4 h-4" /> <h3 className="font-semibold text-sm uppercase">Líder(es)</h3>
               </div>
             )}
             {/* Multi-select leader interface */}
             <div className="flex flex-wrap gap-2">
               {activePlayers.map(p => (
                 <button 
                    key={p.id} 
                    onClick={() => toggleLeader(p.id)}
                    className={`text-xs px-2 py-1 rounded border flex items-center gap-1 ${
                      isLeader(p.id) 
                        ? 'bg-yellow-500/20 border-yellow-500 text-yellow-200' 
                        : 'bg-slate-800/50 border-transparent text-slate-400'
                    }`}
                 >
                   {isLeader(p.id) && <Crown className="w-3 h-3" />}
                   {p.name}
                 </button>
               ))}
             </div>
        </div>

        {/* 3. Immunes/Vetoes */}
        {!isCompact && (
          <div className={`${panelClass} md:col-span-2`}>
             <div className="space-y-2">
                <label className="text-xs text-slate-500 block">Vetados / Imunes (Clique para selecionar)</label>
                <div className="flex flex-wrap gap-2">
                  {activePlayers.map(p => (
                    <button key={p.id} onClick={() => setVetoedIds(prev => prev.includes(p.id) ? prev.filter(i => i!==p.id) : [...prev, p.id])} className={`text-xs px-2 py-1 rounded border ${isVetoed(p.id) ? 'bg-red-500/20 border-red-500' : 'bg-slate-800/50 border-transparent'}`}>{p.name} (V)</button>
                  ))}
                  <div className="w-[1px] bg-white/10 mx-1"></div>
                  {activePlayers.filter(p => !isLeader(p.id)).map(p => (
                    <button key={p.id} onClick={() => setImmuneIds(prev => prev.includes(p.id) ? prev.filter(i => i!==p.id) : [...prev, p.id])} className={`text-xs px-2 py-1 rounded border ${isImmune(p.id) ? 'bg-yellow-500/20 border-yellow-500 text-yellow-200' : 'bg-slate-800/50 border-transparent'}`}>{p.name} (I)</button>
                  ))}
                </div>
             </div>
          </div>
        )}

        {/* 4. The Wall */}
        <div className={`${panelClass} md:col-span-2 relative overflow-hidden`}>
          {!isCompact && (
            <div className="flex items-center gap-2 text-red-400 border-b border-white/5 pb-2 relative z-10 mb-2">
              <AlertTriangle className="w-4 h-4" /> <h3 className="font-semibold text-sm uppercase">Paredão</h3>
            </div>
          )}

          <div className={`grid gap-2 relative z-10 ${isCompact ? 'grid-cols-1' : 'md:grid-cols-12'}`}>
             <div className={isCompact ? 'col-span-1' : 'md:col-span-5'}>
               <div className={`bg-slate-900/40 rounded-xl border border-white/5 ${isCompact ? 'p-2 space-y-1.5' : 'p-4 space-y-3'}`}>
                 <div className="flex gap-2">
                   <select value={currentNomineeId} onChange={e => setCurrentNomineeId(e.target.value)} className={selectClass}>
                      <option value="">Emparedado...</option>
                      {activePlayers.filter(p => !isLeader(p.id) && !isImmune(p.id) && !isNominated(p.id)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    {/* Reason next to name in compact */}
                    {isCompact && (
                      <select value={currentNomineeReason} onChange={e => setCurrentNomineeReason(e.target.value)} className={selectClass}>
                        <option value="Indicação do Líder">Líder</option>
                        <option value="Contra-golpe">Contra</option>
                        <option value="Voto da Casa">Casa</option>
                        <option value="Sorteio">Sorteio</option>
                        <option value="Big Fone">Fone</option>
                        <option value="Perdeu na Prova">Perdeu na Prova</option>
                        <option value="Voto da Casa (Desempate)">Desempate</option>
                      </select>
                    )}
                 </div>

                  {!isCompact && (
                    <select value={currentNomineeReason} onChange={e => setCurrentNomineeReason(e.target.value)} className={selectClass}>
                      <option value="Indicação do Líder">Indicação do Líder</option>
                      <option value="Contra-golpe">Contra-golpe</option>
                      <option value="Voto da Casa">Voto da Casa</option>
                      <option value="Sorteio">Sorteio</option>
                      <option value="Perdeu na Prova">Perdeu na Prova</option>
                      <option value="Voto da Casa (Desempate)">Voto da Casa (Desempate)</option>
                      <option value="Big Fone">Big Fone</option>
                    </select>
                  )}
                  
                  {currentNomineeReason === 'Contra-golpe' && (
                     <select value={currentNominatedBy} onChange={e => setCurrentNominatedBy(e.target.value)} className={`${selectClass} border-indigo-500/50`}>
                        <option value="">Quem puxou?</option>
                        {nominees.map(nom => { const p = activePlayers.find(ap => ap.id === nom.playerId); return p ? <option key={p.id} value={p.id}>{p.name}</option> : null; })}
                      </select>
                  )}

                  <div className="flex gap-2">
                    <input type="number" min="0" value={currentVoteCount} onChange={e => setCurrentVoteCount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Votos" className={`${inputClass} flex-1`} />
                     <button onClick={() => setIsOpenVote(!isOpenVote)} className={`px-2 rounded border flex items-center justify-center ${isOpenVote ? 'bg-blue-500/20 border-blue-500 text-blue-300' : 'bg-slate-950/50 border-slate-700 text-slate-500'}`} title="Voto Aberto?"><Megaphone className="w-3 h-3" /></button>
                     {/* Compact Add Button */}
                     {isCompact && (
                       <button onClick={handleAddNominee} disabled={!currentNomineeId} className="px-3 bg-indigo-600 text-white rounded font-bold">+</button>
                     )}
                  </div>
                   
                   {!isCompact && (
                      <button onClick={() => setIsReverseVote(!isReverseVote)} className={`w-full p-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-2 border ${isReverseVote ? 'bg-green-500/10 border-green-500/40 text-green-300' : 'bg-slate-800 border-slate-700'}`}>
                        {isReverseVote ? 'Modo: Salvar' : 'Modo: Eliminar'}
                      </button>
                   )}

                   {!isCompact && (
                     <Button onClick={handleAddNominee} disabled={!currentNomineeId} variant="secondary" fullWidth className="mt-2">Confirmar</Button>
                   )}
               </div>

               {/* OTHER VOTES SECTION */}
               <div className={`${isCompact ? 'mt-2 bg-slate-900/40 rounded-xl border border-white/5 p-2' : 'mt-4 p-4 max-h-[300px] bg-slate-900/40 rounded-xl border border-white/5 overflow-y-auto custom-scrollbar'}`}>
                 <div className="flex items-center justify-between border-b border-white/5 pb-1 mb-2">
                    <div className="text-slate-400 text-[10px] font-semibold uppercase flex items-center gap-1">
                      <User className="w-3 h-3" /> Votos da Casa
                    </div>
                    {/* BUTTONS TO REVEAL/AUTOMATE */}
                    <div className="flex items-center gap-1">
                      <button 
                         onClick={() => setShowCoordsSettings(!showCoordsSettings)}
                         className={`p-1 rounded transition-colors ${showCoordsSettings ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                         title="Configurar Posição do Clique"
                      >
                         <Settings2 className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={announceVotesToHabbo}
                        disabled={isAutomating}
                        className={`text-[10px] flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${isAutomating ? 'bg-yellow-500/20 text-yellow-300 cursor-wait' : 'text-indigo-400 hover:text-indigo-200 bg-indigo-500/10 hover:bg-indigo-500/30'}`}
                        title="Digitar votos no Habbo via Python"
                      >
                        {isAutomating ? <Activity className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3 h-3" />}
                        {isAutomating ? 'Rodando...' : 'Iniciar'}
                      </button>
                    </div>
                 </div>

                 {/* COORDS SETTINGS PANEL */}
                 {showCoordsSettings && (
                    <div className="mb-2 p-2 bg-slate-950/80 rounded border border-indigo-500/30 flex flex-col gap-2 animate-slide-up">
                       <div className="flex items-center gap-2 text-xs">
                           <Crosshair className="w-3 h-3 text-indigo-400" />
                           <div className="flex items-center gap-1">
                             <span>X:</span>
                             <input 
                               type="number" 
                               value={clickCoords.x} 
                               onChange={(e) => saveCoords({...clickCoords, x: Number(e.target.value)})}
                               className="w-12 bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-center outline-none focus:border-indigo-500" 
                             />
                           </div>
                           <div className="flex items-center gap-1">
                             <span>Y:</span>
                             <input 
                               type="number" 
                               value={clickCoords.y} 
                               onChange={(e) => saveCoords({...clickCoords, y: Number(e.target.value)})}
                               className="w-12 bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-center outline-none focus:border-indigo-500" 
                             />
                           </div>
                       </div>
                       
                       {/* AUTO CAPTURE BUTTON */}
                       <button
                         onClick={handleCaptureCoords}
                         disabled={captureCountdown !== null}
                         className={`w-full py-1.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all
                           ${captureCountdown !== null 
                             ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' 
                             : 'bg-indigo-600 text-white hover:bg-indigo-500'}
                         `}
                       >
                         {captureCountdown !== null ? (
                           <>
                             <Clock className="w-3 h-3 animate-pulse" />
                             {captureCountdown}s... Mova o mouse!
                           </>
                         ) : (
                           <>
                             <Target className="w-3 h-3" />
                             Capturar (3s)
                           </>
                         )}
                       </button>
                    </div>
                 )}
                 
                 {isCompact ? (
                    /* COMPACT MODE: 3-COLUMN GRID + ACTIVE PANEL */
                    <div className="space-y-2">
                        {/* 1. Grid of Eligible Voters (Click = Select, Click Again = Vote) */}
                        <div className="grid grid-cols-3 gap-1 max-h-[120px] overflow-y-auto custom-scrollbar p-1">
                           {eligibleVoters.map(p => {
                               const count = getVoteCount(p.id);
                               const isTarget = compactVoteTarget === p.id;
                               return (
                                   <button 
                                      key={p.id}
                                      onClick={() => handleQuickVote(p.id)}
                                      className={`
                                        text-[10px] px-1 py-2 rounded border truncate relative transition-all active:scale-95
                                        ${count > 0 
                                            ? 'bg-indigo-500/20 border-indigo-500 text-indigo-200' 
                                            : 'bg-slate-950/50 border-slate-700 text-slate-400 hover:border-slate-500'}
                                        ${isTarget ? 'ring-1 ring-white/50 bg-slate-800' : ''}
                                      `}
                                   >
                                       {p.name}
                                       {count > 0 && (
                                           <span className="absolute top-0 right-0 bg-indigo-500 text-white text-[9px] w-3.5 h-3.5 flex items-center justify-center rounded-bl rounded-tr font-bold shadow-sm">
                                               {count}
                                           </span>
                                       )}
                                   </button>
                               );
                           })}
                        </div>

                        {/* 2. Active Target Controls (Fixed below grid) */}
                        {compactVoteTarget ? (
                            <div className="bg-slate-950/80 rounded border border-indigo-500/30 p-2 space-y-1.5 animate-scale-in">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-white truncate max-w-[90px]">
                                        {getPlayerName(compactVoteTarget)}
                                    </span>
                                    <div className="flex items-center bg-slate-800 rounded border border-slate-700/50">
                                        <button onClick={() => updateOtherVote(compactVoteTarget, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-slate-700 text-slate-400"><Minus className="w-3 h-3" /></button>
                                        <span className="text-sm w-6 text-center font-bold text-indigo-400">{getVoteCount(compactVoteTarget)}</span>
                                        <button onClick={() => updateOtherVote(compactVoteTarget, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-slate-700 text-white"><Plus className="w-3 h-3" /></button>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button 
                                      onClick={() => sendHouseVoteToWall(compactVoteTarget, getVoteCount(compactVoteTarget))}
                                      disabled={getVoteCount(compactVoteTarget) === 0}
                                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] py-1 rounded flex items-center justify-center gap-1 disabled:opacity-50"
                                    >
                                        <ArrowRight className="w-3 h-3" /> Paredão
                                    </button>
                                    <button 
                                      onClick={() => sendTieBreakerToWall(compactVoteTarget, getVoteCount(compactVoteTarget))}
                                      disabled={getVoteCount(compactVoteTarget) === 0}
                                      className="flex-1 bg-red-600 hover:bg-red-500 text-white text-[10px] py-1 rounded flex items-center justify-center gap-1 disabled:opacity-50"
                                    >
                                        <Gavel className="w-3 h-3" /> Desempate
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-[10px] text-slate-600 text-center italic py-2">
                                Clique para selecionar, depois clique para votar (+1)
                            </div>
                        )}
                    </div>
                 ) : (
                    /* FULL MODE: Original List */
                    <div className="grid grid-cols-1 gap-1">
                        {eligibleVoters.map(p => {
                            const count = getVoteCount(p.id);
                            return (
                                <div key={p.id} className={`flex items-center justify-between p-1.5 rounded border ${count > 0 ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-950/30 border-white/5'}`}>
                                    <span className="text-xs truncate font-medium text-slate-300 flex-1">{p.name}</span>
                                    <div className="flex items-center gap-1">
                                        {/* SEND HOUSE VOTE BUTTON */}
                                        <button 
                                        onClick={() => sendHouseVoteToWall(p.id, count)} 
                                        disabled={count === 0} 
                                        className={`w-5 h-5 flex items-center justify-center rounded bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-colors ${count > 0 ? '' : 'opacity-0'}`}
                                        title="Enviar como Voto da Casa"
                                        >
                                        <ArrowRight className="w-3 h-3" />
                                        </button>

                                        {/* SEND TIE BREAKER BUTTON */}
                                        <button 
                                        onClick={() => sendTieBreakerToWall(p.id, count)} 
                                        disabled={count === 0} 
                                        className={`w-5 h-5 flex items-center justify-center rounded bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors ${count > 0 ? '' : 'opacity-0'}`}
                                        title="Enviar para Desempate"
                                        >
                                        <Gavel className="w-3 h-3" />
                                        </button>

                                        {/* COUNTER */}
                                        <div className="flex items-center bg-slate-800 rounded border border-slate-700/50">
                                        <button onClick={() => updateOtherVote(p.id, -1)} className="w-5 h-5 flex items-center justify-center hover:bg-slate-700"><Minus className="w-3 h-3" /></button>
                                        <span className={`text-[10px] w-5 text-center font-bold ${count > 0 ? 'text-indigo-400' : 'text-slate-600'}`}>{count}</span>
                                        <button onClick={() => updateOtherVote(p.id, 1)} className="w-5 h-5 flex items-center justify-center hover:bg-slate-700"><Plus className="w-3 h-3" /></button>
                                        </div>
                                    </div>
                                </div>
                            )
                            })
                        }
                    </div>
                 )}
               </div>
             </div>

             <div className={isCompact ? 'col-span-1' : 'md:col-span-7'}>
               <div className={`grid gap-2 ${isCompact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                 {nominees.map((nom) => {
                    const p = activePlayers.find(ap => ap.id === nom.playerId);
                    return (
                      <div key={nom.playerId} className={`relative border p-2 rounded flex justify-between items-center ${nom.isReverseVote ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                          <div>
                            <span className={`font-bold text-xs block ${nom.isReverseVote ? 'text-green-300' : 'text-red-300'}`}>{p?.name}</span>
                            <span className="text-[10px] text-slate-500 block">{nom.reason} {nom.voteCount ? `(${nom.voteCount})` : ''}</span>
                          </div>
                          <button onClick={() => removeNominee(nom.playerId)} className="text-slate-500 hover:text-white px-2">&times;</button>
                      </div>
                    );
                 })}
                 {nominees.length === 0 && <div className="text-center text-xs text-slate-600 py-2 border border-dashed border-slate-800 rounded">Vazio</div>}
               </div>
             </div>
          </div>
        </div>

        {/* 5. Elimination */}
        <div className={`${panelClass} md:col-span-2 border-t-2 border-t-purple-500/30`}>
          {!isCompact && (
            <div className="flex items-center gap-2 text-purple-400 border-b border-white/5 pb-2">
              <CheckSquare className="w-4 h-4" /> <h3 className="font-semibold text-sm uppercase">Eliminação</h3>
            </div>
          )}
          
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
            {nominees.map(nom => {
              const p = activePlayers.find(ap => ap.id === nom.playerId);
              const eliminated = isEliminated(nom.playerId);
              return (
                <button key={nom.playerId} onClick={() => toggleEliminated(nom.playerId)} className={`p-2 rounded border flex items-center justify-between ${eliminated ? 'bg-purple-600/20 border-purple-500 text-white' : 'bg-slate-900/40 border-slate-700 text-slate-500'}`}>
                  <span className="font-semibold text-xs truncate">{p?.name}</span>
                  {eliminated ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className={`fixed bottom-0 left-0 right-0 bg-[#0B0E14] border-t border-white/10 p-2 flex justify-center z-50 ${isCompact ? '' : 'bottom-6 bg-transparent border-none pointer-events-none'}`}>
        <div className={`w-full ${isCompact ? '' : 'pointer-events-auto max-w-md shadow-2xl'}`}>
          <Button 
            onClick={handleSubmit} 
            fullWidth 
            className={isCompact ? "py-2 text-sm" : "py-4 text-lg font-bold"}
            disabled={!challengeName || nominees.length === 0 || eliminatedIds.length === 0}
          >
            <Save className={isCompact ? "w-4 h-4" : "w-5 h-5"} />
            {isCompact ? 'Confirmar' : 'Confirmar Rodada'}
          </Button>
        </div>
      </div>
    </div>
  );
};
