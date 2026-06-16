const fs = require("fs");
const fsPromises = require("fs").promises;
const config = require("./config");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, EmbedBuilder } = require("discord.js");
const { getCoins, addCoins, removeCoins, formatCoins } = require("./economy");
const { getStealChanceExtra } = require("./boosts");
const { pedirRespostaAoOllama } = require("./ollama");

const prisonMap = new Map();
const parrudoMap = new Map();
const beijoCooldowns = new Map();
const robFailures = new Map();

function carregarTimers() {
  try {
    if (fs.existsSync(config.TIMERS_PATH)) {
      const data = fs.readFileSync(config.TIMERS_PATH, "utf-8");
      const parsed = JSON.parse(data);
      if (parsed.prison) parsed.prison.forEach(([k, v]) => prisonMap.set(k, v));
      if (parsed.parrudo) parsed.parrudo.forEach(([k, v]) => parrudoMap.set(k, v));
      if (parsed.beijo) parsed.beijo.forEach(([k, v]) => beijoCooldowns.set(k, v));
    }
  } catch (err) {
    console.error("Erro ao carregar timers:", err);
  }
}

carregarTimers();

let saveTimersTimeout = null;
let isSavingTimers = false;

function salvarTimers() {
  if (saveTimersTimeout) return;
  saveTimersTimeout = setTimeout(async () => {
    if (isSavingTimers) return;
    isSavingTimers = true;
    try {
      const obj = {
        prison: Array.from(prisonMap.entries()),
        parrudo: Array.from(parrudoMap.entries()),
        beijo: Array.from(beijoCooldowns.entries())
      };
      await fsPromises.writeFile(config.TIMERS_PATH, JSON.stringify(obj, null, 2), "utf-8");
    } catch (err) {
      console.error("Erro ao salvar timers:", err);
    } finally {
      isSavingTimers = false;
      saveTimersTimeout = null;
    }
  }, 2000);
}

function isParrudo(userId) {
  if (!parrudoMap.has(userId)) return false;
  const expire = parrudoMap.get(userId);
  if (Date.now() > expire) {
    parrudoMap.delete(userId);
    salvarTimers();
    return false;
  }
  return true;
}

function getTempoParrudoRestante(userId) {
  if (!parrudoMap.has(userId)) return 0;
  const rest = parrudoMap.get(userId) - Date.now();
  return Math.ceil(rest / 60_000);
}

function isPrisioneiro(userId) {
  if (!prisonMap.has(userId)) return false;
  const expire = prisonMap.get(userId);
  if (Date.now() > expire) {
    prisonMap.delete(userId);
    salvarTimers();
    return false;
  }
  return true;
}

function prenderUsuario(userId, minutes) {
  prisonMap.set(userId, Date.now() + minutes * 60_000);
  salvarTimers();
}

function getTempoPrisaoRestante(userId) {
  if (!prisonMap.has(userId)) return 0;
  const rest = prisonMap.get(userId) - Date.now();
  return Math.ceil(rest / 60_000);
}

// Limpeza de Memória Periódica (a cada 1 hora)
setInterval(() => {
  const now = Date.now();
  let changed = false;
  for (const [userId, expire] of prisonMap.entries()) {
    if (now > expire) { prisonMap.delete(userId); changed = true; }
  }
  for (const [userId, expire] of parrudoMap.entries()) {
    if (now > expire) { parrudoMap.delete(userId); changed = true; }
  }
  for (const [userId, expire] of beijoCooldowns.entries()) {
    if (now > expire) { beijoCooldowns.delete(userId); changed = true; }
  }
  robFailures.clear(); // Limpa as falhas a cada 1 hora para evitar acúmulo eterno
  if (changed) salvarTimers();
}, 60 * 60 * 1000);

// Map of active duels: duelId -> { p1: { id, name, choice }, p2: { id, name, choice }, amount, channelId, messageId, timerId }
const activeDuels = new Map();

