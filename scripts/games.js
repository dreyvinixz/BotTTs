const { AttachmentBuilder } = require("discord.js");
const config = require("./config");
const { assertForgeReady } = require("./services");
const { addCoins, removeCoins } = require("./economy");

const forcaGames = new Map();

const PALAVRAS = [
  "CACHORRO", "GATO", "COMPUTADOR", "ASTRONAUTA", "DRAGAO",
  "CASTELO", "PIZZA", "HAMBURGUER", "TELEFONE", "CARRO",
  "MOTOCICLETA", "ELEFANTE", "GIRAFA", "PIRATA", "TESOURO",
  "FOGUETE", "PLANETA", "ESTRELA", "GALAXIA", "DINOSSAURO",
  "VAMPIRO", "LOBISOMEM", "FANTASMA", "ESQUELETO", "BRUXA",
  "MAGO", "GUERREIRO", "ESPADA", "ESCUDO", "ARQUEIRO"
];

const FORCA_FACES = [
  "💀 (Enforcado!)",
  "😵 (Quase lá...)",
  "🤕 (Machucado)",
  "😨 (Desesperado)",
  "😟 (Assustado)",
  "😐 (Preocupado)",
  "🙂 (Tranquilo)"
];

function maskWord(word, guessed) {
  return word.split("").map(char => guessed.has(char) ? char : "_").join(" ");
}

function getForcaEmbedText(gameState) {
  const face = FORCA_FACES[gameState.lives];
  const masked = maskWord(gameState.word, gameState.guessed);
  const chutes = Array.from(gameState.guessed).join(", ") || "Nenhum";
  const coracoes = "❤️ ".repeat(gameState.lives) + "🖤 ".repeat(6 - gameState.lives);
  
  return `🎮 **JOGO DA FORCA DA IA!**
Chute uma letra enviando-a sozinha no chat.

**Palavra:** \`${masked}\`
**Chutes:** ${chutes}

**Status:** ${face}
**Vidas:** ${coracoes}`;
}

function resetForcaTimer(channelId, channel) {
  const gameState = forcaGames.get(channelId);
  if (!gameState) return;
  
  if (gameState.timerId) clearTimeout(gameState.timerId);
  
  gameState.timerId = setTimeout(() => {
    if (forcaGames.has(channelId)) {
      const g = forcaGames.get(channelId);
      forcaGames.delete(channelId);
      if (g.mainMessage) {
         g.mainMessage.edit(`⏰ **O JOGO EXPIROU POR INATIVIDADE!**\nA palavra era **${g.word}**!\n\n${getForcaEmbedText(g)}`).catch(() => null);
      }
    }
  }, 300000); // 5 minutes
}

async function handleForcaCommand(message) {
  const channelId = message.channel.id;
  if (forcaGames.has(channelId)) {
    return message.reply("❌ Já tem um jogo da forca rolando neste canal! Adivinhe a palavra ou espere acabar.");
  }

  const word = PALAVRAS[Math.floor(Math.random() * PALAVRAS.length)];
  const gameState = {
    word: word,
    guessed: new Set(),
    lives: 6,
    mainMessage: null,
    timerId: null
  };
  
  forcaGames.set(channelId, gameState);
  resetForcaTimer(channelId, message.channel);

  const m = await message.channel.send("🎨 A IA está pintando a dica visual (isso pode demorar uns segundos)...");

  // Generate image using Forge
  const promptEmIngles = `professional realistic photo, ${word.toLowerCase()}, central focus, sharp detail, high quality masterpiece`;
  
  const payload = {
    prompt: promptEmIngles,
    negative_prompt: config.FORGE_REALISTIC_NEGATIVE_PROMPT,
    steps: 20,
    width: 512,
    height: 512,
    override_settings: {
      sd_model_checkpoint: config.FORGE_REALISTIC_MODEL
    },
    sampler_name: config.FORGE_SAMPLER,
    batch_size: 1
  };

  try {
    await assertForgeReady();
    const response = await fetch(`${config.FORGE_HOST}/sdapi/v1/txt2img`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }

    const data = await response.json();
    const imageBase64 = data.images[0];
    const buffer = Buffer.from(imageBase64, "base64");
    const attachment = new AttachmentBuilder(buffer, { name: "dica_forca.png" });

    const mainMsg = await message.reply({ 
      content: getForcaEmbedText(gameState), 
      files: [attachment] 
    });
    gameState.mainMessage = mainMsg;
    await m.delete().catch(() => null);

  } catch (err) {
    console.error("Erro no forge forca:", err);
    await m.edit(`⚠️ Não consegui gerar a imagem da dica (${err.message}), mas o jogo continua!`);
    const mainMsg = await message.channel.send(getForcaEmbedText(gameState));
    gameState.mainMessage = mainMsg;
  }
}

