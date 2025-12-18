import React from 'react';
import { Player, RoundLog } from '../types';
import { X, Trophy, Crown, Skull, Activity, Ban, Target } from 'lucide-react';

interface StatsModalProps {
  onClose: () => void;
  players: Player[];
  rounds: RoundLog[];
}

export const StatsModal: React.FC<StatsModalProps> = ({ onClose, players, rounds }) => {
  
  // Calculate Stats
  const stats = players.map(player => {
    const leaderships = rounds.filter(r => r.leaderId === player.id).length;
    const walled = rounds.filter(r => r.nominees.some(n => n.playerId === player.id)).length;
    const eliminated = player.status === 'ELIMINATED';
    const survived = walled - (eliminated ? 1 : 0);
    const vetoed = rounds.filter(r => r.vetoedIds.includes(player.id)).length;
    
    // Total votes received (Votes from Wall Nomination + Other Registered Votes)
    const votesReceived = rounds.reduce((acc, r) => {
      const nomineeVote = r.nominees.find(n => n.playerId === player.id)?.voteCount || 0;
      const otherVote = r.otherVotes?.find(ov => ov.playerId === player.id)?.count || 0;
      return acc + nomineeVote + otherVote;
    }, 0);

    return {
      ...player,
      leaderships,
      walled,
      eliminated,
      survived,
      votesReceived,
      vetoed
    };
  }).sort((a, b) => {
    // Sort logic: Winners/Active first, then by leaderships
    if (a.status !== b.status) {
       if (a.status === 'WINNER') return -1;
       if (b.status === 'WINNER') return 1;
       if (a.status === 'ACTIVE') return -1;
       if (b.status === 'ACTIVE') return 1;
    }
    return b.leaderships - a.leaderships;
  });

  const getPlayerName = (id: string | null) => players.find(p => p.id === id)?.name || 'N/A';
  const getPlayerAvatar = (id: string | null) => players.find(p => p.id === id)?.avatarUrl;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="glass-panel w-full max-w-5xl h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl shadow-indigo-500/10">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <Activity className="text-indigo-400" /> Central de Estatísticas
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Players Grid Stats */}
          <section>
            <h3 className="text-lg font-bold text-slate-300 mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" /> Ranking Geral
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {stats.map(player => (
                <div key={player.id} className={`glass-card p-4 rounded-xl relative overflow-hidden group ${player.status === 'ELIMINATED' ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-full border-2 overflow-hidden bg-slate-800 shrink-0 ${player.status === 'ACTIVE' ? 'border-green-500' : 'border-slate-600'}`}>
                      {player.avatarUrl ? (
                         <img src={player.avatarUrl} alt="" className="w-full h-full object-cover scale-150 translate-y-2" />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center">{player.name[0]}</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-white truncate block">{player.name}</span>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        player.status === 'ACTIVE' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {player.status === 'ACTIVE' ? 'Na Casa' : 'Eliminado'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-900/50 p-2 rounded border border-white/5">
                      <div className="text-slate-500 flex items-center gap-1 mb-0.5"><Crown className="w-3 h-3 text-yellow-500"/> Líder</div>
                      <div className="font-mono text-lg text-white">{player.leaderships}x</div>
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded border border-white/5">
                      <div className="text-slate-500 flex items-center gap-1 mb-0.5"><Target className="w-3 h-3 text-red-400"/> Paredão</div>
                      <div className="font-mono text-lg text-white">{player.walled}x</div>
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded border border-white/5">
                      <div className="text-slate-500 flex items-center gap-1 mb-0.5"><Ban className="w-3 h-3 text-slate-400"/> Vetos</div>
                      <div className="font-mono text-lg text-white">{player.vetoed}x</div>
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded border border-white/5">
                      <div className="text-slate-500 flex items-center gap-1 mb-0.5">Votos</div>
                      <div className="font-mono text-lg text-white">{player.votesReceived}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Full History Table */}
          <section>
             <h3 className="text-lg font-bold text-slate-300 mb-4 flex items-center gap-2 border-t border-white/10 pt-6">
              <Activity className="w-4 h-4 text-indigo-400" /> Histórico Completo
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="p-3">Semana</th>
                    <th className="p-3">Líder</th>
                    <th className="p-3">Prova</th>
                    <th className="p-3">Paredão</th>
                    <th className="p-3">Eliminado</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {rounds.slice().reverse().map(round => (
                    <tr key={round.roundNumber} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-3 font-mono text-indigo-300">#{round.roundNumber}</td>
                      <td className="p-3">
                         {round.leaderId && (
                           <div className="flex items-center gap-2">
                             <img src={getPlayerAvatar(round.leaderId) || ''} className="w-6 h-6 rounded-full bg-slate-800 object-cover scale-150" alt=""/>
                             <span className="text-yellow-400">{getPlayerName(round.leaderId)}</span>
                           </div>
                         )}
                      </td>
                      <td className="p-3 text-slate-300">{round.challengeName}</td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex flex-wrap gap-1">
                            {round.nominees.map(n => (
                              <span key={n.playerId} className="px-1.5 py-0.5 bg-slate-800 rounded text-xs text-slate-300 border border-slate-700" title={n.reason}>
                                {getPlayerName(n.playerId)}
                              </span>
                            ))}
                          </div>
                          {/* Show notable other votes in table too if space permits, or just count */}
                          {round.otherVotes && round.otherVotes.length > 0 && (
                            <div className="text-[10px] text-slate-500">
                               + {round.otherVotes.length} outros votados
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        {round.eliminatedIds.length > 0 ? (
                           <div className="flex flex-wrap gap-1">
                             {round.eliminatedIds.map(id => (
                               <span key={id} className="px-1.5 py-0.5 bg-red-500/20 text-red-300 rounded text-xs border border-red-500/30">
                                 {getPlayerName(id)}
                               </span>
                             ))}
                           </div>
                        ) : <span className="text-slate-600">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};