async function handleRoubarCommand(message, text) {
  const userId = message.author.id;

  if (isPrisioneiro(userId)) {
    return message.reply(`🚓 Você está na prisão! Faltam **${getTempoPrisaoRestante(userId)} minutos** para você ser solto.`);
  }

  const mentions = message.mentions.users;
  let targetUser = mentions.first();

  if (!targetUser && text) {
    const targetQuery = text.trim().toLowerCase();

    // -- INÍCIO AMBIENTE DE TESTE --
    if (message.channel.id === '1348716118981742592' && targetQuery === 'teste') {
      targetUser = { id: 'teste_user_id', username: 'Zezinho do Teste', bot: false };
      const { getCoins, addCoins } = require("./economy");
      if (getCoins('teste_user_id') < 5000) addCoins('teste_user_id', 5000); // Dinheiro infinito pra ser roubado
    } else {
      // 1. Tenta achar no cache global (IDs, usernames, globalNames)
      targetUser = message.client.users.cache.find(u =>
        u.id === targetQuery ||
        u.username.toLowerCase() === targetQuery ||
        (u.globalName && u.globalName.toLowerCase() === targetQuery)
      );

      // 2. Fallback: Procura na API em todos os servidores do bot
      if (!targetUser) {
        for (const guild of message.client.guilds.cache.values()) {
          try {
            const members = await guild.members.fetch({ query: targetQuery, limit: 1 });
            if (members.size > 0) {
              targetUser = members.first().user;
              break;
            }
          } catch (err) {
            // ignora erro de fetch no servidor específico
          }
        }
      }
    }
  }

  if (!targetUser) {
    return message.reply("Você precisa marcar alguém ou digitar o nome/ID exato para roubar! Ex: `!roubar @Pessoa` ou `!roubar nome.usuario`");
  }

  if (targetUser.id === userId) {
    return message.reply("Você não pode roubar de você mesmo!");
  }

  if (targetUser.bot) {
    return message.reply("Você não pode roubar bots. Nós somos programados para chamar a polícia cibernética.");
  }

  if (isParrudo(targetUser.id)) {
    const { hasItem, removeItem } = require("./inventory");

    // Se o ladrão tiver Ácido Corrosivo, tenta furar o Parrudo
    if (hasItem(userId, 'acido_corrosivo')) {
      removeItem(userId, 'acido_corrosivo', 1); // Consome o item sempre

      const furou = Math.random() < 0.45; // 45% de chance de furar

      if (furou) {
        // Ácido funcionou! O roubo prossegue normalmente (não retorna aqui)
        const acidEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('🧪 ÁCIDO CORROSIVO ATIVADO!')
          .setDescription(`O ácido derreteu o escudo de **${targetUser.username}**! O Parrudo foi neutralizado e o roubo vai acontecer!`)
          .setFooter({ text: 'O item foi consumido.' });
        await message.channel.send({ embeds: [acidEmbed] });
      } else {
        // Ácido falhou
        const failEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('🧪💨 ÁCIDO EVAPOROU!')
          .setDescription(`Você jogou o ácido em **${targetUser.username}**, mas o escudo Parrudo era forte demais! O ácido evaporou sem efeito.`)
          .setFooter({ text: 'O item foi consumido mesmo assim.' });
        return message.reply({ embeds: [failEmbed] });
      }
    } else {
      return message.reply(`🛡️ O usuário ${targetUser.username} tomou o suco e está **PARRUDO**! Ele está imune a roubos no momento.\n💡 *Dica: Compre um **Ácido Corrosivo 🧪** na \`!loja\` para ter 45% de chance de furar o escudo!*`);
    }
  }

  const myCoins = getCoins(userId);
  const targetCoins = getCoins(targetUser.id);

  if (targetCoins < 10) {
    return message.reply(`O usuário ${targetUser.username} está muito pobre para ser roubado (menos de 10 Nanacoins). Tenha piedade!`);
  }

  // Verificar se possui Boost de Roubo ativo
  const boostChance = getStealChanceExtra(userId);

  // Base 50% + boost
  const successChance = 0.50 + boostChance;
  const success = Math.random() < successChance;

  const { hasPeCabra, hasEscudoEspinhos } = require("./boosts");
  const { hasItem, removeItem } = require("./inventory");

  if (success) {
    // Rouba entre 10% e 50% do dinheiro do alvo (ou 40-80% com pé de cabra)
    let percent = 0.10 + Math.random() * 0.40;
    if (hasPeCabra(userId)) {
      percent = 0.40 + Math.random() * 0.40;
    }
    const stolen = Math.floor(targetCoins * percent);

    removeCoins(targetUser.id, stolen);
    addCoins(userId, stolen);

    const embed = new EmbedBuilder()
      .setColor('#00AA00') // Verde escuro
      .setTitle('🥷 ASSALTO BEM-SUCEDIDO!')
      .setDescription(`Você agiu pelas sombras e furtou a carteira de **${targetUser.username}**.`)
      .addFields({ name: '💰 Valor Roubado', value: `\`+ ${formatCoins(stolen)} Nanacoins\`` })
      .setFooter({ text: 'O crime compensou desta vez.' });

    return message.reply({ embeds: [embed] });
  } else {
    // Falha e incrementa tentativas
    const embeds = [];

    if (hasEscudoEspinhos(targetUser.id)) {
      const multa = Math.floor(myCoins * 0.10);
      removeCoins(userId, multa);
      addCoins(targetUser.id, multa);
      
      const escudoEmbed = new EmbedBuilder()
        .setColor('#8B008B') // Roxo escuro
        .setTitle('🛡️ ESCUDO DE ESPINHOS!')
        .setDescription(`**${message.author.username}** tentou roubar, mas se espetou feio no escudo de **${targetUser.username}**!`)
        .addFields({ name: '🩸 Multa Paga', value: `\`- ${formatCoins(multa)} Nanacoins\`` });
      embeds.push(escudoEmbed);
    }

    let fails = (robFailures.get(userId) || 0) + 1;
    
    if (fails >= 2) {
      robFailures.delete(userId);
      
      if (hasItem(userId, 'bomba_fumaca')) {
        removeItem(userId, 'bomba_fumaca', 1);
        const smokeEmbed = new EmbedBuilder()
          .setColor('#808080') // Cinza
          .setTitle('💨 ESCAPE NINJA')
          .setDescription('A polícia tentou te prender pela 2ª falha...\nMas você jogou uma **Bomba de Fumaça** no chão e desapareceu no ar!')
          .setFooter({ text: 'Suas falhas de roubo foram zeradas.' });
        embeds.push(smokeEmbed);
        return message.reply({ embeds });
      }

      if (userId !== '762478935615078401') {
        prenderUsuario(userId, 10);
      }
      
      const jailEmbed = new EmbedBuilder()
        .setColor('#FF0000') // Vermelho
        .setTitle('🚓 BUSTED! VOCÊ FOI PRESO!')
        .setDescription(`A polícia te pegou tentando roubar **${targetUser.username}** pela 2ª vez consecutiva. Você está algemado.`)
        .addFields({ name: '⚖️ Sentença', value: '10 minutos sem jogar Forca, Aventura ou Roubar.' })
        .setFooter({ text: 'Dica: Alguém pode te tirar daí mais rápido pagando a !fianca' });
      embeds.push(jailEmbed);
      
      return message.reply({ embeds });
    } else {
      robFailures.set(userId, fails);
      const failEmbed = new EmbedBuilder()
        .setColor('#FFA500') // Laranja
        .setTitle('🚨 ALARME DISPARADO')
        .setDescription(`Você falhou ao tentar roubar **${targetUser.username}**. Você fugiu antes da polícia chegar, mas eles estão na sua cola.`)
        .addFields({ name: '⚠️ Nível de Procurado', value: `\`[ ${fails} / 2 ]\`` })
        .setFooter({ text: 'Na 2ª falha consecutiva você vai pra cadeia!' });
      embeds.push(failEmbed);
      
      return message.reply({ embeds });
    }
  }
}

