import React, { useState } from 'react';
import { Player, RoundLog } from '../types';
import { generateFinalSpeech } from '../services/geminiService';
import { Button } from './Button';
import { Sparkles, RefreshCw, Copy, Trophy, Star, Download, LogOut } from 'lucide-react';

interface FinalScreenProps {
  finalists: Player[];
  allPlayers: Player[];
  history: RoundLog[];
  onRestart: () => void;
}

export const FinalScreen: React.FC<FinalScreenProps> = ({ finalists, allPlayers, history, onRestart }) => {
  const [speech, setSpeech] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const text = await generateFinalSpeech(finalists, history, allPlayers);
    setSpeech(text);
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(speech);
    alert("Discurso copiado!");
  };

  const handleEndSeasonAndSave = () => {
    // 1. Compile Current Season Data
    const winner = finalists.find(f => f.status === 'WINNER') || finalists[0]; // Assuming active players at end are winners/finalists
    
    const currentSeasonData = {
      seasonId: Date.now(),
      date: new Date().toLocaleString('pt-BR'),
      winner: winner.name,
      finalists: finalists.map(f => f.name),
      totalRounds: history.length,
      players: allPlayers.map(p => ({
        name: p.name,
        status: p.status,
        stats: {
           leaderships: history.filter(r => r.leaderIds.includes(p.id)).length,
           walls: history.filter(r => r.nominees.some(n => n.playerId === p.id)).length
        }
      })),
      roundHistory: history
    };

    // 2. Load Existing History & Append
    const storageKey = 'habbo_bbb_full_history';
    let fullHistory = [];
    try {
      const existing = localStorage.getItem(storageKey);
      if (existing) {
        fullHistory = JSON.parse(existing);
      }
    } catch (e) {
      console.error("Error reading history", e);
    }
    
    fullHistory.push(currentSeasonData);
    localStorage.setItem(storageKey, JSON.stringify(fullHistory));

    // 3. Update Known Players (for autofill)
    const playersKey = 'habbo_bbb_known_players';
    let knownPlayers: string[] = [];
    try {
      const existingPlayers = localStorage.getItem(playersKey);
      if (existingPlayers) {
        knownPlayers = JSON.parse(existingPlayers);
      }
    } catch (e) { console.error(e); }

    const newPlayerNames = allPlayers.map(p => p.name);
    const updatedKnownPlayers = Array.from(new Set([...knownPlayers, ...newPlayerNames])).sort();
    localStorage.setItem(playersKey, JSON.stringify(updatedKnownPlayers));

    // 4. Trigger Download
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullHistory, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `habbo_bbb_historico_geral.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    // 5. Restart
    onRestart();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fade-in pb-20">
      <div className="text-center space-y-2 pt-10">
        <h1 className="text-6xl md:text-8xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-orange-400 to-red-600 drop-shadow-[0_0_30px_rgba(251,146,60,0.3)] animate-scale-in">
          FINAL
        </h1>
        <p className="text-2xl text-slate-300 font-light tracking-wide">
          O momento decisivo chegou.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-6 perspective-1000">
        {finalists.map((f, idx) => (
          <div 
            key={f.id} 
            className="group relative w-full md:w-64 aspect-[3/4] rounded-2xl overflow-hidden transition-all duration-500 hover:transform hover:-translate-y-2 hover:shadow-[0_0_40px_rgba(234,179,8,0.3)] animate-slide-up"
            style={{ animationDelay: `${idx * 150}ms` }}
          >
             {/* Card Bg */}
             <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 group-hover:border-yellow-500/50 transition-colors"></div>
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
             
             <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 p-[2px] mb-6 shadow-xl relative overflow-hidden">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                    {f.avatarUrl ? (
                      <img src={f.avatarUrl} alt={f.name} className="w-full h-full object-cover scale-150 translate-y-4" />
                    ) : (
                      <span className="text-3xl font-bold text-yellow-500">{f.name.charAt(0)}</span>
                    )}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{f.name}</h3>
                <div className="flex items-center gap-1 text-yellow-400 text-sm font-medium uppercase tracking-widest">
                  <Star className="w-3 h-3 fill-current" /> Finalista
                </div>
             </div>
          </div>
        ))}
      </div>

      <div className="space-y-6 max-w-3xl mx-auto">
        {!speech && (
          <div className="flex flex-col items-center justify-center p-12 glass-panel rounded-3xl border-dashed border-slate-700/50">
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse"></div>
                <Sparkles className="w-16 h-16 text-indigo-400 relative z-10" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Gerar Discurso Épico</h3>
            <p className="text-slate-400 text-center max-w-md mb-8 leading-relaxed">
              Deixe a IA analisar toda a jornada, as lideranças, os paredões e as rivalidades para coroar o vencedor.
            </p>
            <Button onClick={handleGenerate} disabled={loading} className="px-10 py-4 text-lg font-bold shadow-[0_0_20px_rgba(79,70,229,0.3)]">
              {loading ? (
                <span className="flex items-center gap-2">
                   <RefreshCw className="w-5 h-5 animate-spin" /> Conectando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                   <Sparkles className="w-5 h-5" /> Criar Discurso da Final
                </span>
              )}
            </Button>
          </div>
        )}

        {speech && (
          <div className="glass-panel border-indigo-500/20 rounded-2xl p-8 relative shadow-2xl animate-fade-in">
            <div className="absolute top-4 right-4 flex gap-2 z-20">
              <button onClick={copyToClipboard} className="p-2 text-slate-400 hover:text-white bg-slate-800/80 rounded-lg hover:bg-indigo-500 transition-colors" title="Copiar">
                <Copy className="w-5 h-5" />
              </button>
              <button onClick={handleGenerate} className="p-2 text-slate-400 hover:text-white bg-slate-800/80 rounded-lg hover:bg-indigo-500 transition-colors" title="Gerar Novamente">
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-3 text-indigo-400 font-bold mb-8 text-sm uppercase tracking-widest opacity-80 border-b border-indigo-500/10 pb-4">
              <Sparkles className="w-4 h-4" /> Discurso Oficial
            </div>
            
            <div className="prose prose-invert prose-lg max-w-none text-slate-200 leading-relaxed font-sans">
               <div className="whitespace-pre-line">{speech}</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center pt-8 pb-8 gap-4">
        <Button onClick={onRestart} variant="ghost" className="text-slate-500 hover:text-white hover:bg-white/5">
          <RefreshCw className="w-4 h-4" /> Apenas Reiniciar
        </Button>
        <Button onClick={handleEndSeasonAndSave} variant="success" className="shadow-lg shadow-emerald-500/20">
          <Download className="w-4 h-4" /> Encerrar Edição & Baixar Histórico
        </Button>
      </div>
    </div>
  );
};