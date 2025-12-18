import { GoogleGenAI } from "@google/genai";
import { Player, RoundLog } from "../types";

export const generateFinalSpeech = async (
  finalists: Player[],
  history: RoundLog[],
  allPlayers: Player[]
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Construct a narrative context
    const playerMap = new Map(allPlayers.map(p => [p.id, p.name]));
    
    const narrative = history.map(round => {
      const leader = round.leaderId ? playerMap.get(round.leaderId) : "Ninguém";
      
      const eliminatedNames = round.eliminatedIds.length > 0
        ? round.eliminatedIds.map(id => playerMap.get(id)).join(", ")
        : "Ninguém";
        
      const nominees = round.nominees.map(n => {
         const name = playerMap.get(n.playerId);
         let details = `Motivo: ${n.reason}`;
         if (n.nominatedBy) details += ` (Puxado por: ${playerMap.get(n.nominatedBy)})`;
         if (n.voteCount !== undefined) details += `, ${n.voteCount} votos`;
         if (n.isOpenVote) details += ` (Voto Aberto na sala)`;
         if (n.isReverseVote) details += ` (Voto Reverso/Para Salvar)`;
         return `${name} [${details}]`;
      }).join(", ");
      
      const otherVotes = round.otherVotes && round.otherVotes.length > 0
        ? round.otherVotes.map(ov => `${playerMap.get(ov.playerId)} (${ov.count} votos)`).join(", ")
        : "Nenhum outro voto registrado";

      const vetoed = round.vetoedIds && round.vetoedIds.length > 0 
        ? round.vetoedIds.map(id => playerMap.get(id)).join(", ")
        : "Ninguém";
      
      return `Semana ${round.roundNumber}:
      - Prova Realizada: ${round.challengeName}
      - Líder: ${leader}
      - Vetados da Prova: ${vetoed}
      - Paredão: ${nominees}
      - Outros votos da casa (escaparam do paredão): ${otherVotes}
      - Eliminado(s): ${eliminatedNames}`;
    }).join("\n\n");

    const finalistNames = finalists.map(f => f.name).join(" e ");

    const prompt = `
      Aja como o apresentador de um reality show estilo Big Brother Brasil (BBB).
      Estamos na grande final. Os finalistas são: ${finalistNames}.
      
      Aqui está o histórico completo da temporada:
      ${narrative}
      
      Escreva um discurso emocionante, dramático e poético para anunciar o vencedor. 
      
      Diretrizes:
      1. Use os dados! Cite quem escapou do paredão por pouco (olhe os "Outros votos"), quem foi puxado em contra-golpes (cite quem puxou para criar rivalidade na narrativa), quem foi perseguido em votos abertos.
      2. Analise a trajetória: quem foi muito ao paredão? Quem foi muito líder?
      3. Faça suspense. Não anuncie o vencedor logo de cara, deixe para a última linha.
      4. O tom deve ser solene mas celebrativo.
      5. Use formatação Markdown para negrito e itálico onde apropriado.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Erro ao gerar discurso. Tente novamente.";
  } catch (error) {
    console.error("Error generating speech:", error);
    return "Ocorreu um erro ao conectar com a IA para gerar o discurso. Verifique sua chave de API.";
  }
};