async function handleTimeoutCommand(message) {
  const userId = message.author.id;
  if (!isPrisioneiro(userId)) {
    return message.reply("Você não está banido/na prisão no momento!");
  }
  const tempo = getTempoPrisaoRestante(userId);
  return message.reply(`🚓 Você ainda está banido por tentar roubar! Faltam **${tempo} minutos** para ser solto.\n💡 *Dica: Você pode usar \`!fianca\` para sair agora por 250 Nanacoins.*`);
}

async function handleFiancaCommand(message) {
  const userId = message.author.id;
  
  const args = message.content.split(/\s+/).slice(1);
  let targetUser = message.mentions.users.first();
  let prisioneiroId = targetUser ? targetUser.id : userId;

  if (!targetUser && args.length > 0) {
    const targetQuery = args[0].toLowerCase();
    if (message.channel.id === '1348716118981742592' && targetQuery === 'teste') {
      targetUser = { id: 'teste_user_id', username: 'Zezinho do Teste', bot: false };
      prisioneiroId = targetUser.id;
    }
  }

  if (!isPrisioneiro(prisioneiroId)) {
    if (prisioneiroId === userId) {
      return message.reply("Você não está na prisão no momento!");
    } else {
      return message.reply(`O usuário ${targetUser.username} não está na prisão no momento!`);
    }
  }

  const myCoins = getCoins(userId);
  if (myCoins < 250) {
    return message.reply(`Você precisa de **250 Nanacoins 🪙** para pagar a fiança e tirar ${prisioneiroId === userId ? "você" : targetUser.username} da cadeia! (Seu saldo: ${myCoins})`);
  }

  removeCoins(userId, 250);
  prisonMap.delete(prisioneiroId);
  salvarTimers();
  
  if (prisioneiroId === userId) {
    return message.reply("💸 **FIANÇA PAGA!** Você subornou o delegado com **250 Nanacoins 🪙** e está livre para voltar às ruas!");
  } else {
    return message.reply(`💸 **FIANÇA PAGA!** ${message.author.username} subornou o delegado com **250 Nanacoins 🪙** e tirou ${targetUser.username} da cadeia!`);
  }
}

