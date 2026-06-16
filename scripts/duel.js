const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const { getCoins, addCoins, removeCoins, formatCoins } = require("./economy");
const { getStealChanceExtra } = require("./boosts");
const { pedirRespostaAoOllama } = require("./ollama");

// Prisão state in memory: Map<userId, expireTimestampMs>
const prisonMap = new Map();

// Parrudo state in memory: Map<userId, expireTimestampMs>
const parrudoMap = new Map();

function isParrudo(userId) {
  if (!parrudoMap.has(userId)) return false;
  const expire = parrudoMap.get(userId);
  if (Date.now() > expire) {
    parrudoMap.delete(userId);
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
    return false;
  }
  return true;
}

function prenderUsuario(userId, minutes) {
  prisonMap.set(userId, Date.now() + minutes * 60_000);
}

function getTempoPrisaoRestante(userId) {
  if (!prisonMap.has(userId)) return 0;
  const rest = prisonMap.get(userId) - Date.now();
  return Math.ceil(rest / 60_000);
}

// Limpeza de Memória Periódica (a cada 1 hora)
setInterval(() => {
  const now = Date.now();
  for (const [userId, expire] of prisonMap.entries()) {
    if (now > expire) prisonMap.delete(userId);
  }
  for (const [userId, expire] of parrudoMap.entries()) {
    if (now > expire) parrudoMap.delete(userId);
  }
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
    // Tenta achar pelo ID, username ou globalName no cache
    targetUser = message.client.users.cache.find(u => 
      u.id === targetQuery || 
      u.username.toLowerCase() === targetQuery || 
      (u.globalName && u.globalName.toLowerCase() === targetQuery)
    );
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
    return message.reply(`🛡️ O usuário ${targetUser.username} tomou o suco e está **PARRUDO**! Ele está imune a roubos no momento.`);
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

  if (success) {
    // Rouba entre 10% e 50% do dinheiro do alvo
    const percent = 0.10 + Math.random() * 0.40;
    const stolen = Math.floor(targetCoins * percent);

    removeCoins(targetUser.id, stolen);
    addCoins(userId, stolen);

    return message.reply(`🥷 **SUCESSO!** Você agiu pelas sombras e roubou **${stolen} Nanacoins 🪙** do ${targetUser.username}!`);
  } else {
    // Falha e vai para a prisão por 10 minutos (exceto ID especial)
    if (userId === '762478935615078401') {
      return message.reply(`🚨 **PARADO AÍ!** A polícia te pegou tentando roubar o ${targetUser.username}.\nMas você foi muito liso, subornou os guardas e escapou sem levar timeout!`);
    } else {
      prenderUsuario(userId, 10);
      return message.reply(`🚨 **PARADO AÍ!** A polícia te pegou tentando roubar o ${targetUser.username}.\nVocê foi enviado para a **PRISÃO** e ficará 10 minutos sem poder jogar ou ganhar moedas!`);
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
  if (!isPrisioneiro(userId)) {
    return message.reply("Você não está na prisão no momento!");
  }

  const myCoins = getCoins(userId);
  if (myCoins < 250) {
    return message.reply(`Você precisa de **250 Nanacoins 🪙** para pagar a fiança e sair da cadeia! (Seu saldo: ${myCoins})`);
  }

  removeCoins(userId, 250);
  prisonMap.delete(userId);
  return message.reply("💸 **FIANÇA PAGA!** Você subornou o delegado com **250 Nanacoins 🪙** e está livre para voltar às ruas!");
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
  const requestedHours = match ? parseInt(match[1], 10) : 2; // Default is 2h

  let cost = 0;
  let durationHours = 0;

  if (requestedHours <= 2) {
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
  return message.reply(`🛡️ **MODO PARRUDO ATIVADO!** Você bebeu o suco, pagou ${formatCoins(cost)} Nanacoins 🪙 e ficará **irroubável por ${durationHours} horas**! Ninguém pode encostar no seu dinheiro.`);
}

async function handleDueloCommand(message, text) {
  const userId = message.author.id;

  if (isPrisioneiro(userId)) {
    return message.reply(`🚓 Você não pode duelar de dentro da prisão! Faltam **${getTempoPrisaoRestante(userId)} minutos**.`);
  }

  const args = text.split(/\s+/);
  const mentions = message.mentions.users;
  const targetUser = mentions.first();

  if (!targetUser || args.length < 2) {
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
  let amountText = args[1];
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

  activeDuels.set(duelId, {
    p1: { id: userId, name: message.author.username, choice: null },
    p2: { id: targetUser.id, name: targetUser.username, choice: null },
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

  const sentMessage = await message.channel.send({
    content: `🥊 **DUELO TÁTICO INICIADO!**\n**${message.author.username}** desafiou **${targetUser.username}** por **${amount} Nanacoins 🪙**!\n\nAs moedas foram travadas no pote. Escolham suas táticas clicando nos botões abaixo! Somente vocês saberão a escolha.\n⏳ *Vocês têm 2 minutos para fazer suas jogadas!*`,
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
      message.channel.send(`⏰ **DUELO CANCELADO POR W.O!**\nO duelo entre ${message.author.username} e ${targetUser.username} expirou porque alguém amarelou. As apostas (${duel.amount} 🪙) foram devolvidas.`);
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

    const m = await channel.send(`⚔️ **CALCULANDO O RESULTADO DO DUELO...**\n${duel.p1.name} e ${duel.p2.name} já fizeram suas escolhas. O Ollama está narrando a treta!`);

    const narracao = await narrarResolucaoOllama(
      duel.p1.name, duel.p1.choice,
      duel.p2.name, duel.p2.choice,
      winner === "Empate" ? "Empate" : winner.name,
      reason
    );

    await m.edit(`🔥 **A RESOLUÇÃO DO DUELO** 🔥\n\n${narracao}\n\n${resultadoFinal}`);
  }
}

module.exports = {
  handleRoubarCommand,
  handleDueloCommand,
  handleButtonInteraction,
  handleTimeoutCommand,
  handleFiancaCommand,
  handleParrudoCommand,
  isPrisioneiro
};
