const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { pedirRespostaAoOllama, limparResposta } = require("./ollama");
const { gerarImagemNoForge } = require("./image");
const { addCoins, removeCoins } = require("./economy");

// Estado dos jogos em andamento (channelId -> estado)
const activeAventuras = new Map();

const DIFFICULTIES = {
  facil: { name: "Fácil", win: 40, lose: 0, promptMod: "O cenário deve ser engraçado mas óbvio e fácil de resolver." },
  medio: { name: "Médio", win: 80, lose: 20, promptMod: "O cenário deve ter um nível normal de pegadinha." },
  dificil: { name: "Difícil", win: 150, lose: 60, promptMod: "O cenário deve ser muito complexo e difícil de deduzir." },
  infernal: { name: "Infernal", win: 300, lose: 150, promptMod: "Seja cruel. O cenário deve ser quase impossível, bizarro ao extremo e caótico." }
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
        .setLabel('🕵️‍♂️ Enigma Visual')
        .setStyle(ButtonStyle.Success)
    );

  const sentMessage = await message.reply({
    content: `🌌 **O MULTIVERSO DA LOUCURA** 🌌\n\nEscolha qual modo vocês querem jogar no canal:\n\n**1. Improviso:** A IA cria o cenário e VOCÊS escrevem as ações. As melhores respostas ganham pontos!\n**2. Enigma Visual:** A IA desenha uma bizarrice escondida e vocês têm que deduzir o que é!`,
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
      return interaction.reply({ content: `✅ Sua ação foi enviada secretamente!`, ephemeral: true });
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
      state.type = 'difficulty';
      state.selectedMode = customId;

      const rowDiff = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder().setCustomId('rpg_diff_facil').setLabel('Fácil').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('rpg_diff_medio').setLabel('Médio').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('rpg_diff_dificil').setLabel('Difícil').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('rpg_diff_infernal').setLabel('Infernal').setStyle(ButtonStyle.Secondary)
        );

      return interaction.update({
        components: [rowDiff],
        content: `🌌 Modo **Enigma Visual** selecionado!\n\nAgora escolha a Dificuldade do Multiverso:`
      });
    }
  }

  // Menu de Rodadas (Improviso)
  if (state.type === 'rounds' && customId.startsWith('rpg_rounds_')) {
    const nRounds = parseInt(customId.split('_')[2], 10);
    await interaction.update({ components: [], content: `🔥 Modo Improviso com **${nRounds} Rodada(s)** selecionado!\nPreparando o palco do caos interdimensional...` });
    return iniciarTurnoImproviso(channelId, interaction.channel, nRounds, 1, new Map());
  }

  // Menu de Dificuldade (Enigma)
  if (state.type === 'difficulty' && customId.startsWith('rpg_diff_')) {
    const diffKey = customId.split('_')[2];
    const diffObj = DIFFICULTIES[diffKey];
    
    await interaction.update({ components: [], content: `🔥 Dificuldade **${diffObj.name}** selecionada!\nPreparando a viagem interdimensional...` });
    return iniciarModoEnigma(channelId, interaction.channel, diffObj);
  }

  // Jogando Enigma
  if (state.type === 'enigma_playing' && customId.startsWith('rpg_enigma_')) {
    const resposta = parseInt(customId.split('_')[2], 10);
    if (!state.votos.has(interaction.user.id)) {
      state.votos.set(interaction.user.id, resposta);
      return interaction.reply({ content: `Seu palpite foi registrado! 🤫`, ephemeral: true });
    } else {
      return interaction.reply({ content: `Você já votou! Aguarde o resultado.`, ephemeral: true });
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
    
    // Impede votar em si mesmo (A MENOS que seja o único jogador, para permitir testes solo)
    if (state.answerAuthors[voteId] === interaction.user.id && state.totalAnswers > 1) {
      return interaction.reply({ content: `❌ Você não pode votar na sua própria resposta, espertinho!`, ephemeral: true });
    }
    
    if (!state.votos.has(interaction.user.id)) {
      state.votos.set(interaction.user.id, voteId);
      return interaction.reply({ content: `✅ Voto registrado na opção ${voteId}!`, ephemeral: true });
    } else {
      return interaction.reply({ content: `Você já votou! Aguarde.`, ephemeral: true });
    }
  }
}

