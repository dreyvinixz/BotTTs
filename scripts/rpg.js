const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require("discord.js");
const { getCoins, addCoins, removeCoins } = require("./economy");
const { getGameMultiplier } = require("./boosts");
const { pedirRespostaAoOllama, limparResposta } = require("./ollama");
const { gerarImagemNoForge } = require("./image");
const { traduzirParaIngles } = require("./utils");
const { getPerguntaAleatoria } = require("./quizbank");

// Estado dos jogos em andamento (channelId -> estado)
const activeAventuras = new Map();

const THEMES = {
  geral: { name: "🧠 Conhecimentos Gerais", promptMod: "O tema da pergunta deve ser sobre cultura pop, filmes, música, fatos do dia a dia ou entretenimento." },
  historia: { name: "📜 História e Geografia", promptMod: "O tema da pergunta deve ser sobre eventos históricos importantes, figuras históricas, países, capitais ou curiosidades geográficas." },
  ciencia: { name: "🔬 Ciências e Exatas", promptMod: "O tema da pergunta deve ser sobre física, astronomia, biologia, química, matemática ou invenções tecnológicas." },
  geek: { name: "👾 Geek e Jogos", promptMod: "O tema da pergunta deve ser sobre videogames, tecnologia, animes, HQ, ou cultura nerd em geral." },
  esportes: { name: "⚽ Esportes", promptMod: "O tema da pergunta deve ser sobre futebol, olimpíadas, recordes esportivos, atletas ou regras de esportes." },
  musica: { name: "🎵 Música", promptMod: "O tema da pergunta deve ser sobre instrumentos musicais, compositores, gêneros, bandas ou teoria musical." },
  filmes: { name: "🎬 Filmes e Séries", promptMod: "O tema da pergunta deve ser sobre filmes, séries de TV, diretores, atores ou premiações do cinema." }
};

const DIFFICULTIES = {
  facil: { name: "Fácil", win: 40, lose: 0, promptMod: "A pergunta deve ser EXTREMAMENTE FÁCIL e óbvia. Nível ensino fundamental." },
  medio: { name: "Médio", win: 80, lose: 20, promptMod: "A pergunta deve ter dificuldade média. Nível de conhecimentos normais." },
  dificil: { name: "Difícil", win: 150, lose: 60, promptMod: "A pergunta deve ser muito difícil e específica. Nível de vestibular ou especialista." },
  infernal: { name: "Infernal", win: 300, lose: 150, promptMod: "Seja cruel e capcioso. A pergunta deve ser quase impossível, um detalhe minúsculo ou uma pegadinha." }
};

async function handleAventuraCommand(message) {
  const channelId = message.channel.id;

  if (activeAventuras.has(channelId)) {
    return message.reply("Já existe uma aventura acontecendo neste canal! Termine a atual primeiro.");
  }

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('rpg_mode_improviso')
        .setLabel('🎭 Improviso (Escrita)')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('rpg_mode_enigma')
        .setLabel('🧠 Show do Milhão (Trivia)')
        .setStyle(ButtonStyle.Success)
    );

  const sentMessage = await message.reply({
    content: `🌌 **O MULTIVERSO DA LOUCURA** 🌌\n\nEscolha qual modo vocês querem jogar no canal:\n\n**1. Improviso:** A IA cria o cenário e VOCÊS escrevem as ações. As melhores respostas ganham pontos!\n**2. Show do Milhão (Trivia):** A IA atua como apresentador de Trivia, gerando uma dica visual e uma pergunta para vocês acertarem!`,
    components: [row]
  });

  // Salvar no estado para ouvir o clique inicial
  activeAventuras.set(channelId, {
    type: 'menu',
    messageId: sentMessage.id
  });
}

