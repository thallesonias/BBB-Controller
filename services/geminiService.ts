import { GoogleGenAI } from "@google/genai";
import { Player, RoundLog } from "../types";

export const generateFinalSpeech = async (
  finalists: Player[],
  history: RoundLog[],
  allPlayers: Player[]
): Promise<string> => {
  try {
    if (!process.env.API_KEY) {
      console.error("ERRO CRÍTICO: Chave da API (process.env.API_KEY) não encontrada. Verifique se o arquivo .env ou a configuração de ambiente está correta.");
      return "Erro: Chave da API do Google Gemini não encontrada. Configure o ambiente e tente novamente.";
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Construct a narrative context
    const playerMap = new Map(allPlayers.map(p => [p.id, p.name]));
    
    const narrative = history.map(round => {
      const leaders = round.leaderIds && round.leaderIds.length > 0 
        ? round.leaderIds.map(id => playerMap.get(id)).join(" e ")
        : "Ninguém";
      
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
      - Líder(es): ${leaders}
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
      
      Escreva o discurso final para esta edição.
      
      DIRETRIZES RÍGIDAS DE FORMATAÇÃO E CONTEÚDO:
      1. NÃO USE MARKDOWN. NÃO use asteriscos (*), nem underscores (_) para negrito ou itálico. O texto deve ser limpo.
      2. SEJA BREVE na introdução e nos comentários gerais sobre a temporada.
      3. FOQUE TOTALMENTE NOS FINALISTAS: A parte detalhada e profunda do discurso deve ser EXCLUSIVAMENTE sobre a trajetória pessoal de ${finalistNames}. Cite suas vitórias, quantas vezes voltaram do paredão e suas rivalidades específicas.
      4. O TOM deve ser solene mas celebrativo.
      5. FAÇA SUSPENSE. Construa a tensão até o final do texto.
      6. MUITO IMPORTANTE: NÃO ANUNCIE O VENCEDOR. O discurso deve terminar criando o clímax final, mas NÃO deve conter o nome de quem ganhou, pois a decisão será feita pelo apresentador ao vivo após ler o texto. Encerre o texto preparando o terreno para o anúncio.
    `;

    // Removed manual thinkingBudget to allow the model to self-regulate and avoid errors
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt
    });

    return response.text || "Erro ao gerar discurso. Tente novamente.";
  } catch (error) {
    console.error("Error generating speech:", error);
    return `Ocorreu um erro ao conectar com a IA: ${error instanceof Error ? error.message : "Erro desconhecido"}. Verifique o console para mais detalhes.`;
  }
};