async function handleParrudoCommand(message, text) {
  const userId = message.author.id;

  if (isParrudo(userId)) {
    const tempo = getTempoParrudoRestante(userId);
    const horas = Math.floor(tempo / 60);
    const mins = tempo % 60;
    return message.reply(`💪 Você já está **PARRUDO**! Faltam **${horas}h e ${mins}m** para o efeito acabar.`);
  }

  // Parse hours from text
  const match = text ? text.match(/^(\d+)/) : null;
  if (!match) {
    return message.reply("🛡️ **Você precisa informar quantas horas quer comprar!**\nOpções disponíveis:\n👉 `!parrudo 1h` — Custa 250 Nanacoins\n👉 `!parrudo 2h` — Custa 500 Nanacoins\n👉 `!parrudo 5h` — Custa 1000 Nanacoins\n👉 `!parrudo 10h` — Custa 5000 Nanacoins");
  }
  const requestedHours = parseInt(match[1], 10);

  let cost = 0;
  let durationHours = 0;

  if (requestedHours <= 1) {
    cost = 250;
    durationHours = 1;
  } else if (requestedHours <= 2) {
    cost = 500;
    durationHours = 2;
  } else if (requestedHours <= 5) {
    cost = 1000;
    durationHours = 5;
  } else {
    cost = 5000;
    durationHours = 10;
  }

  const myCoins = getCoins(userId);
  if (myCoins < cost) {
    return message.reply(`Você precisa de **${formatCoins(cost)} Nanacoins 🪙** para comprar a proteção Parruda de ${durationHours}h! (Seu saldo: ${formatCoins(myCoins)})`);
  }

  removeCoins(userId, cost);
  parrudoMap.set(userId, Date.now() + durationHours * 60 * 60 * 1000);
  salvarTimers();
  return message.reply(`🛡️ **MODO PARRUDO ATIVADO!** Você bebeu o suco, pagou ${formatCoins(cost)} Nanacoins 🪙 e ficará **irroubável por ${durationHours} horas**! Ninguém pode encostar no seu dinheiro.`);
}

async function handleDueloCommand(message, text) {
  const userId = message.author.id;

  if (isPrisioneiro(userId)) {
    return message.reply(`🚓 Você não pode duelar de dentro da prisão! Faltam **${getTempoPrisaoRestante(userId)} minutos**.`);
  }

  const args = text.split(/\s+/);
  const mentions = message.mentions.users;
  let targetUser = mentions.first();
  let amountText = args[1];

  if (!targetUser && args.length >= 2) {
    const targetQuery = args[0].toLowerCase();
    amountText = args[1];

    if (message.channel.id === '1348716118981742592' && targetQuery === 'teste') {
      targetUser = { id: 'teste_user_id', username: 'Zezinho do Teste', bot: false };
      const { getCoins, addCoins } = require("./economy");
      if (getCoins('teste_user_id') < 5000) addCoins('teste_user_id', 5000);
    } else {
      targetUser = message.client.users.cache.find(u =>
        u.id === targetQuery || u.username.toLowerCase() === targetQuery
      );
    }
  }

  if (!targetUser || !amountText) {
    return message.reply("Uso correto: `!duelo @Adversário <valor>`\nEx: `!duelo @João 100`");
  }

  if (targetUser.id === userId) {
    return message.reply("Você não pode duelar com você mesmo.");
  }

  if (targetUser.bot) {
    return message.reply("Bots não participam de duelos clandestinos.");
  }

  if (isPrisioneiro(targetUser.id)) {
    return message.reply(`O usuário ${targetUser.username} está na cadeia. Presidiários não duelam.`);
  }

  // Extrair valor da aposta
  if (amountText.startsWith('<@')) amountText = args[0]; // In case they swap order

  const amount = parseInt(amountText, 10);
  if (isNaN(amount) || amount <= 0) {
    return message.reply("Você deve apostar um valor válido maior que 0.");
  }

  const myCoins = getCoins(userId);
  if (myCoins < amount) {
    return message.reply(`Você não tem ${amount} Nanacoins 🪙 para apostar! (Seu saldo: ${myCoins})`);
  }

  const targetCoins = getCoins(targetUser.id);
  if (targetCoins < amount) {
    return message.reply(`${targetUser.username} não tem ${amount} Nanacoins 🪙 para bancar essa aposta. Que vergonha!`);
  }

  // Desconta logo de ambos para travar no pote
  removeCoins(userId, amount);
  removeCoins(targetUser.id, amount);

  const duelId = `duel_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const isMock = targetUser.id === 'teste_user_id';
  const mockChoice = isMock ? ["Ataque", "Defesa", "Magia"][Math.floor(Math.random() * 3)] : null;

  activeDuels.set(duelId, {
    p1: { id: userId, name: message.author.username, choice: null },
    p2: { id: targetUser.id, name: targetUser.username, choice: mockChoice },
    amount: amount,
    channelId: message.channel.id,
    messageId: null,
    timerId: null
  });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`${duelId}_Ataque`)
        .setLabel('⚔️ Ataque Rápido')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`${duelId}_Defesa`)
        .setLabel('🛡️ Defesa e Contra-Ataque')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`${duelId}_Magia`)
        .setLabel('🔮 Magia Suprema')
        .setStyle(ButtonStyle.Success)
    );

  const duelEmbed = new EmbedBuilder()
    .setColor('#000000') // Preto para cartaz de luta
    .setTitle('🥊 CARTAZ DE LUTA CLANDESTINA')
    .setDescription(`Um duelo épico está prestes a começar! As moedas já foram travadas no pote central.\nEscolham suas táticas secretamente nos botões abaixo.`)
    .addFields(
      { name: '🔴 Desafiante', value: `**${message.author.username}**`, inline: true },
      { name: '🔵 Desafiado', value: `**${targetUser.username}**`, inline: true },
      { name: '💰 Pote Total (Prêmio)', value: `\`${formatCoins(amount * 2)} Nanacoins\``, inline: false },
      { name: '⏳ Tempo Restante', value: '2 minutos para escolherem suas ações!', inline: false }
    )
    .setImage('https://media.giphy.com/media/QSwBid1bso4h5ePFnN/giphy.gif'); // Usando a URL direta da mídia pro embed funcionar

  const sentMessage = await message.channel.send({
    content: `<@${targetUser.id}> Você foi desafiado por <@${userId}>!`,
    embeds: [duelEmbed],
    components: [row]
  });

  const duelRef = activeDuels.get(duelId);
  duelRef.messageId = sentMessage.id;

  // Timeout de 2 minutos
  duelRef.timerId = setTimeout(async () => {
    if (activeDuels.has(duelId)) {
      const duel = activeDuels.get(duelId);
      activeDuels.delete(duelId);

      // Devolve o dinheiro
      addCoins(duel.p1.id, duel.amount);
      addCoins(duel.p2.id, duel.amount);

      await sentMessage.edit({ components: [] }).catch(() => null);
      const woEmbed = new EmbedBuilder()
        .setColor('#808080')
        .setTitle('⏰ DUELO CANCELADO POR W.O!')
        .setDescription(`O duelo entre **${message.author.username}** e **${targetUser.username}** expirou porque alguém amarelou.\nAs apostas (\`${formatCoins(duel.amount)} Nanacoins\`) foram devolvidas para as carteiras.`);
      message.channel.send({ embeds: [woEmbed] });
    }
  }, 120000);
}