async function handleRpgInteraction(interaction) {
  const channelId = interaction.channelId;
  const state = activeAventuras.get(channelId);
  if (!state) return;

  // Lógica de Modais (Improviso)
  if (interaction.isModalSubmit() && interaction.customId === 'rpg_imp_modal') {
    if (state.type === 'improviso_writing') {
      const input = interaction.fields.getTextInputValue('rpg_imp_input');
      state.respostas.set(interaction.user.id, input);
      return interaction.reply({ content: `✅ Sua ação foi enviada secretamente!`, flags: MessageFlags.Ephemeral });
    }
    return;
  }

  // Restante exige que seja botão
  if (!interaction.isButton()) return;
  const customId = interaction.customId;
  if (!customId.startsWith('rpg_')) return;

  if (state.type === 'menu') {
    if (customId === 'rpg_mode_improviso') {
      state.type = 'rounds';
      state.selectedMode = customId;

      const rowRounds = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('rpg_rounds_1').setLabel('1 Rodada').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('rpg_rounds_3').setLabel('3 Rodadas').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('rpg_rounds_5').setLabel('5 Rodadas').setStyle(ButtonStyle.Danger)
      );

      return interaction.update({
        components: [rowRounds],
        content: `🌌 Modo **Improviso** selecionado!\n\nQuantas rodadas vamos jogar para definir o campeão?`
      });
    }
    
    if (customId === 'rpg_mode_enigma') {
      state.type = 'theme';
      state.selectedMode = customId;

      const rowTheme1 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder().setCustomId('rpg_theme_geral').setLabel('🧠 Geral').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('rpg_theme_historia').setLabel('📜 História/Geo').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('rpg_theme_ciencia').setLabel('🔬 Ciências').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('rpg_theme_geek').setLabel('👾 Geek/Jogos').setStyle(ButtonStyle.Danger)
        );
      const rowTheme2 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder().setCustomId('rpg_theme_esportes').setLabel('⚽ Esportes').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('rpg_theme_musica').setLabel('🎵 Música').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('rpg_theme_filmes').setLabel('🎬 Filmes/Séries').setStyle(ButtonStyle.Danger)
        );

      return interaction.update({
        components: [rowTheme1, rowTheme2],
        content: `🌌 Modo **Show do Milhão (Trivia)** selecionado!\n\nAgora escolha o **TEMA** da pergunta:`
      });
    }
  }

  // Menu de Rodadas (Improviso)
  if (state.type === 'rounds' && customId.startsWith('rpg_rounds_')) {
    const nRounds = parseInt(customId.split('_')[2], 10);
    await interaction.update({ components: [], content: `🔥 Modo Improviso com **${nRounds} Rodada(s)** selecionado!\nPreparando o palco do caos interdimensional...` });
    return iniciarTurnoImproviso(channelId, interaction.channel, nRounds, 1, new Map());
  }

  // Menu de Tema (Enigma)
  if (state.type === 'theme' && customId.startsWith('rpg_theme_')) {
    const themeKey = customId.split('_')[2];
    state.selectedTheme = THEMES[themeKey];
    state.selectedThemeKey = themeKey;
    state.type = 'difficulty';

    const rowDiff = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('rpg_diff_facil').setLabel('Fácil').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('rpg_diff_medio').setLabel('Médio').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('rpg_diff_dificil').setLabel('Difícil').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('rpg_diff_infernal').setLabel('Infernal').setStyle(ButtonStyle.Secondary)
      );

    return interaction.update({
      components: [rowDiff],
      content: `🌌 Tema **${state.selectedTheme.name}** selecionado!\n\nAgora escolha o **NÍVEL DA DIFICULDADE**: (Cuidado com o Infernal, ele arranca moedas se você errar!)`
    });
  }

  if (state.type === 'difficulty' && customId.startsWith('rpg_diff_')) {
    const diffKey = customId.split('_')[2];
    const diffObj = DIFFICULTIES[diffKey];
    state.type = 'generating';
    
    await interaction.update({ components: [], content: `🔥 Tema **${state.selectedTheme.name}** | Dificuldade **${diffObj.name}** selecionada!\nPreparando a viagem interdimensional...` });
    return iniciarModoEnigma(channelId, interaction.channel, state.selectedTheme, diffObj, state.selectedThemeKey, diffKey);
  }

  // Jogando Enigma
  if (state.type === 'enigma_playing' && customId.startsWith('rpg_enigma_')) {
    const resposta = parseInt(customId.split('_')[2], 10);
    if (!state.votos.has(interaction.user.id)) {
      state.votos.set(interaction.user.id, resposta);
      return interaction.reply({ content: `Seu palpite foi registrado! 🤫`, flags: MessageFlags.Ephemeral });
    } else {
      return interaction.reply({ content: `Você já votou! Aguarde o resultado.`, flags: MessageFlags.Ephemeral });
    }
  }

  // Jogando Improviso (Pedir para escrever)
  if (state.type === 'improviso_writing' && customId === 'rpg_imp_write') {
    const modal = new ModalBuilder()
      .setCustomId('rpg_imp_modal')
      .setTitle('Sua Ação Escapista');
      
    const txtInput = new TextInputBuilder()
      .setCustomId('rpg_imp_input')
      .setLabel('O que você faz?')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(100)
      .setRequired(true)
      .setPlaceholder('Escreva sua atitude bizarra aqui...');
      
    modal.addComponents(new ActionRowBuilder().addComponents(txtInput));
    return interaction.showModal(modal);
  }

  // Jogando Improviso (Votação)
  if (state.type === 'improviso_voting' && customId.startsWith('rpg_imp_vote_')) {
    const voteId = customId.split('_')[3]; // ex: A, B, C
    
    // Self-voting is now allowed!
    
    if (!state.votos.has(interaction.user.id)) {
      state.votos.set(interaction.user.id, voteId);
      return interaction.reply({ content: `✅ Voto registrado na opção ${voteId}!`, flags: MessageFlags.Ephemeral });
    } else {
      return interaction.reply({ content: `Você já votou! Aguarde.`, flags: MessageFlags.Ephemeral });
    }
  }
}

