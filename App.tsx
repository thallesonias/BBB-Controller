
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GameState, GamePhase, Player, RoundLog } from './types';
import { PlayerSetup } from './components/PlayerSetup';
import { RoundManager } from './components/RoundManager';
import { HistorySidebar } from './components/HistorySidebar';
import { FinalScreen } from './components/FinalScreen';
import { StatsModal } from './components/StatsModal';
import { UserCog, X, LayoutDashboard, BarChart2, UserPlus, Clock, PictureInPicture2, Maximize2, MonitorSmartphone, Skull, Volume2, VolumeX } from 'lucide-react';
import { Button } from './components/Button';

// Ambient Background Component
const BackgroundEffect = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] animate-float" style={{ animationDuration: '15s' }}></div>
    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/20 blur-[120px] animate-float" style={{ animationDuration: '20s', animationDelay: '2s' }}></div>
    <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-cyan-900/10 blur-[100px] animate-pulse-slow"></div>
  </div>
);

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    phase: GamePhase.SETUP,
    players: [],
    rounds: [],
    currentRound: 1,
    targetDuration: 60 // Default 1 hour
  });

  // Timer State
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [elapsedTimeStr, setElapsedTimeStr] = useState('00:00:00');
  
  // Mute State
  const [isMuted, setIsMuted] = useState(false);
  const [isMuting, setIsMuting] = useState(false);

  // Compact Mode State (Mini Mode)
  const [isCompact, setIsCompact] = useState(false);

  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showExpelModal, setShowExpelModal] = useState(false);
  
  const [playerToReplace, setPlayerToReplace] = useState('');
  const [playerToExpel, setPlayerToExpel] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [midGamePlayerName, setMidGamePlayerName] = useState('');

  // Helper to generate Avatar URL
  const getAvatarUrl = (username: string) => {
    return `https://www.habbo.com.br/habbo-imaging/avatarimage?&user=${encodeURIComponent(username)}&action=std&direction=3&head_direction=3&img_format=png&gesture=sml&headonly=1&size=l`;
  };

  // Timer Logic
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let interval: any;

    if (gameState.phase === GamePhase.PLAYING && gameStartTime) {
      interval = setInterval(() => {
        setElapsedTimeStr(formatTime(Date.now() - gameStartTime));
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [gameState.phase, gameStartTime]);

  // Toggle Compact Mode / Mini Window
  const toggleCompactMode = () => {
    const newCompactState = !isCompact;
    setIsCompact(newCompactState);

    // Try to communicate with Electron if available
    if ((window as any).electronAPI) {
      (window as any).electronAPI.toggleCompact(newCompactState);
    } else {
      console.log("Electron API not found. Switching UI mode only.");
    }
  };

  const toggleRoomMute = async () => {
    if (isMuting) return;
    setIsMuting(true);
    
    try {
        const response = await fetch('http://localhost:5000/toggle-mute', { method: 'POST' });
        if (response.ok) {
            setIsMuted(!isMuted);
        } else {
            alert("Erro ao comunicar com o servidor de automação.");
        }
    } catch (e) {
        console.error(e);
        alert("Erro: Verifique se o automation_server.py está rodando.");
    } finally {
        setIsMuting(false);
    }
  };

  // Handle Game Start
  const startGame = (players: Player[], duration: number) => {
    setGameStartTime(Date.now());
    setGameState({
      phase: GamePhase.PLAYING,
      players,
      rounds: [],
      currentRound: 1,
      targetDuration: duration
    });
  };

  // Handle Round Finish
  const finishRound = (log: RoundLog) => {
    setGameState(prev => {
      const updatedPlayers = prev.players.map(p => 
        log.eliminatedIds.includes(p.id) ? { ...p, status: 'ELIMINATED' as const } : p
      );

      return {
        ...prev,
        players: updatedPlayers,
        rounds: [...prev.rounds, log],
        currentRound: prev.currentRound + 1
      };
    });
  };

  // Handle Player Replacement
  const handleReplacePlayer = () => {
    if (!playerToReplace || !newPlayerName.trim()) return;

    setGameState(prev => {
      const updatedPlayers = prev.players.map(p => {
        if (p.id === playerToReplace) {
          return { ...p, status: 'ELIMINATED' as const };
        }
        return p;
      });

      const newPlayer: Player = {
        id: crypto.randomUUID(),
        name: newPlayerName.trim(),
        status: 'ACTIVE',
        avatarUrl: getAvatarUrl(newPlayerName.trim())
      };

      return {
        ...prev,
        players: [...updatedPlayers, newPlayer]
      };
    });

    setShowReplacementModal(false);
    setPlayerToReplace('');
    setNewPlayerName('');
  };

  // Handle Add Player Mid Game
  const handleAddMidGamePlayer = () => {
    if (!midGamePlayerName.trim()) return;

    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name: midGamePlayerName.trim(),
      status: 'ACTIVE',
      avatarUrl: getAvatarUrl(midGamePlayerName.trim())
    };

    setGameState(prev => ({
      ...prev,
      players: [...prev.players, newPlayer]
    }));

    setShowAddPlayerModal(false);
    setMidGamePlayerName('');
  };

  // Handle Direct Expulsion
  const handleExpelPlayer = () => {
    if (!playerToExpel) return;

    setGameState(prev => ({
        ...prev,
        players: prev.players.map(p => 
            p.id === playerToExpel ? { ...p, status: 'ELIMINATED' as const } : p
        )
    }));

    setShowExpelModal(false);
    setPlayerToExpel('');
  };

  const goToFinal = () => {
    setGameState(prev => ({
      ...prev,
      phase: GamePhase.FINAL
    }));
  };

  const restartGame = () => {
    setGameStartTime(null);
    setElapsedTimeStr('00:00:00');
    setGameState({
      phase: GamePhase.SETUP,
      players: [],
      rounds: [],
      currentRound: 1,
      targetDuration: 60
    });
    setIsCompact(false);
    setIsMuted(false);
  };

  const activePlayers = gameState.players.filter(p => p.status === 'ACTIVE');

  return (
    <div className={`min-h-screen font-sans selection:bg-indigo-500/30 selection:text-indigo-200 relative bg-[#0B0E14] text-slate-200 ${isCompact ? 'overflow-hidden' : ''}`}>
      
      <BackgroundEffect />

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 bg-[#0B0E14]/90 backdrop-blur-xl border-b border-white/5 transition-all duration-300 ${isCompact ? 'h-10' : 'h-16'}`}>
        <div className={`mx-auto px-4 h-full flex items-center justify-between ${isCompact ? 'max-w-full' : 'max-w-7xl'}`}>
          
          {/* Logo - Hidden in compact mode to save space */}
          {!isCompact && (
            <div className="flex items-center gap-3 group cursor-default">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white font-display font-bold text-lg shadow-[0_0_15px_rgba(79,70,229,0.3)] group-hover:scale-105 transition-transform duration-300">
                H
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-white group-hover:text-indigo-100 transition-colors">
                Habbo<span className="text-indigo-400">BBB</span>
              </span>
            </div>
          )}

          {/* Compact Header Content */}
          {isCompact && (
             <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                    {gameState.currentRound}
                </div>
                {elapsedTimeStr}
                {/* Mute Button Compact */}
                <button 
                   onClick={toggleRoomMute}
                   disabled={isMuting}
                   className={`p-1 rounded ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'}`}
                   title="Mutar/Desmutar Quarto"
                >
                    {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                </button>
             </div>
          )}
          
          {gameState.phase !== GamePhase.SETUP && (
            <div className="flex items-center gap-2 text-sm font-medium animate-fade-in ml-auto">
               
               {/* Timer & Mute Display (Desktop only) */}
               {!isCompact && (
                 <div className="hidden md:flex items-center mr-2">
                    {/* Timer */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-l-lg bg-slate-800/50 border border-white/10 text-slate-300 font-mono tracking-wider">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      {elapsedTimeStr}
                    </div>
                    {/* Mute Button */}
                    <button 
                        onClick={toggleRoomMute}
                        disabled={isMuting}
                        className={`flex items-center justify-center px-3 py-1.5 rounded-r-lg border border-l-0 border-white/10 transition-colors ${
                            isMuting ? 'bg-slate-800/50 cursor-wait opacity-50' : 
                            isMuted 
                                ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40' 
                                : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                        title={isMuted ? "Desmutar Quarto" : "Mutar Quarto"}
                    >
                        {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                 </div>
               )}

               {/* Mini Mode Toggle Button */}
               <button 
                 onClick={toggleCompactMode}
                 className={`p-1.5 rounded-lg transition-colors border ${isCompact ? 'bg-indigo-500 text-white border-indigo-400' : 'text-slate-400 hover:text-indigo-400 hover:bg-white/5 border-transparent'}`}
                 title={isCompact ? "Expandir" : "Modo Mini (Janela Flutuante)"}
               >
                 {isCompact ? <Maximize2 className="w-4 h-4" /> : <MonitorSmartphone className="w-5 h-5" />}
               </button>

               {!isCompact && (
                 <>
                   <button 
                     onClick={() => setShowStatsModal(true)}
                     className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded-lg transition-colors"
                     title="Ver Estatísticas"
                   >
                     <BarChart2 className="w-5 h-5" />
                   </button>
                   <div className="h-4 w-[1px] bg-white/10 mx-1"></div>
                   <button 
                     onClick={() => setShowAddPlayerModal(true)}
                     className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg border border-indigo-500/20 transition-colors text-indigo-300 hover:text-indigo-200"
                   >
                     <UserPlus className="w-4 h-4" />
                     <span className="hidden sm:inline">Add</span>
                   </button>
                   <button 
                     onClick={() => setShowReplacementModal(true)}
                     className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-white/10 transition-colors text-slate-300 hover:text-white"
                   >
                     <UserCog className="w-4 h-4" />
                     <span className="hidden sm:inline">Trocar</span>
                   </button>
                   <button 
                     onClick={() => setShowExpelModal(true)}
                     className="flex items-center gap-2 px-3 py-1.5 bg-red-900/20 hover:bg-red-900/40 rounded-lg border border-red-500/30 transition-colors text-red-400 hover:text-red-200"
                     title="Expulsar/Desistir"
                   >
                     <Skull className="w-4 h-4" />
                     <span className="hidden sm:inline">Expulsar</span>
                   </button>
                 </>
               )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className={`relative z-10 mx-auto min-h-screen ${isCompact ? 'pt-12 px-2 pb-2 max-w-full' : 'max-w-7xl px-4 pt-24 pb-8'}`}>
        
        {gameState.phase === GamePhase.SETUP && (
          <div className="py-12 flex items-center justify-center min-h-[60vh]">
            <div className="w-full">
               <PlayerSetup onStartGame={startGame} />
            </div>
          </div>
        )}

        {gameState.phase === GamePhase.PLAYING && (
          <div className={`grid gap-8 items-start ${isCompact ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
            <div className={isCompact ? 'col-span-1' : 'lg:col-span-2'}>
              <RoundManager 
                roundNumber={gameState.currentRound}
                players={gameState.players}
                onFinishRound={finishRound}
                onEndGame={goToFinal}
                isCompact={isCompact}
                history={gameState.rounds}
                startTime={gameStartTime || Date.now()}
                targetDuration={gameState.targetDuration}
              />
            </div>
            {!isCompact && (
              <div className="hidden lg:block lg:col-span-1">
                <HistorySidebar 
                  rounds={gameState.rounds}
                  players={gameState.players}
                />
              </div>
            )}
          </div>
        )}

        {gameState.phase === GamePhase.FINAL && (
          <FinalScreen 
            finalists={activePlayers}
            allPlayers={gameState.players}
            history={gameState.rounds}
            onRestart={restartGame}
          />
        )}

      </main>

      {/* Stats Modal and other Modals ... (kept same) */}
      {showStatsModal && !isCompact && (
        <StatsModal 
          onClose={() => setShowStatsModal(false)}
          players={gameState.players}
          rounds={gameState.rounds}
        />
      )}

      {/* Expel Modal */}
      {showExpelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
           <div className="glass-panel border-red-900/50 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
             <div className="bg-red-950/30 px-6 py-4 border-b border-red-500/20 flex justify-between items-center">
                <h3 className="font-bold text-red-200 flex items-center gap-2"><Skull className="w-5 h-5" /> Expulsar/Desistência</h3>
                 <button onClick={() => setShowExpelModal(false)}><X className="w-5 h-5 text-red-300" /></button>
             </div>
             <div className="p-6 space-y-4 bg-[#0B0E14]/80">
                <p className="text-sm text-slate-400">Selecione o jogador para eliminar IMEDIATAMENTE. Esta ação não gera paredão.</p>
                <select value={playerToExpel} onChange={e => setPlayerToExpel(e.target.value)} className="w-full bg-slate-950 p-3 rounded-xl border border-slate-700 text-white">
                    <option value="">Quem sai?</option>
                    {activePlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <div className="pt-2 flex gap-3">
                   <Button variant="ghost" onClick={() => setShowExpelModal(false)} className="flex-1">Cancelar</Button>
                   <Button onClick={handleExpelPlayer} variant="danger" className="flex-1" disabled={!playerToExpel}>Confirmar Saída</Button>
                </div>
             </div>
           </div>
        </div>
      )}

      {/* Add Player Modal */}
      {showAddPlayerModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel border-indigo-500/30 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="bg-slate-900/50 px-6 py-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">
                <UserPlus className="text-indigo-400 w-5 h-5" /> Novo Participante
              </h3>
              <button onClick={() => setShowAddPlayerModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5 bg-[#0B0E14]/80">
               <input 
                  type="text" 
                  value={midGamePlayerName}
                  onChange={e => setMidGamePlayerName(e.target.value)}
                  placeholder="Ex: NovoJogadorHabbo"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
                />
              <div className="pt-4 flex gap-3">
                <Button variant="ghost" onClick={() => setShowAddPlayerModal(false)} className="flex-1">Cancelar</Button>
                <Button onClick={handleAddMidGamePlayer} disabled={!midGamePlayerName.trim()} className="flex-1">Adicionar</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Replacement Modal */}
      {showReplacementModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
           <div className="glass-panel border-slate-600 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
             <div className="bg-slate-900/50 px-6 py-4 border-b border-white/5 flex justify-between items-center">
                <h3 className="font-bold text-white flex items-center gap-2">Trocar</h3>
                 <button onClick={() => setShowReplacementModal(false)}><X className="w-5 h-5" /></button>
             </div>
             <div className="p-6 space-y-4 bg-[#0B0E14]/80">
                <select value={playerToReplace} onChange={e => setPlayerToReplace(e.target.value)} className="w-full bg-slate-950 p-3 rounded-xl border border-slate-700 text-white">
                    <option value="">Quem sai?</option>
                    {activePlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="text" value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} placeholder="Quem entra?" className="w-full bg-slate-950 p-3 rounded-xl border border-slate-700 text-white"/>
                <div className="pt-2 flex gap-3">
                   <Button variant="ghost" onClick={() => setShowReplacementModal(false)} className="flex-1">Cancelar</Button>
                   <Button onClick={handleReplacePlayer} className="flex-1">Trocar</Button>
                </div>
             </div>
           </div>
        </div>
      )}

    </div>
  );
}