async function narrarResolucaoOllama(p1Name, p1Choice, p2Name, p2Choice, winnerName, winReason) {
  const prompt = `Escreva uma cena de combate muito épica e cômica (no máximo 3 parágrafos curtos) no estilo anime. 
Lutadores: ${p1Name} e ${p2Name}.
${p1Name} usou a técnica: ${p1Choice}.
${p2Name} usou a técnica: ${p2Choice}.
O resultado foi: ${winnerName === 'Empate' ? 'A batalha terminou em um empate constrangedor.' : `${winnerName} venceu porque ${winReason}.`}
Faça o texto parecer empolgante, seja criativo com os golpes, mas não diga "Aqui está o texto" ou saia do personagem. Apenas narre.`;

  try {
    const response = await pedirRespostaAoOllama([
      { role: "user", content: prompt }
    ], { usarPoliticasDono: false });
    return response.trim();
  } catch (err) {
    console.error("Erro na narração do duelo:", err);
    return `*A IA narradora quebrou a televisão e fugiu. Mas saibam que a luta foi muito feia, cheia de poeira e gritaria.*`;
  }
}

async function handleButtonInteraction(interaction) {
  if (!interaction.isButton()) return;
  const parts = interaction.customId.split('_');
  if (parts[0] !== 'duel') return;

  const duelId = `${parts[0]}_${parts[1]}_${parts[2]}`;
  const action = parts[3];

  const duel = activeDuels.get(duelId);
  if (!duel) {
    return interaction.reply({ content: "Este duelo já expirou ou foi concluído.", flags: MessageFlags.Ephemeral });
  }

  const userId = interaction.user.id;

  if (duel.p1.id !== userId && duel.p2.id !== userId) {
    return interaction.reply({ content: "Você não faz parte deste duelo. Sai pra lá metido!", flags: MessageFlags.Ephemeral });
  }

  const playerObj = duel.p1.id === userId ? duel.p1 : duel.p2;

  if (playerObj.choice) {
    return interaction.reply({ content: `Você já escolheu **${playerObj.choice}**! Aguarde o oponente.`, flags: MessageFlags.Ephemeral });
  }

  playerObj.choice = action;
  await interaction.reply({ content: `Você escolheu secretamente **${action}**! 🤫`, flags: MessageFlags.Ephemeral });

  // Checar se ambos escolheram
  if (duel.p1.choice && duel.p2.choice) {
    if (duel.timerId) clearTimeout(duel.timerId);
    activeDuels.delete(duelId);

    // Desabilitar botões na mensagem original
    const channel = interaction.client.channels.cache.get(duel.channelId);
    if (channel) {
      const msg = await channel.messages.fetch(duel.messageId).catch(() => null);
      if (msg) {
        await msg.edit({ components: [] }).catch(() => null);
      }
    }

    // Lógica Pedra Papel Tesoura
    // Ataque > Magia
    // Magia > Defesa
    // Defesa > Ataque
    let winner = null;
    let reason = "";

    const c1 = duel.p1.choice;
    const c2 = duel.p2.choice;

    if (c1 === c2) {
      winner = "Empate";
    } else if (c1 === "Ataque" && c2 === "Magia") {
      winner = duel.p1;
      reason = "Ataque Rápido interrompeu a conjuração da Magia Suprema";
    } else if (c1 === "Magia" && c2 === "Defesa") {
      winner = duel.p1;
      reason = "Magia Suprema obliterou a Defesa do oponente";
    } else if (c1 === "Defesa" && c2 === "Ataque") {
      winner = duel.p1;
      reason = "Defesa perfeita resultou num Contra-Ataque devastador";
    } else if (c2 === "Ataque" && c1 === "Magia") {
      winner = duel.p2;
      reason = "Ataque Rápido interrompeu a conjuração da Magia Suprema";
    } else if (c2 === "Magia" && c1 === "Defesa") {
      winner = duel.p2;
      reason = "Magia Suprema obliterou a Defesa do oponente";
    } else if (c2 === "Defesa" && c1 === "Ataque") {
      winner = duel.p2;
      reason = "Defesa perfeita resultou num Contra-Ataque devastador";
    }

    let resultadoFinal = "";
    if (winner === "Empate") {
      addCoins(duel.p1.id, duel.amount);
      addCoins(duel.p2.id, duel.amount);
      resultadoFinal = `**EMPATE!** Ninguém ganha nada e os ${duel.amount} Nanacoins 🪙 foram devolvidos.`;
    } else {
      // Vencedor leva tudo (seu próprio pote de volta + a aposta do outro)
      addCoins(winner.id, duel.amount * 2);
      const perdedor = winner.id === duel.p1.id ? duel.p2 : duel.p1;
      resultadoFinal = `🏆 **VITÓRIA!** O grande vencedor foi **${winner.name}**, que levou o pote de **${duel.amount * 2} Nanacoins 🪙** para casa, deixando ${perdedor.name} quebrado!`;
    }

    const m = await channel.send(`⏳ **OS LUTADORES FIZERAM SUAS ESCOLHAS!**\nO Ollama está escrevendo a narração épica da treta...`);

    const narracao = await narrarResolucaoOllama(
      duel.p1.name, duel.p1.choice,
      duel.p2.name, duel.p2.choice,
      winner === "Empate" ? "Empate" : winner.name,
      reason
    );

    const resultEmbed = new EmbedBuilder()
      .setColor(winner === "Empate" ? '#FFA500' : '#00FF00')
      .setTitle('🔥 A RESOLUÇÃO DO DUELO 🔥')
      .setDescription(narracao)
      .addFields({ name: '🏆 Resultado Final', value: resultadoFinal });

    await m.edit({ content: null, embeds: [resultEmbed] });
  }
}

