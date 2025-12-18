import React, { useState } from 'react';
import { GameState, GamePhase, Player, RoundLog } from './types';
import { PlayerSetup } from './components/PlayerSetup';
import { RoundManager } from './components/RoundManager';
import { HistorySidebar } from './components/HistorySidebar';
import { FinalScreen } from './components/FinalScreen';
import { StatsModal } from './components/StatsModal';
import { UserCog, X, LayoutDashboard, BarChart2 } from 'lucide-react';
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
    currentRound: 1
  });

  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  
  const [playerToReplace, setPlayerToReplace] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');

  // Handle Game Start
  const startGame = (players: Player[]) => {
    setGameState({
      phase: GamePhase.PLAYING,
      players,
      rounds: [],
      currentRound: 1
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

    const getAvatarUrl = (username: string) => {
       return `https://www.habbo.com.br/habbo-imaging/avatarimage?&user=${encodeURIComponent(username)}&action=std&direction=3&head_direction=3&img_format=png&gesture=sml&headonly=1&size=l`;
    };

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

  const goToFinal = () => {
    setGameState(prev => ({
      ...prev,
      phase: GamePhase.FINAL
    }));
  };

  const restartGame = () => {
    setGameState({
      phase: GamePhase.SETUP,
      players: [],
      rounds: [],
      currentRound: 1
    });
  };

  const activePlayers = gameState.players.filter(p => p.status === 'ACTIVE');

  return (
    <div className="min-h-screen font-sans selection:bg-indigo-500/30 selection:text-indigo-200 relative bg-[#0B0E14] text-slate-200">
      
      <BackgroundEffect />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0B0E14]/70 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-default">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white font-display font-bold text-lg shadow-[0_0_15px_rgba(79,70,229,0.3)] group-hover:scale-105 transition-transform duration-300">
              H
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-white group-hover:text-indigo-100 transition-colors">
              Habbo<span className="text-indigo-400">BBB</span>
            </span>
          </div>
          
          {gameState.phase !== GamePhase.SETUP && (
            <div className="flex items-center gap-2 sm:gap-3 text-sm font-medium animate-fade-in">
               
               {/* Stats Button */}
               <button 
                 onClick={() => setShowStatsModal(true)}
                 className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded-lg transition-colors"
                 title="Ver Estatísticas"
               >
                 <BarChart2 className="w-5 h-5" />
               </button>

               <div className="h-4 w-[1px] bg-white/10 mx-1"></div>

               {gameState.phase === GamePhase.PLAYING && (
                 <button 
                   onClick={() => setShowReplacementModal(true)}
                   className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-white/10 transition-colors text-slate-300 hover:text-white"
                   title="Substituir Jogador"
                 >
                   <UserCog className="w-4 h-4" />
                   <span className="hidden sm:inline">Trocar</span>
                 </button>
               )}

               <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                 <LayoutDashboard className="w-3.5 h-3.5" />
                 Semana {gameState.currentRound}
               </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 pt-24 pb-8 min-h-screen">
        
        {gameState.phase === GamePhase.SETUP && (
          <div className="py-12 flex items-center justify-center min-h-[60vh]">
            <div className="w-full">
               <PlayerSetup onStartGame={startGame} />
            </div>
          </div>
        )}

        {gameState.phase === GamePhase.PLAYING && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <RoundManager 
                roundNumber={gameState.currentRound}
                players={gameState.players}
                onFinishRound={finishRound}
                onEndGame={goToFinal}
              />
            </div>
            <div className="hidden lg:block lg:col-span-1">
              <HistorySidebar 
                rounds={gameState.rounds}
                players={gameState.players}
              />
            </div>
            {/* Mobile History View (could be added as a modal/drawer later) */}
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

      {/* Stats Modal */}
      {showStatsModal && (
        <StatsModal 
          onClose={() => setShowStatsModal(false)}
          players={gameState.players}
          rounds={gameState.rounds}
        />
      )}

      {/* Replacement Modal */}
      {showReplacementModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel border-slate-600 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="bg-slate-900/50 px-6 py-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">
                <UserCog className="text-yellow-400 w-5 h-5" /> Substituir Jogador
              </h3>
              <button onClick={() => setShowReplacementModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5 bg-[#0B0E14]/80">
              <p className="text-sm text-slate-400 leading-relaxed">
                Selecione o jogador que desistiu ou foi expulso. Ele será marcado como eliminado e o novo entrará com status ativo.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Quem sai?</label>
                  <select 
                    value={playerToReplace}
                    onChange={e => setPlayerToReplace(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all custom-select"
                  >
                    <option value="">Selecione o jogador...</option>
                    {activePlayers.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Quem entra?</label>
                  <input 
                    type="text" 
                    value={newPlayerName}
                    onChange={e => setNewPlayerName(e.target.value)}
                    placeholder="Nick do novo participante"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button variant="ghost" onClick={() => setShowReplacementModal(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  onClick={handleReplacePlayer} 
                  disabled={!playerToReplace || !newPlayerName.trim()} 
                  className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 border-yellow-500/20"
                >
                  Confirmar Troca
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}