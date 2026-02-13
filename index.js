require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require("@discordjs/voice");

// --- NOVAS IMPORTAÇÕES DO GOOGLE CLOUD ---
const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
const fs = require("fs");
const util = require("util");
// -----------------------------------------

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// --- NOVO CLIENTE DO GOOGLE CLOUD ---
const googleClient = new TextToSpeechClient();
// ------------------------------------

client.once("ready", () => {
  console.log(`✅ Bot logado como ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // O comando agora é "!f"
  if (message.content.startsWith("!f")) {
    const texto = message.content.replace("!f", "").trim();
    if (!texto) {
      // Deleta a mensagem de comando vazia antes de responder
      await message.delete(); 
      return message.channel.send("Digite algo para eu falar: `!f Olá mundo`").then(msg => {
        // Apaga a mensagem de erro do bot depois de 5 segundos
        setTimeout(() => msg.delete(), 5000);
      });
    }

    if (!message.member.voice.channel) {
      return message.reply("❌ Você precisa estar em um canal de voz!");
    }

    const connection = joinVoiceChannel({
      channelId: message.member.voice.channel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator
    });

    try {
      // --- ADICIONE ESTA LINHA PARA APAGAR A MENSAGEM DO USUÁRIO ---
      await message.delete();
      // -------------------------------------------------------------

      console.log("🎤 Gerando áudio com Google Cloud...");

      const request = {
        input: { text: texto },
        voice: { languageCode: 'pt-BR', name: 'pt-BR-Wavenet-A' },
        audioConfig: { audioEncoding: 'MP3' },
      };

      const [response] = await googleClient.synthesizeSpeech(request);
      
      const writeFile = util.promisify(fs.writeFile);
      const filePath = "voz.mp3";
      await writeFile(filePath, response.audioContent, 'binary');

      console.log("▶️  Reproduzindo áudio no canal de voz...");

      const player = createAudioPlayer();
      const resource = createAudioResource(filePath);
      player.play(resource);
      connection.subscribe(player);

    } catch (err) {
      console.error("🔥 Erro ao gerar ou reproduzir a fala:", err);
      // Envia uma mensagem de erro no canal que também se apaga
      message.channel.send("⚠️ Erro ao gerar a fala com a API do Google.").then(msg => {
        setTimeout(() => msg.delete(), 5000);
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);