async function handleBeijarMuroCommand(message) {
  const userId = message.author.id;
  if (isPrisioneiro(userId)) {
    return message.reply(`🚓 Você está na prisão e a parede da cela é fria demais para beijar.`);
  }

  if (beijoCooldowns.has(userId)) {
    const expire = beijoCooldowns.get(userId);
    if (Date.now() < expire) {
      const mins = Math.ceil((expire - Date.now()) / 60000);
      return message.reply(`👄 Seus lábios estão doendo! Espere **${mins} minutos** para usar o comando de novo.`);
    }
  }

  // Cooldown de 10 minutos
  beijoCooldowns.set(userId, Date.now() + 10 * 60000);
  salvarTimers();

  const { hasItem, removeItem } = require("./inventory");
  const hasCoelho = hasItem(userId, 'pe_coelho');
  const embeds = [];

  if (hasCoelho) {
    removeItem(userId, 'pe_coelho', 1);
    const coelhoEmbed = new EmbedBuilder()
      .setColor('#FFFFFF')
      .setTitle('🐰 PÉ DE COELHO!')
      .setDescription(`A sorte está ao lado de **${message.author.username}** neste beijo! (Imune a cadeia/azar)`);
    embeds.push(coelhoEmbed);
  }

  const rng = hasCoelho ? Math.random() * 0.49 : Math.random();
  const gifBom = "https://media.giphy.com/media/Pk3ljzIDb4R0j3zpMU/giphy.gif";
  const gifRuim = "https://media.giphy.com/media/RbAJaIKpGMQLlciHnn/giphy.gif";

  const resultEmbed = new EmbedBuilder();

  if (rng < 0.25) {
    const { getGameMultiplier } = require("./boosts");
    const premio = 600 * getGameMultiplier(userId);
    addCoins(userId, premio);
    resultEmbed.setColor('#FFD700') // Dourado
      .setTitle('💋 BEIJO DA SORTE GRANDE!')
      .setDescription('Você beijou o muro com paixão e encontrou um tesouro escondido!')
      .addFields({ name: '💰 Prêmio', value: `\`+ ${premio} Nanacoins\`` })
      .setImage(gifBom);
  } else if (rng < 0.50) {
    const { getGameMultiplier } = require("./boosts");
    const premio = 250 * getGameMultiplier(userId);
    addCoins(userId, premio);
    resultEmbed.setColor('#FFFF00') // Amarelo
      .setTitle('💋 BEIJO DA SORTE!')
      .setDescription('Você deu um beijinho no muro e achou uma carteira caída no chão!')
      .addFields({ name: '💰 Prêmio', value: `\`+ ${premio} Nanacoins\`` })
      .setImage(gifBom);
  } else if (rng < 0.75) {
    const penalty = Math.min(getCoins(userId), 100);
    if (penalty > 0) removeCoins(userId, penalty);
    resultEmbed.setColor('#FFA500') // Laranja
      .setTitle('🧱💥 BATEU A CARA!')
      .setDescription('O muro revidou! Você quebrou um dente e deixou cair moedas do bolso.')
      .addFields({ name: '🩸 Perda', value: `\`- ${penalty} Nanacoins\`` })
      .setImage(gifRuim);
  } else if (rng < 0.90) {
    const penalty = Math.min(getCoins(userId), 200);
    if (penalty > 0) removeCoins(userId, penalty);
    resultEmbed.setColor('#8B0000') // Vermelho Escuro
      .setTitle('🤢 QUE NOJO!')
      .setDescription('Você beijou a boca de uma barata que estava no muro. A consulta no posto custou caro!')
      .addFields({ name: '💸 Despesas Médicas', value: `\`- ${penalty} Nanacoins\`` })
      .setImage(gifRuim);
  } else {
    prenderUsuario(userId, 5);
    resultEmbed.setColor('#FF0000') // Vermelho
      .setTitle('🚓🚨 PEGO NO ATO!')
      .setDescription('A polícia passou na hora, achou que você estava vandalizando o muro e te levou preso!')
      .addFields({ name: '⚖️ Sentença', value: '5 minutos de cadeia.' })
      .setImage(gifRuim);
  }

  embeds.push(resultEmbed);
  return message.reply({ embeds });
}