// ==========================================
// MODO 1: IMPROVISO (ESTILO JACKBOX)
// ==========================================
async function iniciarTurnoImproviso(channelId, channel, maxRounds, currentRound, globalScores) {
  activeAventuras.set(channelId, { type: 'generating' });

  let nomesParaZoeira = "os jogadores do chat";
  if (channel.isTextBased() && channel.guild) {
     const members = Array.from(channel.members.values()).filter(m => !m.user.bot).map(m => m.user.username);
     if (members.length > 0) {
        // Pega até 5 nomes aleatórios para não poluir muito
        const shuffled = members.sort(() => 0.5 - Math.random()).slice(0, 5);
        nomesParaZoeira = shuffled.join(", ");
     }
  }

  const promptOllama = `
Você é o mestre de um jogo de improviso no estilo Jackbox Party.
Seu objetivo é focar em UM dos jogadores e criar uma fofoca divertida ou um MISTÉRIO leve do cotidiano, onde o final está faltando para os outros jogadores inventarem.
Priorize situações curiosas, engraçadas e embaraçosas do dia a dia (evite coisas extremamente absurdas ou surreais).

Exemplos de ESTILO (NÃO COPIE ELES, CRIE UM CENÁRIO 100% INÉDITO AGORA):
- "[Nome] foi pego escondendo algo no escritório do chefe. O que ele estava escondendo?"
- "[Nome] mandou uma mensagem no grupo da família e apagou correndo. O que estava escrito?"
- "[Nome] tropeçou na rua e deixou cair algo muito constrangedor da mochila. O que era?"

(ESCOLHA APENAS UM destes nomes para ser a vítima da rodada: ${nomesParaZoeira}).

REGRAS CRÍTICAS:
1. SEJA CRIATIVO! Crie uma situação completamente nova, simples e do cotidiano.
2. NUNCA REVELE O SEGREDO! Deixe o motivo, a ação ou o objeto em aberto para os jogadores inventarem!
3. SEJA BREVE! O cenário deve ter no máximo 2 frases curtas.
4. Termine SEMPRE o cenário com uma pergunta (Ex: "O que era?", "O que ele fez?", "Por quê?").
5. Pare de escrever IMEDIATAMENTE após a pergunta. Não dê respostas!
6. Retorne EXATAMENTE o formato abaixo e não adicione mais nenhum texto:

PROMPT_IMAGEM: [Prompt em inglês divertido para o Stable Diffusion. ATENÇÃO: NÃO use o nome da pessoa aqui! Use "a funny guy", "a person". Ex: funny meme, guy doing something stupid]
CENARIO: [O texto curto da zoeira em português, citando o nome do jogador e terminando com a pergunta em aberto]
  `.trim();

  try {
    const msg = await channel.send(`📜 (Rodada ${currentRound}/${maxRounds}) A IA está abrindo um novo Universo...`);
    const resposta = await pedirRespostaAoOllama(
      [{ role: "user", content: promptOllama }],
      { usarPoliticasDono: false, generationOptions: { num_predict: 400 } }
    );
    const resLimpa = limparResposta(resposta).replace(/```.*/g, "");

    const pImgMatch = resLimpa.match(/(?:PROMPT)[A-Z_ ]*:\s*(?:\*\*)?\s*([^\n]+)/i);
    let promptImg = pImgMatch ? pImgMatch[1].trim() : "absurd hilarious situation, weird meme, masterpiece";

    const cenMatch = resLimpa.match(/(?:CEN[AÁ]RIO|CENARIO|SCENARIO)[A-Z_ ]*:\s*(?:\*\*)?\s*([\s\S]*)/i);
    let cenario = "";

    if (cenMatch) {
       cenario = cenMatch[1].split(/PROMPT/i)[0].trim();
    } else {
       console.warn("⚠️ A IA esqueceu a tag CENARIO. Usando extrator por exclusão.");
       // O cenário é tudo o que sobrar depois de apagar a linha do prompt de imagem
       cenario = resLimpa.replace(/(?:PROMPT)[A-Z_ ]*:\s*(?:\*\*)?\s*[^\n]+/i, "").trim();
    }

    if (!cenario) cenario = "Uma fofoca inexplicável aconteceu, mas os registros foram apagados. O que foi?";

    // Pinta a imagem do cenário no background
    const attachment = await gerarImagemNoForge(promptImg, false);
    const endTimeWrite = Math.floor(Date.now() / 1000) + 45;

    const rowWrite = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('rpg_imp_write').setLabel('📝 Escrever Resposta Secreta').setStyle(ButtonStyle.Success)
    );

    await msg.delete().catch(() => null);
    const survMsg = await channel.send({
      content: `🌌 **IMPROVISO - RODADA ${currentRound}** 🌌\n\n${cenario}\n\n⏳ **TEMPO PARA ESCREVER:** <t:${endTimeWrite}:R>\nClique no botão abaixo para digitar sua ação anonimamente!`,
      files: [attachment],
      components: [rowWrite]
    });

    activeAventuras.set(channelId, {
      type: 'improviso_writing',
      respostas: new Map(), // userId -> text
      promptImg, cenario
    });

    // FASE DE ESCRITA: 45 SEGUNDOS
    setTimeout(async () => {
      const stateWrite = activeAventuras.get(channelId);
      if (!stateWrite || stateWrite.type !== 'improviso_writing') return;

      await survMsg.edit({ 
         content: `🌌 **IMPROVISO - RODADA ${currentRound}** 🌌\n\n${cenario}\n\n🛑 **TEMPO DE ESCRITA ESGOTADO!**`, 
         components: [] 
      }).catch(() => null);

      if (stateWrite.respostas.size === 0) {
        activeAventuras.delete(channelId);
        return channel.send("Ninguém escreveu nada! A inércia consumiu todos vocês. Fim de jogo.");
      }

      // Embaralhar respostas e atribuir letras (A, B, C...)
      const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      const answerAuthors = {}; // letter -> userId
      const letterToText = {}; // letter -> text
      
      let index = 0;
      let textLines = "";
      const rowVote = new ActionRowBuilder();

      stateWrite.respostas.forEach((text, userId) => {
        if (index >= 5) return; // Limitar a max 5 botões numa action row por simplicidade
        const L = letras[index];
        answerAuthors[L] = userId;
        letterToText[L] = text;
        textLines += `> 🟢 **OPÇÃO ${L}** \n> *"${text}"*\n\n`;
        
        rowVote.addComponents(
          new ButtonBuilder().setCustomId(`rpg_imp_vote_${L}`).setLabel(`Opção ${L}`).setStyle(ButtonStyle.Primary)
        );
        index++;
      });

      const endTimeVote = Math.floor(Date.now() / 1000) + 30;

      const voteMsg = await channel.send({
        content: `🚨 **FIM DO TEMPO! AQUI ESTÃO AS IDEIAS:** 🚨\n\n${textLines}\n⏳ **VOTAÇÃO ENCERRA EM:** <t:${endTimeVote}:R>\n*Vote na melhor ação! Votar em si mesmo é permitido (e até encorajado pela zoeira).*`,
        components: [rowVote]
      });

      activeAventuras.set(channelId, {
        type: 'improviso_voting',
        votos: new Map(), // userId -> letter
        answerAuthors, letterToText, promptImg, cenario,
        totalAnswers: Object.keys(answerAuthors).length
      });

      // FASE DE VOTAÇÃO: 30 SEGUNDOS
      setTimeout(async () => {
        const stateVote = activeAventuras.get(channelId);
        if (!stateVote || stateVote.type !== 'improviso_voting') return;
        
        await voteMsg.edit({ content: `🛑 **VOTAÇÃO ENCERRADA!**`, components: [] }).catch(() => null);

        // Apurar votos
        const count = {};
        let totalVotes = 0;
        stateVote.votos.forEach((letter) => {
          count[letter] = (count[letter] || 0) + 1;
          totalVotes++;
        });

        if (totalVotes === 0) {
          activeAventuras.delete(channelId);
          return channel.send("Ninguém votou! Vocês ficaram discutindo até o apocalipse chegar. Fim de jogo.");
        }

        let maxVotes = 0;
        Object.values(count).forEach(v => {
           if (v > maxVotes) maxVotes = v;
        });

        // Encontrar todos com o máximo de votos (para caso de empate)
        const empatados = Object.keys(count).filter(letra => count[letra] === maxVotes);
        
        // Se houver empate, escolhe um aleatoriamente para ser a "ação concretizada" da rodada
        let winnerLetter = empatados[Math.floor(Math.random() * empatados.length)];
        let winnerText = stateVote.letterToText[winnerLetter];
        let winnerId = stateVote.answerAuthors[winnerLetter];

        // Atualizar score global de TODOS os que empataram
        empatados.forEach(letra => {
           const id = stateVote.answerAuthors[letra];
           const oldScore = globalScores.get(id) || 0;
           globalScores.set(id, oldScore + 5);
        });

        // Construir string de resultados detalhada
        let resultados = `⏰ **VOTAÇÃO ENCERRADA!** Aqui estão os autores:\n\n`;
        Object.keys(stateVote.answerAuthors).forEach(letra => {
           const autor = stateVote.answerAuthors[letra];
           const numVotos = count[letra] || 0;
           const textoId = stateVote.letterToText[letra];
           resultados += `**Opção ${letra}** (${numVotos} votos) -> <@${autor}>\n*"${textoId}"*\n\n`;
        });

        if (empatados.length > 1) {
           const mensoesEmpate = empatados.map(l => `<@${stateVote.answerAuthors[l]}>`).join(" e ");
           resultados += `🏆 **HOUVE UM EMPATE!** Entre as opções ${empatados.join(", ")}!\n${mensoesEmpate} ganharam +5 pontos!\n*(A opção **${winnerLetter}** foi sorteada para continuar a história)*`;
        } else {
           resultados += `🏆 **A IDEIA VENCEDORA** foi a **${winnerLetter}**! <@${winnerId}> ganhou +5 pontos!`;
        }

        activeAventuras.set(channelId, { type: 'generating' });

        // Tenta pegar um GIF aleatório salvo no banco do bot para ilustrar a zoeira (opcional)
        let gifUrl = null;
        try {
           const fs = require('fs');
           const config = require('./config');
           if (fs.existsSync(config.GIFS_PATH)) {
              const gifsDb = JSON.parse(fs.readFileSync(config.GIFS_PATH));
              if (gifsDb && gifsDb.length > 0) {
                 gifUrl = gifsDb[Math.floor(Math.random() * gifsDb.length)];
              }
           }
        } catch(e) {}

        let resolMsg = `📸 **AÇÃO CONCRETIZADA:**\n"<@${winnerId}>: *${winnerText}*"\n\n`;

        if (currentRound < maxRounds) {
           resolMsg += `👉 Preparando a Rodada ${currentRound + 1}...`;
           const payload = { content: resultados + "\n\n" + resolMsg };
           if (gifUrl) payload.content += `\n${gifUrl}`;
           
           await channel.send(payload);
           setTimeout(() => {
             iniciarTurnoImproviso(channelId, channel, maxRounds, currentRound + 1, globalScores);
           }, 3000);
        } else {
           // FIM DE JOGO
           resolMsg += `🏆 **FIM DO JOGO!**\nO Multiverso (ou a reputação de vocês) está a salvo.\n\n**PLACAR FINAL:**\n`;
           
           const sorted = Array.from(globalScores.entries()).sort((a, b) => b[1] - a[1]);
           
           // Ajustar prêmios baseados na quantidade de rodadas para não quebrar a economia
           let premios = [50, 20, 10]; // Base para 1 rodada
           if (maxRounds === 3) premios = [150, 75, 25];
           if (maxRounds >= 5) premios = [300, 150, 50];
           
           for (let i = 0; i < sorted.length; i++) {
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🏅";
              resolMsg += `${medal} <@${sorted[i][0]}> - ${sorted[i][1]} Pontos`;
              
              if (i < 3) {
                 addCoins(sorted[i][0], premios[i]);
                 resolMsg += ` *(Ganhou ${premios[i]} Nanacoins 🪙!)*\n`;
              } else {
                 resolMsg += `\n`;
              }
           }
           
           activeAventuras.delete(channelId);
           const payload = { content: resultados + "\n\n" + resolMsg };
           if (gifUrl) payload.content += `\n${gifUrl}`;
           await channel.send(payload);
        }

      }, 30000);

    }, 45000);

  } catch (err) {
    console.error("Erro Improviso:", err);
    channel.send("O tecido do Multiverso rasgou na geração inicial. Tentem outra hora.");
    activeAventuras.delete(channelId);
  }
}

// ==========================================
// MODO 2: TRIVIA / SHOW DO MILHÃO
// ==========================================
async function iniciarModoEnigma(channelId, channel, themeObj, diffObj, themeKey, diffKey) {
  activeAventuras.set(channelId, { type: 'generating' });

  try {
    // Tenta pegar uma pergunta do banco pré-configurado primeiro
    const bancoQ = getPerguntaAleatoria(channelId, themeKey, diffKey);

    let pergunta, promptImg, verdadeira, f1, f2, f3;

    if (bancoQ) {
      // Usa pergunta do banco (rápido, confiável, sem dependência do Ollama)
      pergunta = bancoQ.p;
      promptImg = bancoQ.img;
      verdadeira = bancoQ.v;
      [f1, f2, f3] = bancoQ.f;
      console.log(`📋 [ShowDoMilhão] Usando pergunta do banco: "${pergunta}"`);
    } else {
      // Fallback: gera com Ollama se o banco não tiver perguntas para essa combinação
      console.log(`🤖 [ShowDoMilhão] Banco vazio para ${themeKey}/${diffKey}, usando Ollama...`);
      const promptOllama = `
Você é o apresentador de um jogo de conhecimentos gerais estilo Show do Milhão.
Diretriz de Tema: ${themeObj.promptMod}
Dificuldade solicitada: ${diffObj.promptMod}
Me retorne EXATAMENTE neste formato de 6 linhas e mais nada:

PERGUNTA: [O texto da pergunta em português (máximo 15 palavras)]
PROMPT_IMAGEM: [Prompt em INGLÊS detalhado para o Stable Diffusion gerar uma ilustração visual. NÃO inclua texto. Apenas arte ou cenários. NÃO gere pessoas ou rostos.]
VERDADEIRA: [1 resposta correta CURTA (máximo 5 palavras)]
FALSA_1: [1 resposta incorreta CURTA (máximo 5 palavras)]
FALSA_2: [1 resposta incorreta CURTA (máximo 5 palavras)]
FALSA_3: [1 resposta incorreta CURTA (máximo 5 palavras)]
      `.trim();

      const resposta = await pedirRespostaAoOllama(
        [{ role: "user", content: promptOllama }],
        { usarPoliticasDono: false, generationOptions: { num_predict: 400 } }
      );
      const resLimpa = limparResposta(resposta);

      const pMatch = resLimpa.match(/PERGUNTA:\s*([^\n]+)/i);
      const pImgMatch = resLimpa.match(/PROMPT_IMAGE[MN]?:\s*([^\n]+)/i);
      const vMatch = resLimpa.match(/VERDADEIR[A-Z_]*:\s*([^\n]+)/i);
      const f1Match = resLimpa.match(/FAL[A-Z_]*1:\s*([^\n]+)/i);
      const f2Match = resLimpa.match(/FAL[A-Z_]*2:\s*([^\n]+)/i);
      const f3Match = resLimpa.match(/FAL[A-Z_]*3:\s*([^\n]+)/i);

      pergunta = pMatch ? pMatch[1].trim() : "";
      promptImg = pImgMatch ? pImgMatch[1].trim() : "";
      verdadeira = vMatch ? vMatch[1].trim() : "";
      f1 = f1Match ? f1Match[1].trim() : "";
      f2 = f2Match ? f2Match[1].trim() : "";
      f3 = f3Match ? f3Match[1].trim() : "";

      if (!pergunta || !promptImg || !verdadeira || !f1 || !f2 || !f3) {
        console.log("Raw LLM:", resposta);
        throw new Error("A IA não seguiu a formatação exigida.");
      }
    }

    const msg = await channel.send("🎨 Preparando a pergunta e gerando a dica visual...");

    // Gerar imagem com prompt em inglês + anti-portrait negative
    let attachment;
    try {
      const fullPrompt = `${promptImg}, high quality, sharp detail, vibrant colors, professional photography, masterpiece, no text, no watermark`;
      const antiPortraitNegative = "woman, girl, man, boy, face, portrait, person, human face, selfie, headshot, asian, korean, japanese, close-up face";
      attachment = await gerarImagemNoForge(fullPrompt, false, antiPortraitNegative);
    } catch (imgErr) {
      console.error("Erro ao gerar imagem do Show do Milhão:", imgErr);
      attachment = null;
    }

    // Embaralhar opções
    const opcoes = [
      { texto: verdadeira, correta: true },
      { texto: f1, correta: false },
      { texto: f2, correta: false },
      { texto: f3, correta: false }
    ];
    opcoes.sort(() => Math.random() - 0.5);

    const corretaIndex = opcoes.findIndex(o => o.correta);

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('rpg_enigma_0').setLabel('Opção 1').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('rpg_enigma_1').setLabel('Opção 2').setStyle(ButtonStyle.Primary)
    );
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('rpg_enigma_2').setLabel('Opção 3').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('rpg_enigma_3').setLabel('Opção 4').setStyle(ButtonStyle.Primary)
    );

    let txtOpcoes = `> 🔵 **OPÇÃO 1:** *${opcoes[0].texto}*\n> 🔵 **OPÇÃO 2:** *${opcoes[1].texto}*\n> 🔵 **OPÇÃO 3:** *${opcoes[2].texto}*\n> 🔵 **OPÇÃO 4:** *${opcoes[3].texto}*`;

    const endTime = Math.floor(Date.now() / 1000) + 45;

    await msg.delete().catch(() => null);

    const sendPayload = {
      content: `🧠 **SHOW DO MILHÃO** 🧠\n📂 Tema: **${themeObj.name}** | 🎯 Dificuldade: **${diffObj.name}**\n\n**${pergunta}**\n\n${txtOpcoes}\n\n⏳ **O tempo se esgota em:** <t:${endTime}:R>`,
      components: [row1, row2]
    };
    if (attachment) sendPayload.files = [attachment];

    const enigmaMsg = await channel.send(sendPayload);

    activeAventuras.set(channelId, {
      type: 'enigma_playing',
      votos: new Map(), // userId -> opcaoIndex
      corretaIndex: corretaIndex
    });

    // Aguardar 45 segundos
    setTimeout(async () => {
      const state = activeAventuras.get(channelId);
      if (!state || state.type !== 'enigma_playing') return;

      activeAventuras.delete(channelId);

      await enigmaMsg.edit({
        components: [],
        content: `🧠 **SHOW DO MILHÃO** 🧠\n📂 Tema: **${themeObj.name}** | 🎯 Dificuldade: **${diffObj.name}**\n\n**${pergunta}**\n\n${txtOpcoes}\n\n⏳ **O tempo se esgotou!**`
      }).catch(() => null);

      let vencedoresArray = [];

      state.votos.forEach((voto, userId) => {
        if (voto === corretaIndex) {
          const mult = getGameMultiplier(userId);
          const reward = diffObj.win * mult;
          addCoins(userId, reward);
          const nameTag = mult > 1 ? `<@${userId}> *(x${mult} Boost = ${reward} 🪙)*` : `<@${userId}>`;
          vencedoresArray.push(nameTag);
        } else {
          if (diffObj.lose > 0) removeCoins(userId, diffObj.lose);
        }
      });

      let resultText = `⏰ **TEMPO ESGOTADO!**\n\nA resposta correta era a **Opção ${corretaIndex + 1}**: *${opcoes[corretaIndex].texto}*!\n\n`;

      if (vencedoresArray.length > 0) {
        resultText += `🎉 **ACERTARAM E GANHARAM (Base ${diffObj.win} 🪙):** ${vencedoresArray.join(', ')}`;
      } else {
        resultText += `💀 **TODO MUNDO ERROU!** Ninguém ganhou.`;
      }

      if (diffObj.lose > 0) {
        resultText += `\n*Nota: Quem errou perdeu ${diffObj.lose} Nanacoins por jogar na dificuldade ${diffObj.name}.*`;
      }

      channel.send(resultText);

    }, 45000);

  } catch (err) {
    console.error("Erro no Enigma:", err);
    channel.send("A IA alucinou forte demais e o portal do enigma quebrou. Tentem novamente.");
    activeAventuras.delete(channelId);
  }
}

module.exports = {
  handleAventuraCommand,
  handleRpgInteraction
};
