import React, { useState, useMemo } from 'react';
import { Player, RoundLog, Nominee, OtherVote } from '../types';
import { Button } from './Button';
import { Crown, Shield, Skull, ArrowRight, Save, Activity, CheckSquare, Square, Ban, ThumbsUp, ThumbsDown, Trophy, AlertTriangle, Dice5, Megaphone, Sword, ClipboardList, Plus } from 'lucide-react';

interface RoundManagerProps {
  roundNumber: number;
  players: Player[];
  onFinishRound: (log: RoundLog) => void;
  onEndGame: () => void;
}

// Reusing list logic
const CHALLENGE_LIST = [
  { id: 0, name: "Nenhuma Prova" },
  { id: 1, name: "Fuja" },
  { id: 2, name: "Cruzamento" },
  { id: 3, name: "Fujamento" },
  { id: 4, name: "Fuja 2.0" },
  { id: 5, name: "Massacre" },
  { id: 6, name: "Fujoller" },
  { id: 7, name: "Banzai" },
  { id: 8, name: "Descubra a Senha" },
  { id: 9, name: "Chão é Lava" },
  { id: 10, name: "Balão" },
  { id: 11, name: "Batata Quente" },
  { id: 12, name: "Prova dos Clicks" },
  { id: 13, name: "Coller" },
  { id: 14, name: "Todos x Todos" },
  { id: 15, name: "Verdadeiro ou Falso" },
  { id: 16, name: "Defenda o seu Pufe" },
  { id: 17, name: "Danger" },
  { id: 18, name: "Dodge Ball" },
  { id: 19, name: "Tiro ao Alvo" },
  { id: 20, name: "Ilhados" },
  { id: 21, name: "Pegue a Lebre" },
  { id: 22, name: "Elefante Colorido" },
  { id: 23, name: "Velocidade é Tudo" },
  { id: 24, name: "Ir até Cor" },
  { id: 25, name: "Subir nas Portas" },
  { id: 26, name: "Fuja em Duplas" },
  { id: 27, name: "Queimada" },
  { id: 28, name: "Pegue o Drink" },
  { id: 29, name: "Nervosos" },
  { id: 30, name: "Sobrevivência" },
  { id: 31, name: "Cabo de Guerra" },
  { id: 32, name: "Resta 1" },
  { id: 33, name: "Céu ou Inferno" },
  { id: 34, name: "Divertidamente" }
];

