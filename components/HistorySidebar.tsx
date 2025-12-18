import React from 'react';
import { RoundLog, Player } from '../types';
import { Trophy, Skull, Crown, Ban, ThumbsUp, Activity, Megaphone, Sword } from 'lucide-react';

interface HistorySidebarProps {
  rounds: RoundLog[];
  players: Player[];
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ rounds, players }) => {
  const getPlayerName = (id: string | null) => {
    if (!id) return 'Ninguém';
    return players.find(p => p.id === id)?.name || 'Desconhecido';
  };
  
  const getPlayerAvatar = (id: string | null) => {
    return players.find(p => p.id === id)?.avatarUrl;
  }

  return (
    <div className="glass-panel rounded-2xl p-5 h-[calc(100vh-140px)] flex flex-col sticky top-24">
      <h3 className="font-display font-bold text-xl mb-6 text-indigo-300 flex items-center gap-2 border-b border-white/5 pb-4">
        <Trophy className="w-5 h-5" /> Linha do Tempo
      </h3>
      
      <div className="overflow-y-auto space-y-6 pr-2 flex-1 custom-scrollbar relative">
        {/* Timeline line */}
        {rounds.length > 0 && (
          <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-indigo-500/50 to-transparent"></div>
        )}

        {rounds.length === 0 ? (
          <div className="text-center py-12 opacity-40">
            <div className="w-16 h-16 bg-slate-700 rounded-full mx-auto mb-3 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium">O jogo ainda não começou</p>
          </div>
        ) : (
          rounds.slice().reverse().map((round, idx) => (
            <div key={round.roundNumber} className="relative pl-10 animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
              {/* Timeline Dot */}
              <div className="absolute left-3 top-0 w-4 h-4 rounded-full border-2 border-indigo-500 bg-slate-900 z-10 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>

              <div className="bg-slate-900/60 border border-white/5 rounded-xl p-3 text-sm hover:bg-slate-800/60 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-indigo-400 text-xs uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded">
                    Semana {round.roundNumber}
                  </span>
                </div>
                
                <div className="mb-2">
                    <span className="text-slate-300 font-medium">{round.challengeName}</span>
                </div>
                
                <div className="space-y-1.5 text-xs">
                  {round.leaderId && (
                     <div className="flex items-center gap-2 text-yellow-500/80">
                       <Crown className="w-3 h-3" />
                       <div className="flex items-center gap-1">
                         {getPlayerAvatar(round.leaderId) && <img src={getPlayerAvatar(round.leaderId)} className="w-4 h-4 rounded-full bg-slate-800 object-cover scale-150" alt="" />}
                         <span>Líder: {getPlayerName(round.leaderId)}</span>
                       </div>
                     </div>
                  )}

                  {round.vetoedIds && round.vetoedIds.length > 0 && (
                     <div className="flex items-start gap-2 text-slate-500">
                       <Ban className="w-3 h-3 mt-0.5" />
                       <span className="truncate max-w-[150px]">Vetados: {round.vetoedIds.map(id => getPlayerName(id)).join(', ')}</span>
                     </div>
                  )}
                  
                  <div className="mt-3 pt-2 border-t border-white/5">
                    <div className="flex flex-col gap-1.5 mb-2">
                      {round.nominees.map(n => (
                        <div key={n.playerId} className={`px-2 py-1 rounded flex items-center justify-between gap-1.5 ${
                            round.eliminatedIds.includes(n.playerId) 
                              ? 'bg-red-500/10 text-red-300 border border-red-500/20' 
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                          <div className="flex items-center gap-1">
                            <span className={round.eliminatedIds.includes(n.playerId) ? 'line-through decoration-red-500/50' : ''}>
                              {getPlayerName(n.playerId)}
                            </span>
                            {n.isOpenVote && <Megaphone className="w-2.5 h-2.5 text-blue-400" />}
                            {n.isReverseVote && <ThumbsUp className="w-2.5 h-2.5 text-green-400" />}
                            {n.nominatedBy && <Sword className="w-2.5 h-2.5 text-orange-400" />}
                          </div>
                          {n.nominatedBy && (
                            <span className="text-[9px] text-orange-300/70 ml-1">
                              (Pux: {getPlayerName(n.nominatedBy)})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {round.eliminatedIds.length > 0 && (
                      <div className="flex flex-col gap-1 text-red-400 bg-red-950/20 p-2 rounded-lg border border-red-900/30">
                        <div className="flex items-center gap-1.5">
                          <Skull className="w-3 h-3" />
                          <span className="font-bold uppercase text-[10px] tracking-widest opacity-80">Eliminado(s)</span>
                        </div>
                        <div className="pl-5 font-medium flex flex-col gap-1">
                           {round.eliminatedIds.map(id => (
                             <div key={id} className="flex items-center gap-2">
                               {getPlayerAvatar(id) && <img src={getPlayerAvatar(id)} className="w-4 h-4 rounded-full bg-slate-900 object-cover scale-150 grayscale" alt="" />}
                               <span>{getPlayerName(id)}</span>
                             </div>
                           ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};