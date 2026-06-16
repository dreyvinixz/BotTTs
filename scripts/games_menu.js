const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require("discord.js");
const { handleForcaCommand } = require("./games");
const { handleAventuraCommand } = require("./rpg");
// No duel directly here, we show a modal for Duelo

async function handleGamesCommand(message) {
  const embed = new EmbedBuilder()
    .setColor('#FF00FF') // Magenta neon
    .setTitle('🎰 BEM-VINDO AO FLIPERAMA DO NANA 🎰')
    .setDescription('Escolha o seu veneno! Aqui você pode multiplicar seu dinheiro ou perder tudo. Clique em um dos botões abaixo para jogar:')
    .addFields(
      { name: '🎮 Forca da IA', value: 'Sobreviva à forca gerada por imagens da IA. Escolha entre 1, 3 ou 5 rodadas!' },
      { name: '🌌 Multiverso (RPG/Trivia)', value: 'Improviso maluco ou Show do Milhão. Teste sua inteligência.' },
      { name: '⚔️ Duelo Clandestino', value: 'Desafie um amigo para uma rinha tática valendo Nanacoins.' }
    )
    .setImage('https://media.giphy.com/media/l41YkxvU8c7J7Bba0/giphy.gif')
    .setFooter({ text: 'A casa sempre ganha... mentira, pode apostar tranquilo!' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('games_menu_forca')
        .setLabel('🎮 Forca')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('games_menu_aventura')
        .setLabel('🌌 RPG / Trivia')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('games_menu_duelo')
        .setLabel('⚔️ Duelo')
        .setStyle(ButtonStyle.Danger)
    );

  await message.reply({ embeds: [embed], components: [row] });
}

async function handleGamesInteraction(interaction) {
  if (interaction.isButton()) {
    if (interaction.customId === 'games_menu_forca') {
      // Começar a forca (perguntar rodadas)
      const { promptForcaRounds } = require("./games");
      return promptForcaRounds(interaction);
    }
    
    if (interaction.customId === 'games_menu_aventura') {
      // Iniciar Aventura diretamente usando a interaction (substitui a msg atual)
      const { handleAventuraCommandMenu } = require("./rpg");
      return handleAventuraCommandMenu(interaction);
    }

    if (interaction.customId === 'games_menu_duelo') {
      // Abrir modal de duelo
      const modal = new ModalBuilder()
        .setCustomId('modal_duelo_start')
        .setTitle('⚔️ Novo Duelo Clandestino');

      const targetInput = new TextInputBuilder()
        .setCustomId('duelo_target')
        .setLabel('Nome, @Menção ou ID do oponente')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex: Zezinho')
        .setRequired(true);

      const amountInput = new TextInputBuilder()
        .setCustomId('duelo_amount')
        .setLabel('Valor da Aposta (Nanacoins)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex: 100')
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(targetInput),
        new ActionRowBuilder().addComponents(amountInput)
      );

      return interaction.showModal(modal);
    }
  }

  // Handle Duelo Modal Submit
  if (interaction.isModalSubmit() && interaction.customId === 'modal_duelo_start') {
    const { handleDueloModalSubmit } = require("./duel");
    return handleDueloModalSubmit(interaction);
  }

  return false;
}

module.exports = {
  handleGamesCommand,
  handleGamesInteraction
};
