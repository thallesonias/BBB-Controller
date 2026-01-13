import React, { useState, useEffect } from 'react';
import { UserPlus, Users, Trash2, Sparkles, AlertCircle, History, Plus, Clock } from 'lucide-react';
import { Button } from './Button';
import { Player } from '../types';

interface PlayerSetupProps {
  onStartGame: (players: Player[], duration: number) => void;
}

export const PlayerSetup: React.FC<PlayerSetupProps> = ({ onStartGame }) => {
  const [names, setNames] = useState<string>('');
  const [playerList, setPlayerList] = useState<Player[]>([]);
  const [knownPlayers, setKnownPlayers] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [duration, setDuration] = useState<number>(60); // Default 1 hour
  const [cursorPosition, setCursorPosition] = useState<number>(0);

  useEffect(() => {
    // Load known players from LocalStorage
    const stored = localStorage.getItem('habbo_bbb_known_players');
    if (stored) {
      try {
        setKnownPlayers(JSON.parse(stored).sort((a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })));
      } catch (e) {
        console.error("Failed to parse known players", e);
      }
    }
  }, []);

  // Helper: Extract the current line being typed based on cursor position
  const getCurrentLine = (text: string, cursor: number) => {
    const before = text.substring(0, cursor);
    const after = text.substring(cursor);
    
    const start = before.lastIndexOf('\n') + 1;
    const endOffset = after.indexOf('\n');
    const end = endOffset === -1 ? text.length : cursor + endOffset;
    
    return {
      text: text.substring(start, end),
      start,
      end
    };
  };

  // Autocomplete logic - Cursor Aware
  useEffect(() => {
    if (!names) {
      setSuggestions([]);
      return;
    }
    
    const { text: currentLine } = getCurrentLine(names, cursorPosition);
    const trimmed = currentLine.trim().toLowerCase();

    // Trigger on 1+ characters
    if (trimmed.length > 0) {
      const matches = knownPlayers
        .filter(p => 
           p.toLowerCase().includes(trimmed) && 
           !playerList.some(pl => pl.name.toLowerCase() === p.toLowerCase())
        )
        .slice(0, 5); // Limit suggestions
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  }, [names, cursorPosition, knownPlayers, playerList]);

  const getAvatarUrl = (username: string) => {
    return `https://www.habbo.com.br/habbo-imaging/avatarimage?&user=${encodeURIComponent(username)}&action=std&direction=3&head_direction=3&img_format=png&gesture=sml&headonly=1&size=l`;
  };

  const handleAdd = () => {
    if (!names.trim()) return;
    
    // Split ONLY by new line
    const newNames = names.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    
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

    // Add and sort alphabetically
    setPlayerList(prev => [...prev, ...uniqueNewPlayers].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })));
    setNames('');
    setSuggestions([]);
  };

  const addKnownPlayer = (name: string) => {
    // Prevent duplicates in the current list
    if (playerList.some(p => p.name.toLowerCase() === name.toLowerCase())) return;
    
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name,
      status: 'ACTIVE',
      avatarUrl: getAvatarUrl(name)
    };
    // Add and sort
    setPlayerList(prev => [...prev, newPlayer].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })));
    setNames('');
  };

  const applySuggestion = (suggestion: string) => {
    const { start, end } = getCurrentLine(names, cursorPosition);
    const prefix = names.substring(0, start);
    const suffix = names.substring(end);
    
    // Insert suggestion. If at the end of text, add a newline automatically for speed.
    // If editing in middle, preserve existing structure.
    const isAtEnd = end === names.length;
    const newText = prefix + suggestion + (isAtEnd ? '\n' : '') + suffix;
    
    setNames(newText);
    setSuggestions([]);
    // Update cursor logic implicitly handled by next render/input
  };

  const handleRemove = (id: string) => {
    setPlayerList(prev => prev.filter(p => p.id !== id));
  };

  // Track cursor position for accurate autocomplete
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNames(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  const handleCursorMove = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    setCursorPosition(e.currentTarget.selectionStart);
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
        <div className="bg-slate-900/50 rounded-xl p-6 space-y-4 relative">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 ml-1">
              Lista de Participantes
            </label>
            <div className="relative">
               <textarea
                 value={names}
                 onChange={handleInput}
                 onClick={handleCursorMove}
                 onKeyUp={handleCursorMove}
                 placeholder="Digite os nicks aqui (um por linha)..."
                 className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none min-h-[120px] placeholder-slate-600 resize-none text-sm font-mono"
               />
               {/* Autocomplete Popup */}
               {suggestions.length > 0 && (
                 <div className="absolute left-0 bottom-full mb-1 bg-slate-800 border border-indigo-500/30 rounded-lg shadow-xl z-20 w-full max-w-[200px] overflow-hidden animate-scale-in">
                    <div className="text-[10px] uppercase bg-slate-900/80 p-1 px-2 text-indigo-400 font-bold tracking-wider">Sugestões</div>
                    {suggestions.map(s => (
                      <button 
                        key={s} 
                        onClick={() => applySuggestion(s)}
                        className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors flex items-center gap-2 border-b border-white/5 last:border-0"
                      >
                         <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                         {s}
                      </button>
                    ))}
                 </div>
               )}
            </div>
          </div>
          <Button onClick={handleAdd} fullWidth disabled={!names.trim()}>
            <UserPlus className="w-4 h-4" />
            Adicionar à Casa
          </Button>

          {/* Time Limit Setting */}
          <div className="pt-2 border-t border-white/5 flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Clock className="w-3 h-3" /> Meta de Tempo da Edição
            </label>
            <select 
              value={duration} 
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg p-2.5 text-white focus:border-indigo-500 outline-none text-sm"
            >
              <option value={60}>1 Hora (Rápido)</option>
              <option value={90}>1 Hora e 30 Minutos (Médio)</option>
              <option value={120}>2 Horas (Longo)</option>
            </select>
            <p className="text-[10px] text-slate-500">As sugestões de provas se adaptarão ao tempo restante.</p>
          </div>

          {/* Known Players List */}
          {knownPlayers.length > 0 && (
            <div className="pt-2 border-t border-white/5">
              <div className="flex items-center gap-2 text-slate-500 mb-2 text-xs uppercase font-bold tracking-wider">
                <History className="w-3 h-3" /> Conhecidos (Clique para adicionar)
              </div>
              <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto custom-scrollbar p-1">
                {knownPlayers
                  .filter(kp => !playerList.some(p => p.name.toLowerCase() === kp.toLowerCase())) // Only show not added
                  .map(kp => (
                    <button 
                      key={kp} 
                      onClick={() => addKnownPlayer(kp)}
                      className="text-xs bg-slate-800 border border-slate-700 hover:border-indigo-500 hover:text-indigo-300 text-slate-400 px-2 py-1 rounded flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-2.5 h-2.5" /> {kp}
                    </button>
                ))}
                {knownPlayers.filter(kp => !playerList.some(p => p.name.toLowerCase() === kp.toLowerCase())).length === 0 && (
                   <span className="text-xs text-slate-600 italic">Todos os conhecidos já foram adicionados.</span>
                )}
              </div>
            </div>
          )}
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
              onClick={() => onStartGame(playerList, duration)} 
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