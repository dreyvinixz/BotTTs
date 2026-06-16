const { EmbedBuilder } = require("discord.js");

const TIPS = [
  "Quer sair da prisão sem ter que esperar o tempo todo? Você ou alguém do lado de fora pode subornar o delegado usando `!fianca` (Custa 250 moedas)!",
  "Cansado de ser roubado enquanto dorme? Beba o famoso suco e use o comando `!parrudo 1h` para ficar imune a assaltos por uma hora inteira.",
  "Se a polícia te pegar tentando roubar duas vezes, você vai em cana! A Bomba de Fumaça da `!loja` reseta a sua ficha criminal para não ser preso.",
  "Você já girou a `!daily` hoje? Você tem direito a um giro gratuito por dia e pode tirar prêmios em moedas, um jackpot ou itens!",
  "Quer arrancar até o último centavo dos seus amigos? Compre um **Pé de Cabra** na `!loja` e seu próximo roubo bem-sucedido pode limpar de 40% a 80% da grana da vítima!",
  "O comando `!beijarmuro` é pura sorte! Você pode ganhar um beijo premiado ou ir preso. Compre um **Pé de Coelho** na `!loja` para anular qualquer azar no seu próximo beijo.",
  "Quer transferir Nanacoins de forma rápida e segura para seus amigos de gangue? Use a transferência bancária com o comando `!doar @Pessoa <valor>`.",
  "Alguém está te enchendo o saco roubando sua carteira toda hora? O **Escudo de Espinhos** da `!loja` fará o agressor perder dinheiro ao falhar contra você!",
  "O **World Boss** aparece a cada 12 horas. Fiquem ligados no chat, pois quem atacar ajuda a derrubá-lo e todos dividem uma recompensa absurda de 10.000 Nanacoins!",
  "Sabia que você não precisa iniciar um comando se quiser bater um papo rápido comigo? É só me mencionar no chat ou digitar meu nome na conversa!",
  "Seu saldo de Nanacoins está baixo? Pare de chorar e vá pro Fliperama digitando `!games`! O dinheiro não vai cair do céu, aposte e ganhe na Forca ou na Aventura!",
  "Sabe por que você é pobre? Porque não aposta num Duelo Clandestino! Digite `!games`, desafie alguém, tome o dinheiro dele e mostre quem manda!",
  "Dica de ouro: os covardes não enriquecem. Use `!beijarmuro` e `!roubar` para alavancar seu saldo! Tá esperando o quê? Jogue agora!"
];

const messageCountMap = new Map();
const lastTipTimeMap = new Map();

// Configuracoes Oficiais
const MESSAGES_THRESHOLD = 20;
const COOLDOWN_MS = 15 * 60 * 1000; // 15 minutos

async function checkAndSendTip(message) {
  const channelId = message.channel.id;
  const isTestChannel = channelId === '1348716118981742592';

  // Limites adaptativos (para podermos testar rápido no canal de testes)
  const threshold = isTestChannel ? 5 : MESSAGES_THRESHOLD;
  const cooldown = isTestChannel ? 30 * 1000 : COOLDOWN_MS;

  // Atualiza o contador de mensagens deste canal
  const count = (messageCountMap.get(channelId) || 0) + 1;
  messageCountMap.set(channelId, count);

  // Verifica se chegou na cota mínima de mensagens exigidas
  if (count >= threshold) {
    const now = Date.now();
    const lastTime = lastTipTimeMap.get(channelId) || 0;

    // Se já passou o cooldown de tempo exigido
    if (now - lastTime >= cooldown) {
      // Reseta os contadores para este canal
      messageCountMap.set(channelId, 0);
      lastTipTimeMap.set(channelId, now);

      // Sorteia uma dica aleatória
      const tipText = TIPS[Math.floor(Math.random() * TIPS.length)];

      const embed = new EmbedBuilder()
        .setColor('#FFE135') // Amarelo Banana (Único)
        .setAuthor({ name: '💡 Dicas do Nana:' })
        .setDescription(`*${tipText}*`)
        .setFooter({ text: 'Continue interagindo para descobrir mais segredos!' });

      await message.channel.send({ embeds: [embed] }).catch(() => null);
    }
  }
}

module.exports = {
  checkAndSendTip
};