export const RoundManager: React.FC<RoundManagerProps> = ({ 
  roundNumber, 
  players, 
  onFinishRound,
  onEndGame
}) => {
  const activePlayers = useMemo(() => players.filter(p => p.status === 'ACTIVE'), [players]);
  
  // Form State
  const [challengeName, setChallengeName] = useState('');
  const [leaderId, setLeaderId] = useState<string>('');
  const [vetoedIds, setVetoedIds] = useState<string[]>([]);
  const [immuneIds, setImmuneIds] = useState<string[]>([]);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  
  // Nominee Form State
  const [currentNomineeId, setCurrentNomineeId] = useState('');
  const [currentNomineeReason, setCurrentNomineeReason] = useState('Voto da Casa');
  const [currentVoteCount, setCurrentVoteCount] = useState<number | ''>('');
  const [currentNominatedBy, setCurrentNominatedBy] = useState<string>(''); // For Counter-coup
  const [isReverseVote, setIsReverseVote] = useState(false);
  const [isOpenVote, setIsOpenVote] = useState(false);

  // Other Votes State
  const [otherVotes, setOtherVotes] = useState<OtherVote[]>([]);
  const [otherVotePlayerId, setOtherVotePlayerId] = useState('');
  const [otherVoteCount, setOtherVoteCount] = useState<number | ''>('');

  const [eliminatedIds, setEliminatedIds] = useState<string[]>([]);

  // Helpers
  const isLeader = (id: string) => id === leaderId;
  const isImmune = (id: string) => immuneIds.includes(id);
  const isVetoed = (id: string) => vetoedIds.includes(id);
  const isNominated = (id: string) => nominees.some(n => n.playerId === id);
  const isEliminated = (id: string) => eliminatedIds.includes(id);

  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || '';

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

      // Reset fields
      setCurrentNomineeId('');
      setCurrentNomineeReason('Voto da Casa');
      setCurrentVoteCount('');
      setCurrentNominatedBy('');
      setIsReverseVote(false);
      setIsOpenVote(false);
    }
  };

  const handleAddOtherVote = () => {
    if (otherVotePlayerId && otherVoteCount !== '' && Number(otherVoteCount) > 0) {
      if (isNominated(otherVotePlayerId)) {
        alert("Este jogador já está no paredão. Edite o paredão se quiser mudar os votos dele.");
        return;
      }

      setOtherVotes(prev => [
        ...prev.filter(ov => ov.playerId !== otherVotePlayerId),
        { playerId: otherVotePlayerId, count: Number(otherVoteCount) }
      ]);
      setOtherVotePlayerId('');
      setOtherVoteCount('');
    }
  };

  const removeOtherVote = (id: string) => {
    setOtherVotes(prev => prev.filter(ov => ov.playerId !== id));
  };

  const removeNominee = (id: string) => {
    setNominees(nominees.filter(n => n.playerId !== id));
    setEliminatedIds(prev => prev.filter(eId => eId !== id));
  };

  const toggleEliminated = (id: string) => {
    setEliminatedIds(prev => 
      prev.includes(id) ? prev.filter(eId => eId !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (!challengeName || eliminatedIds.length === 0) return;

    const roundLog: RoundLog = {
      roundNumber,
      challengeName,
      leaderId: leaderId || null,
      vetoedIds,
      immuneIds,
      nominees,
      otherVotes,
      eliminatedIds
    };
    onFinishRound(roundLog);
    
    // Reset form
    setChallengeName('');
    setLeaderId('');
    setVetoedIds([]);
    setImmuneIds([]);
    setNominees([]);
    setOtherVotes([]);
    setEliminatedIds([]);
  };

  // Select styling
  const selectClass = "w-full bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all custom-select";
  const inputClass = "w-full bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-slate-600";

  // If only 2 or 3 players left
  if (activePlayers.length <= 3) {
     return (
       <div className="text-center space-y-8 py-16 glass-panel rounded-2xl animate-fade-in">
         <div className="relative inline-block">
             <div className="absolute inset-0 bg-yellow-500 blur-xl opacity-20 animate-pulse"></div>
             <Trophy className="w-20 h-20 text-yellow-400 relative z-10 mx-auto" />
         </div>
         <div className="space-y-2">
            <h2 className="text-4xl font-display font-bold text-white">Reta Final!</h2>
            <p className="text-slate-400">Restam apenas {activePlayers.length} jogadores na casa.</p>
         </div>
         <div className="flex justify-center gap-4 max-w-md mx-auto">
            <Button onClick={onEndGame} className="flex-1 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 border-yellow-500/20 shadow-yellow-900/20">
              <Crown className="w-5 h-5" />
              Ir para Grande Final
            </Button>
         </div>
       </div>
     );
  }

  return (
    <div className="space-y-6 animate-slide-up pb-20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            {roundNumber}
          </span>
          <span className="font-display tracking-tight">Gerenciar Rodada</span>
        </h2>
        <div className="glass-card px-3 py-1 rounded-full text-xs font-medium text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          {activePlayers.length} Jogadores
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 1. Challenge & Veto */}
        <div className="glass-panel p-5 rounded-2xl space-y-5">
          <div className="flex items-center gap-2 text-indigo-300 border-b border-white/5 pb-2">
            <Activity className="w-4 h-4" />
            <h3 className="font-semibold text-sm uppercase tracking-wider">A Prova</h3>
          </div>
          
          <div>
            <label className="block text-xs text-slate-500 mb-1.5 ml-1">Dinâmica Realizada</label>
            <select 
              value={challengeName}
              onChange={e => setChallengeName(e.target.value)}
              className={selectClass}
            >
              <option value="">Selecione a prova...</option>
              {CHALLENGE_LIST.map(c => (
                <option key={c.id} value={c.name}>{c.id}. {c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs text-slate-500 ml-1 flex items-center gap-1">
              <Ban className="w-3 h-3" /> Vetados (Pelo líder anterior)
            </label>
            <div className="flex flex-wrap gap-2 p-3 bg-slate-950/30 rounded-xl border border-white/5 min-h-[60px]">
              {activePlayers.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setVetoedIds(prev => 
                      prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
                    );
                  }}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-all flex items-center gap-2 ${
                    isVetoed(p.id) 
                      ? 'bg-red-500/20 border-red-500/50 text-red-200' 
                      : 'bg-slate-800/50 border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {p.avatarUrl && <img src={p.avatarUrl} className="w-5 h-5 -mt-2 -mb-2 object-cover" alt="" />}
                  {p.name}
                </button>
              ))}
              {activePlayers.length === 0 && <span className="text-slate-600 text-xs italic">Nenhum jogador ativo</span>}
            </div>
          </div>
        </div>

        {/* 2. Leadership */}
        <div className="glass-panel p-5 rounded-2xl space-y-5">
          <div className="flex items-center gap-2 text-yellow-300 border-b border-white/5 pb-2">
            <Crown className="w-4 h-4" />
            <h3 className="font-semibold text-sm uppercase tracking-wider">Liderança & Anjo</h3>
          </div>
          
          <div>
            <label className="block text-xs text-slate-500 mb-1.5 ml-1">Líder da Semana</label>
            <select 
              value={leaderId}
              onChange={e => {
                setLeaderId(e.target.value);
                setImmuneIds(prev => prev.filter(id => id !== e.target.value));
              }}
              className={`${selectClass} border-yellow-500/20 focus:border-yellow-500 focus:ring-yellow-500/50`}
            >
              <option value="">Selecione o Líder...</option>
              {activePlayers.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs text-slate-500 ml-1 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Imunizados
            </label>
            <div className="flex flex-wrap gap-2 p-3 bg-slate-950/30 rounded-xl border border-white/5 min-h-[60px]">
              {activePlayers.filter(p => p.id !== leaderId).map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setImmuneIds(prev => 
                      prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
                    );
                  }}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-all flex items-center gap-2 ${
                    isImmune(p.id) 
                      ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200 shadow-[0_0_10px_rgba(234,179,8,0.1)]' 
                      : 'bg-slate-800/50 border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {p.avatarUrl && <img src={p.avatarUrl} className="w-5 h-5 -mt-2 -mb-2 object-cover" alt="" />}
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. The Wall */}
        <div className="glass-panel p-5 rounded-2xl space-y-5 md:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Skull className="w-32 h-32" />
          </div>
          
          <div className="flex items-center gap-2 text-red-400 border-b border-white/5 pb-2 relative z-10">
            <AlertTriangle className="w-4 h-4" />
            <h3 className="font-semibold text-sm uppercase tracking-wider">Formação do Paredão</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-12 relative z-10">
             <div className="md:col-span-5 space-y-3">
               <div className="space-y-3 p-4 bg-slate-900/40 rounded-xl border border-white/5">
                 <select 
                    value={currentNomineeId}
                    onChange={e => setCurrentNomineeId(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Selecionar Emparedado...</option>
                    {activePlayers
                      .filter(p => !isLeader(p.id) && !isImmune(p.id) && !isNominated(p.id))
                      .map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))
                    }
                  </select>

                  <select 
                    value={currentNomineeReason}
                    onChange={e => setCurrentNomineeReason(e.target.value)}
                    className={selectClass}
                  >
                    <option value="Voto da Casa">Voto da Casa</option>
                    <option value="Indicação do Líder">Indicação do Líder</option>
                    <option value="Resta 1">Resta 1</option>
                    <option value="Primeiro a perder">Primeiro a perder</option>
                    <option value="Contra-golpe">Contra-golpe</option>
                    <option value="Big Fone">Big Fone</option>
                    <option value="Sorteio">Sorteio</option>
                  </select>
                  
                  {currentNomineeReason === 'Contra-golpe' && (
                    <div className="animate-fade-in">
                       <label className="block text-xs text-slate-500 mb-1 ml-1">Quem puxou?</label>
                       <select 
                        value={currentNominatedBy}
                        onChange={e => setCurrentNominatedBy(e.target.value)}
                        className={`${selectClass} border-indigo-500/50 bg-indigo-900/10`}
                      >
                        <option value="">Selecione o jogador...</option>
                        {activePlayers
                          .filter(p => p.id !== currentNomineeId) // Can't pull yourself
                          .map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))
                        }
                      </select>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input 
                       type="number" 
                       min="0"
                       value={currentVoteCount}
                       onChange={e => setCurrentVoteCount(e.target.value === '' ? '' : Number(e.target.value))}
                       placeholder="Qtd. Votos (Opcional)"
                       className={`${inputClass} flex-1`}
                     />
                     <button
                        onClick={() => setIsOpenVote(!isOpenVote)}
                        className={`px-3 rounded-lg border flex items-center justify-center transition-all ${
                          isOpenVote 
                            ? 'bg-blue-500/20 border-blue-500 text-blue-300' 
                            : 'bg-slate-950/50 border-slate-700 text-slate-500'
                        }`}
                        title="Voto Aberto?"
                     >
                       <Megaphone className="w-4 h-4" />
                     </button>
                  </div>
                   
                   <button
                    onClick={() => setIsReverseVote(!isReverseVote)}
                    className={`w-full p-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all border ${
                      isReverseVote 
                        ? 'bg-green-500/10 border-green-500/40 text-green-300' 
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {isReverseVote ? <ThumbsUp className="w-3 h-3"/> : <ThumbsDown className="w-3 h-3"/>}
                    {isReverseVote ? 'Modo: Salvar (Voto Reverso)' : 'Modo: Eliminar (Normal)'}
                  </button>

                   <Button onClick={handleAddNominee} disabled={!currentNomineeId || (currentNomineeReason === 'Contra-golpe' && !currentNominatedBy)} variant="secondary" fullWidth className="mt-2">
                     Confirmar Emparedado
                   </Button>
               </div>

               {/* OTHER VOTES SECTION */}
               <div className="mt-4 p-4 bg-slate-900/40 rounded-xl border border-white/5 space-y-3">
                 <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold border-b border-white/5 pb-2">
                    <ClipboardList className="w-4 h-4" /> Registro de Votos (Outros)
                 </div>
                 <div className="flex gap-2">
                    <select 
                      value={otherVotePlayerId}
                      onChange={e => setOtherVotePlayerId(e.target.value)}
                      className={`${selectClass} flex-1 text-xs`}
                    >
                      <option value="">Quem recebeu voto?</option>
                      {activePlayers
                        .filter(p => !isNominated(p.id))
                        .map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))
                      }
                    </select>
                    <input 
                       type="number" 
                       min="0"
                       value={otherVoteCount}
                       onChange={e => setOtherVoteCount(e.target.value === '' ? '' : Number(e.target.value))}
                       placeholder="Qtd."
                       className={`${inputClass} w-16 text-center px-1`}
                     />
                     <button 
                       onClick={handleAddOtherVote}
                       disabled={!otherVotePlayerId || !otherVoteCount}
                       className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition-colors"
                     >
                       <Plus className="w-4 h-4" />
                     </button>
                 </div>
                 
                 {otherVotes.length > 0 && (
                   <div className="flex flex-wrap gap-2 mt-2">
                     {otherVotes.map(ov => {
                       const p = activePlayers.find(ap => ap.id === ov.playerId);
                       return (
                         <span key={ov.playerId} className="text-xs bg-slate-800 px-2 py-1 rounded border border-white/10 flex items-center gap-1.5">
                           {p?.name} <span className="text-indigo-400 font-mono">({ov.count})</span>
                           <button onClick={() => removeOtherVote(ov.playerId)} className="text-slate-500 hover:text-red-400 ml-1">&times;</button>
                         </span>
                       );
                     })}
                   </div>
                 )}
               </div>
             </div>

             <div className="md:col-span-7 space-y-6">
               <div>
                  <label className="block text-xs text-slate-500 mb-2 ml-1">No Paredão</label>
                  {nominees.length === 0 ? (
                    <div className="h-full min-h-[100px] flex items-center justify-center border-2 border-dashed border-slate-800 rounded-xl text-slate-600 text-sm">
                      Ninguém no paredão ainda
                    </div>
                  ) : (
                    <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                      {nominees.map((nom, idx) => {
                        const p = activePlayers.find(ap => ap.id === nom.playerId);
                        const nominator = nom.nominatedBy ? activePlayers.find(ap => ap.id === nom.nominatedBy) : null;
                        
                        return (
                          <div key={nom.playerId} className={`relative overflow-hidden border p-3 rounded-xl group animate-scale-in ${
                            nom.isReverseVote 
                              ? 'bg-green-500/5 border-green-500/20' 
                              : 'bg-red-500/5 border-red-500/20'
                          }`} style={{ animationDelay: `${idx * 100}ms`}}>
                            <div className="flex justify-between items-start relative z-10">
                              <div className="flex gap-3">
                                <div className="w-10 h-10 bg-slate-900 rounded-full border border-white/10 overflow-hidden shrink-0">
                                    {p?.avatarUrl && <img src={p.avatarUrl} className="w-full h-full object-cover scale-150 translate-y-2" alt="" />}
                                </div>
                                <div>
                                  <span className={`font-bold block text-sm ${nom.isReverseVote ? 'text-green-300' : 'text-red-300'}`}>
                                    {p?.name}
                                  </span>
                                  <div className="text-xs text-slate-400 mt-1 flex flex-col gap-0.5">
                                    <span className="opacity-75 flex items-center gap-1">
                                        {nom.reason === 'Sorteio' && <Dice5 className="w-3 h-3 inline" />}
                                        {nom.isOpenVote && <Megaphone className="w-3 h-3 inline text-blue-400" />}
                                        {nom.reason === 'Contra-golpe' && <Sword className="w-3 h-3 inline text-orange-400" />}
                                        {nom.reason}
                                    </span>
                                    {nominator && (
                                       <span className="text-orange-300 text-[10px]">Por: {nominator.name}</span>
                                    )}
                                    {nom.voteCount !== undefined && <span className="font-mono bg-slate-800/50 px-1 rounded w-fit">{nom.voteCount} votos</span>}
                                  </div>
                                </div>
                              </div>
                              <button onClick={() => removeNominee(nom.playerId)} className="text-slate-500 hover:text-white transition-colors bg-slate-900/50 rounded p-1">
                                  <span className="sr-only">Remover</span>
                                  &times;
                              </button>
                            </div>
                            {/* Background glow */}
                            <div className={`absolute -right-4 -bottom-4 w-16 h-16 rounded-full blur-xl opacity-20 ${nom.isReverseVote ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          </div>
                        );
                      })}
                    </div>
                  )}
               </div>
             </div>
          </div>
        </div>

        {/* 4. Elimination */}
        <div className="glass-panel p-5 rounded-2xl space-y-5 md:col-span-2 border-t-4 border-t-purple-500/30">
          <div className="flex items-center gap-2 text-purple-400 border-b border-white/5 pb-2">
            <CheckSquare className="w-4 h-4" />
            <h3 className="font-semibold text-sm uppercase tracking-wider">Resultado da Eliminação</h3>
          </div>
          
          {nominees.length === 0 ? (
            <div className="text-center py-6 text-slate-600 text-sm">
              Defina o paredão acima para habilitar a eliminação.
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
              {nominees.map(nom => {
                const p = activePlayers.find(ap => ap.id === nom.playerId);
                const eliminated = isEliminated(nom.playerId);
                return (
                  <button
                    key={nom.playerId}
                    onClick={() => toggleEliminated(nom.playerId)}
                    className={`p-4 rounded-xl border transition-all duration-300 flex items-center justify-between group ${
                      eliminated
                        ? 'bg-purple-600/20 border-purple-500/50 text-white shadow-[0_0_15px_rgba(147,51,234,0.15)]'
                        : 'bg-slate-900/40 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 border border-white/10">
                          {p?.avatarUrl && <img src={p.avatarUrl} className="w-full h-full object-cover scale-150 translate-y-1" alt="" />}
                       </div>
                       <span className="font-semibold">{p?.name}</span>
                    </div>
                    <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${eliminated ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-600 group-hover:bg-slate-700'}`}>
                       {eliminated ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-6 left-0 right-0 px-4 md:px-0 flex justify-center z-50 pointer-events-none">
        <div className="pointer-events-auto max-w-md w-full shadow-2xl shadow-black/80">
          <Button 
            onClick={handleSubmit} 
            fullWidth 
            className="py-4 text-lg font-bold tracking-wide"
            disabled={!challengeName || nominees.length === 0 || eliminatedIds.length === 0}
          >
            <Save className="w-5 h-5" />
            Confirmar Rodada
            <ArrowRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};