// ==========================================
// MODO 1: IMPROVISO (ESTILO JACKBOX)
// ==========================================
async function iniciarTurnoImproviso(channelId, channel, maxRounds, currentRound, globalScores) {
  activeAventuras.set(channelId, { type: 'generating' });

  const promptOllama = `
Gere um cenário de perigo iminente incrivelmente bizarro e nonsense num multiverso (ex: chove pianos em chamas, gravidade invertida com patos gigantes).
Dê o contexto do perigo em 2 frases curtas, terminando com a pergunta: "O que vocês fazem?".
Retorne EXATAMENTE:

PROMPT_IMAGEM: [Prompt em inglês realista da cena para o Stable Diffusion]
CENARIO: [As 2 frases do cenário]
  `.trim();

  try {
    const msg = await channel.send(`📜 (Rodada ${currentRound}/${maxRounds}) A IA está abrindo um novo Universo...`);
    const resposta = await pedirRespostaAoOllama(
      [{ role: "user", content: promptOllama }],
      { usarPoliticasDono: false, generationOptions: { num_predict: 400 } }
    );
    const resLimpa = limparResposta(resposta);

    const pImgMatch = resLimpa.match(/PROMPT_IMAGEM:\s*([^\n]+)/i);
    const cenMatch = resLimpa.match(/CEN[AÁ]RIO:\s*([\s\S]*)/i);

    const promptImg = pImgMatch ? pImgMatch[1].trim() : "";
    const cenario = cenMatch ? cenMatch[1].trim() : "";

    if (!promptImg || !cenario) {
      throw new Error("Formato inválido.");
    }

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

      await survMsg.edit({ components: [] }).catch(() => null);

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
        textLines += `**${L}:** "${text}"\n`;
        
        rowVote.addComponents(
          new ButtonBuilder().setCustomId(`rpg_imp_vote_${L}`).setLabel(L).setStyle(ButtonStyle.Primary)
        );
        index++;
      });

      const endTimeVote = Math.floor(Date.now() / 1000) + 30;

      const voteMsg = await channel.send({
        content: `🚨 **FIM DO TEMPO! AQUI ESTÃO AS IDEIAS:** 🚨\n\n${textLines}\n⏳ **VOTAÇÃO ENCERRA EM:** <t:${endTimeVote}:R>\n*Vote na melhor ação! Você não pode votar em si mesmo.*`,
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
        
        await voteMsg.edit({ components: [] }).catch(() => null);

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

        let winnerLetter = Object.keys(count).reduce((a, b) => count[a] > count[b] ? a : b);
        let winnerText = stateVote.letterToText[winnerLetter];
        let winnerId = stateVote.answerAuthors[winnerLetter];

        // Atualizar score global
        const oldScore = globalScores.get(winnerId) || 0;
        globalScores.set(winnerId, oldScore + 10);

        channel.send(`⏰ **VOTAÇÃO ENCERRADA!** A ideia vencedora foi a **${winnerLetter}** criada por <@${winnerId}>!\n*A IA está ilustrando o que aconteceu com essa ideia... ⏳*`);
        activeAventuras.set(channelId, { type: 'generating' });

        // Gerar consequencia via Forge! O prompt do Forge será a ação do cara.
        // Vamos pedir para o Ollama traduzir a ação pra inglês pra ficar bonito no SD.
        const promptTradução = `Traduza a ação a seguir para o inglês, criando um prompt focado e realista para o Stable Diffusion. A ação foi uma resposta para o cenário: "${stateVote.cenario}". Ação do jogador: "${winnerText}". Retorne APENAS o prompt em inglês.`;
        
        let promptFinalImg = stateVote.promptImg; // fallback
        try {
           const tResp = await pedirRespostaAoOllama([{ role: "user", content: promptTradução }], { usarPoliticasDono: false, generationOptions: { num_predict: 100 } });
           promptFinalImg = limparResposta(tResp);
        } catch(e) {}

        gerarImagemNoForge(promptFinalImg, false).then(async attachFinal => {
           let resolMsg = `📸 **AÇÃO CONCRETIZADA:**\n"<@${winnerId}>: *${winnerText}*"\n\n`;
           
           if (currentRound < maxRounds) {
              resolMsg += `👉 Preparando a Rodada ${currentRound + 1}...`;
              await channel.send({ content: resolMsg, files: [attachFinal] });
              setTimeout(() => {
                iniciarTurnoImproviso(channelId, channel, maxRounds, currentRound + 1, globalScores);
              }, 3000);
           } else {
              // FIM DE JOGO
              resolMsg += `🏆 **FIM DO JOGO!**\nO Multiverso está salvo (ou destruído, tanto faz).\n\n**PLACAR FINAL:**\n`;
              
              const sorted = Array.from(globalScores.entries()).sort((a, b) => b[1] - a[1]);
              const premios = [300, 150, 50]; // Top 3
              
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
              await channel.send({ content: resolMsg, files: [attachFinal] });
           }

        }).catch(err => {
           console.error("Erro Forge", err);
           channel.send("Erro ao ilustrar o final.");
           activeAventuras.delete(channelId);
        });

      }, 30000);

    }, 45000);

  } catch (err) {
    console.error("Erro Improviso:", err);
    channel.send("O tecido do Multiverso rasgou na geração inicial. Tentem outra hora.");
    activeAventuras.delete(channelId);
  }
}

