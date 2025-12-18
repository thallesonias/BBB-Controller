import React, { useState } from 'react';
import { UserPlus, Users, Trash2, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { Player } from '../types';

interface PlayerSetupProps {
  onStartGame: (players: Player[]) => void;
}

export const PlayerSetup: React.FC<PlayerSetupProps> = ({ onStartGame }) => {
  const [names, setNames] = useState<string>('');
  const [playerList, setPlayerList] = useState<Player[]>([]);

  const getAvatarUrl = (username: string) => {
    return `https://www.habbo.com.br/habbo-imaging/avatarimage?&user=${encodeURIComponent(username)}&action=std&direction=3&head_direction=3&img_format=png&gesture=sml&headonly=1&size=l`;
  };

  const handleAdd = () => {
    if (!names.trim()) return;
    
    // Split by comma or new line to allow bulk add
    const newNames = names.split(/[\n,]+/).map(n => n.trim()).filter(n => n.length > 0);
    
    // Check for duplicates
    const existingNames = new Set(playerList.map(p => p.name.toLowerCase()));
    const uniqueNewPlayers: Player[] = [];
    
    newNames.forEach(name => {
      if (!existingNames.has(name.toLowerCase())) {
         uniqueNewPlayers.push({
            id: crypto.randomUUID(),
            name,
            status: 'ACTIVE',
            avatarUrl: getAvatarUrl(name)
         });
      }
    });

    setPlayerList(prev => [...prev, ...uniqueNewPlayers]);
    setNames('');
  };

  const handleRemove = (id: string) => {
    setPlayerList(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-slide-up">
      <div className="text-center space-y-4">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse-slow"></div>
          <div className="relative bg-slate-800/50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/30 backdrop-blur-sm">
            <Users className="w-10 h-10 text-indigo-400" />
          </div>
        </div>
        
        <h2 className="text-4xl font-display font-bold text-white tracking-tight">
          Quem vai para o <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Paredão?</span>
        </h2>
        <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
          Adicione os nicks dos participantes do Habbo para começar o controle da temporada.
        </p>
      </div>

      <div className="glass-panel p-1 rounded-2xl shadow-2xl shadow-black/50">
        <div className="bg-slate-900/50 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 ml-1">
              Lista de Participantes
            </label>
            <textarea
              value={names}
              onChange={(e) => setNames(e.target.value)}
              placeholder="Digite os nicks aqui (separe por vírgula ou Enter)..."
              className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none min-h-[120px] placeholder-slate-600 resize-none text-sm"
            />
          </div>
          <Button onClick={handleAdd} fullWidth disabled={!names.trim()}>
            <UserPlus className="w-4 h-4" />
            Adicionar à Casa
          </Button>
        </div>
      </div>

      {playerList.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center text-slate-400 px-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
              <span className="text-sm font-medium">{playerList.length} participantes</span>
            </div>
            <button 
              onClick={() => setPlayerList([])} 
              className="text-xs text-red-400 hover:text-red-300 hover:underline transition-colors"
            >
              Limpar lista
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {playerList.map((player, idx) => (
              <div 
                key={player.id} 
                className="glass-card p-2 rounded-xl flex justify-between items-center group animate-scale-in"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-white/5 overflow-hidden shrink-0">
                    {player.avatarUrl ? (
                      <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover scale-150 translate-y-1" />
                    ) : (
                      <span className="text-xs font-bold text-slate-300">{player.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="font-medium text-slate-200 truncate text-sm">{player.name}</span>
                </div>
                <button 
                  onClick={() => handleRemove(player.id)}
                  className="text-slate-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-8 pb-4">
            <Button 
              onClick={() => onStartGame(playerList)} 
              fullWidth 
              className="py-4 text-lg shadow-xl shadow-indigo-900/20"
              disabled={playerList.length < 2}
            >
              <Sparkles className="w-5 h-5 animate-pulse" />
              Iniciar Reality Show
            </Button>
            {playerList.length < 2 && (
              <p className="text-center text-xs text-slate-500 mt-3 flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" /> Mínimo de 2 jogadores necessários
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};