// Retorna true se a mensagem foi tratada pelo jogo da forca
function checkForcaGuess(message) {
  const channelId = message.channel.id;
  const gameState = forcaGames.get(channelId);
  if (!gameState) return false;

  const text = message.content.trim().toUpperCase();
  
  // Chute de letra única
  if (text.length === 1 && /[A-Z]/.test(text)) {
    message.delete().catch(() => null); // Apaga o chute para limpar o chat
    resetForcaTimer(channelId, message.channel);

    if (gameState.guessed.has(text)) {
      return true; // Ignora letras repetidas silenciosamente
    }

    gameState.guessed.add(text);

    if (!gameState.word.includes(text)) {
      gameState.lives--;
    } else {
      // Letra correta! Ganha 1 Nanacoin
      addCoins(message.author.id, 1);
    }

    const won = gameState.word.split("").every(char => gameState.guessed.has(char));
    
    if (won) {
      if (gameState.timerId) clearTimeout(gameState.timerId);
      forcaGames.delete(channelId);
      addCoins(message.author.id, 50); // Recompensa por terminar o jogo
      gameState.mainMessage.edit(`🎉 **VITÓRIA!** O jogador ${message.author.username} adivinhou a última letra e ganhou **50 Nanacoins 🪙**!\nA palavra era **${gameState.word}**!\n\n${getForcaEmbedText(gameState)}`).catch(() => null);
      return true;
    } else if (gameState.lives <= 0) {
      if (gameState.timerId) clearTimeout(gameState.timerId);
      forcaGames.delete(channelId);
      gameState.mainMessage.edit(`💀 **GAME OVER!** Vocês foram enforcados!\nA palavra era **${gameState.word}**!\n\n${getForcaEmbedText(gameState)}`).catch(() => null);
      return true;
    } else {
      gameState.mainMessage.edit(getForcaEmbedText(gameState)).catch(() => null);
      return true;
    }
  }

  // Chute da palavra inteira
  if (text.length > 1 && /^[A-Z]+$/.test(text)) {
    message.delete().catch(() => null); // Apaga o chute do chat
    resetForcaTimer(channelId, message.channel);

    if (text === gameState.word) {
      if (gameState.timerId) clearTimeout(gameState.timerId);
      forcaGames.delete(channelId);
      addCoins(message.author.id, 150); // Recompensa Épica
      gameState.mainMessage.edit(`🎉 **VITÓRIA ÉPICA!** O jogador ${message.author.username} adivinhou a palavra inteira de uma vez e ganhou **150 Nanacoins 🪙**!\nA palavra era **${gameState.word}**!\n\n${getForcaEmbedText(gameState)}`).catch(() => null);
      return true;
    } else {
      gameState.lives--;
      if (gameState.lives <= 0) {
        if (gameState.timerId) clearTimeout(gameState.timerId);
        forcaGames.delete(channelId);
        removeCoins(message.author.id, 30);
        gameState.mainMessage.edit(`💀 **GAME OVER!** O jogador ${message.author.username} chutou a palavra errada, matou o boneco e perdeu **30 Nanacoins 🪙**!\nA palavra era **${gameState.word}**!\n\n${getForcaEmbedText(gameState)}`).catch(() => null);
        return true;
      } else {
        gameState.mainMessage.edit(`❌ Palavra errada! Perderam 1 vida.\n\n${getForcaEmbedText(gameState)}`).catch(() => null);
        return true;
      }
    }
  }

  return false;
}

module.exports = {
  handleForcaCommand,
  checkForcaGuess
};