// ==========================================
// MODO 2: ENIGMA VISUAL (Mantido)
// ==========================================
async function iniciarModoEnigma(channelId, channel, diff) {
  activeAventuras.set(channelId, { type: 'generating' });

  const promptOllama = `
Gere um cenário incrivelmente bizarro, nonsense e aleatório (exemplo: astronautas ordenhando vacas no espaço, ou um dinossauro operando no Wall Street).
O objetivo é um jogo de adivinhação. O usuário SÓ vai ver a imagem desse cenário.
Dificuldade solicitada: ${diff.promptMod}
Me retorne EXATAMENTE neste formato de 5 linhas e mais nada:

PROMPT_IMAGEM: [Prompt em inglês, detalhado, fotorealista e focado no cenário bizarro para o Stable Diffusion]
VERDADEIRA: [1 frase em português descrevendo corretamente a cena bizarra]
FALSA_1: [1 frase em português completamente diferente e absurda, mas que também poderia ser estranha]
FALSA_2: [Outra frase em português diferente e absurda]
FALSA_3: [Outra frase em português diferente e absurda]
  `.trim();

  try {
    const resposta = await pedirRespostaAoOllama(
      [{ role: "user", content: promptOllama }],
      { usarPoliticasDono: false, generationOptions: { num_predict: 400 } }
    );
    const resLimpa = limparResposta(resposta);

    const pImgMatch = resLimpa.match(/PROMPT_IMAGEM:\s*([^\n]+)/i);
    const vMatch = resLimpa.match(/VERDADEIRA:\s*([^\n]+)/i);
    const f1Match = resLimpa.match(/FALSA_1:\s*([^\n]+)/i);
    const f2Match = resLimpa.match(/FALSA_2:\s*([^\n]+)/i);
    const f3Match = resLimpa.match(/FALSA_3:\s*([^\n]+)/i);

    const promptImg = pImgMatch ? pImgMatch[1].trim() : "";
    const verdadeira = vMatch ? vMatch[1].trim() : "";
    const f1 = f1Match ? f1Match[1].trim() : "";
    const f2 = f2Match ? f2Match[1].trim() : "";
    const f3 = f3Match ? f3Match[1].trim() : "";

    if (!promptImg || !verdadeira || !f1 || !f2 || !f3) {
      console.log("Raw LLM:", resposta);
      throw new Error("A IA não seguiu a formatação exigida.");
    }

    const msg = await channel.send("🎨 A IA está pintando a tela do Enigma...");
    const attachment = await gerarImagemNoForge(promptImg, false);

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
      new ButtonBuilder().setCustomId('rpg_enigma_0').setLabel('Opção 1').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('rpg_enigma_1').setLabel('Opção 2').setStyle(ButtonStyle.Secondary)
    );
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('rpg_enigma_2').setLabel('Opção 3').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('rpg_enigma_3').setLabel('Opção 4').setStyle(ButtonStyle.Secondary)
    );

    let txtOpcoes = `**1.** ${opcoes[0].texto}\n**2.** ${opcoes[1].texto}\n**3.** ${opcoes[2].texto}\n**4.** ${opcoes[3].texto}`;

    const endTime = Math.floor(Date.now() / 1000) + 45;

    await msg.delete().catch(() => null);
    const enigmaMsg = await channel.send({
      content: `🕵️‍♂️ **ENIGMA VISUAL** 🕵️‍♂️\nOlhe atentamente para o que a IA gerou.\nO que diabos está acontecendo nessa cena?\n\n${txtOpcoes}\n\n⏳ **O tempo se esgota em:** <t:${endTime}:R>\n🚨 **A OPÇÃO MAIS VOTADA PELO GRUPO VENCE!** 🚨`,
      files: [attachment],
      components: [row1, row2]
    });

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

      await enigmaMsg.edit({ components: [] }).catch(() => null);

      let vencedores = [];
      state.votos.forEach((voto, userId) => {
        if (voto === corretaIndex) {
          vencedores.push(`<@${userId}>`);
          addCoins(userId, diff.win);
        } else {
          if (diff.lose > 0) removeCoins(userId, diff.lose);
        }
      });

      let resultText = `⏰ **TEMPO ESGOTADO!**\n\nA resposta correta era a **Opção ${corretaIndex + 1}**: *${opcoes[corretaIndex].texto}*!\n\n`;

      if (vencedores.length > 0) {
        resultText += `🎉 **ACERTARAM E GANHARAM ${diff.win} Nanacoins 🪙:** ${vencedores.join(', ')}`;
      } else {
        resultText += `💀 **TODO MUNDO ERROU!** Ninguém ganhou.`;
      }

      if (diff.lose > 0) {
        resultText += `\n*Nota: Quem errou perdeu ${diff.lose} Nanacoins por jogar na dificuldade ${diff.name}.*`;
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