async function handleDueloModalSubmit(interaction) {
  const targetQueryRaw = interaction.fields.getTextInputValue('duelo_target').trim();
  const targetQuery = targetQueryRaw.toLowerCase();
  const amountText = interaction.fields.getTextInputValue('duelo_amount').trim();
  const userId = interaction.user.id;

  if (isPrisioneiro(userId)) {
    return interaction.reply({ content: `🚓 Você não pode duelar de dentro da prisão! Faltam **${getTempoPrisaoRestante(userId)} minutos**.`, flags: MessageFlags.Ephemeral });
  }

  let targetUser = null;
  if (interaction.channel.id === '1348716118981742592' && targetQuery === 'teste') {
    targetUser = { id: 'teste_user_id', username: 'Zezinho do Teste', bot: false };
    const { getCoins, addCoins } = require("./economy");
    if (getCoins('teste_user_id') < 5000) addCoins('teste_user_id', 5000);
  } else {
    const guild = interaction.guild;
    if (guild) {
      try {
        const mentionMatch = targetQueryRaw.match(/^<@!?(\d+)>$/);
        if (mentionMatch) {
          const id = mentionMatch[1];
          const member = await guild.members.fetch(id);
          if (member) targetUser = member.user;
        } else {
          const members = await guild.members.fetch({ query: targetQuery, limit: 1 });
          if (members.size > 0) {
            targetUser = members.first().user;
          } else {
            targetUser = interaction.client.users.cache.find(u => u.id === targetQuery || u.username.toLowerCase() === targetQuery);
          }
        }
      } catch(e) {}
    }
  }

  if (!targetUser) {
    return interaction.reply({ content: "❌ Não consegui encontrar o adversário! Tente usar o ID ou o nome exato.", flags: MessageFlags.Ephemeral });
  }

  const amount = parseInt(amountText, 10);
  if (isNaN(amount) || amount <= 0) {
    return interaction.reply({ content: "Você deve apostar um valor válido maior que 0.", flags: MessageFlags.Ephemeral });
  }

  if (targetUser.id === userId) {
    return interaction.reply({ content: "Você não pode duelar com você mesmo.", flags: MessageFlags.Ephemeral });
  }

  if (targetUser.bot) {
    return interaction.reply({ content: "Bots não participam de duelos clandestinos.", flags: MessageFlags.Ephemeral });
  }

  if (isPrisioneiro(targetUser.id)) {
    return interaction.reply({ content: `O usuário ${targetUser.username} está na cadeia. Presidiários não duelam.`, flags: MessageFlags.Ephemeral });
  }

  const myCoins = getCoins(userId);
  if (myCoins < amount) {
    return interaction.reply({ content: `Você não tem ${amount} Nanacoins 🪙 para apostar! (Seu saldo: ${myCoins})`, flags: MessageFlags.Ephemeral });
  }

  const targetCoins = getCoins(targetUser.id);
  if (targetCoins < amount) {
    return interaction.reply({ content: `${targetUser.username} não tem ${amount} Nanacoins 🪙 para bancar essa aposta. Que vergonha!`, flags: MessageFlags.Ephemeral });
  }

  // Desconta logo de ambos para travar no pote
  removeCoins(userId, amount);
  removeCoins(targetUser.id, amount);

  const duelId = `duel_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const isMock = targetUser.id === 'teste_user_id';
  const mockChoice = isMock ? ["Ataque", "Defesa", "Magia"][Math.floor(Math.random() * 3)] : null;

  activeDuels.set(duelId, {
    p1: { id: userId, name: interaction.user.username, choice: null },
    p2: { id: targetUser.id, name: targetUser.username, choice: mockChoice },
    amount: amount,
    channelId: interaction.channel.id,
    messageId: null,
    timerId: null
  });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`${duelId}_Ataque`)
        .setLabel('⚔️ Ataque Rápido')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`${duelId}_Defesa`)
        .setLabel('🛡️ Defesa e Contra-Ataque')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`${duelId}_Magia`)
        .setLabel('🔮 Magia Suprema')
        .setStyle(ButtonStyle.Success)
    );

  const duelEmbed = new EmbedBuilder()
    .setColor('#000000') // Preto para cartaz de luta
    .setTitle('🥊 CARTAZ DE LUTA CLANDESTINA')
    .setDescription(`Um duelo épico está prestes a começar! As moedas já foram travadas no pote central.\nEscolham suas táticas secretamente nos botões abaixo.`)
    .addFields(
      { name: '🔴 Desafiante', value: `**${interaction.user.username}**`, inline: true },
      { name: '🔵 Desafiado', value: `**${targetUser.username}**`, inline: true },
      { name: '💰 Pote Total (Prêmio)', value: `\`${formatCoins(amount * 2)} Nanacoins\``, inline: false },
      { name: '⏳ Tempo Restante', value: '2 minutos para escolherem suas ações!', inline: false }
    )
    .setImage('https://media.giphy.com/media/QSwBid1bso4h5ePFnN/giphy.gif');

  await interaction.reply({
    content: `<@${targetUser.id}> Você foi desafiado por <@${userId}>!`,
    embeds: [duelEmbed],
    components: [row]
  });

  const sentMessage = await interaction.fetchReply();

  const duelRef = activeDuels.get(duelId);
  duelRef.messageId = sentMessage.id;

  // Timeout de 2 minutos
  duelRef.timerId = setTimeout(async () => {
    if (activeDuels.has(duelId)) {
      const duel = activeDuels.get(duelId);
      activeDuels.delete(duelId);

      // Devolve o dinheiro
      addCoins(duel.p1.id, duel.amount);
      addCoins(duel.p2.id, duel.amount);

      await sentMessage.edit({ components: [] }).catch(() => null);
      const woEmbed = new EmbedBuilder()
        .setColor('#808080')
        .setTitle('⏰ DUELO CANCELADO POR W.O!')
        .setDescription(`O duelo entre **${interaction.user.username}** e **${targetUser.username}** expirou porque alguém amarelou.\nAs apostas (\`${formatCoins(duel.amount)} Nanacoins\`) foram devolvidas para as carteiras.`);
      interaction.channel.send({ embeds: [woEmbed] });
    }
  }, 120000);
}

module.exports = {
  isPrisioneiro,
  isParrudo,
  prenderUsuario,
  handleRoubarCommand,
  handleTimeoutCommand,
  handleFiancaCommand,
  handleParrudoCommand,
  handleDueloCommand,
  handleButtonInteraction,
  handleBeijarMuroCommand,
  handleDueloModalSubmit
};
