const { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, MessageFlags } = require("discord.js");
const config = require("./config");
const { addCoins } = require("./economy");
const { assertForgeReady } = require("./services");

const activeBosses = new Map();

async function spawnWorldBoss(channels) {
  // Let's create the payload once and then send it to each channel

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("boss_attack_btn")
      .setLabel("🗡️ Atacar Boss")
      .setStyle(ButtonStyle.Danger)
  );

  let attachment = null;
  
  try {
    await assertForgeReady();
    const payload = {
      prompt: "a giant fantasy monster, epic boss battle, digital art, masterpiece, high quality, highly detailed, dramatic lighting",
      negative_prompt: config.FORGE_REALISTIC_NEGATIVE_PROMPT + ", people, text, watermark",
      steps: 20,
      cfg_scale: 7.5,
      width: 512,
      height: 512,
      override_settings: {
        sd_model_checkpoint: config.FORGE_REALISTIC_MODEL
      },
      sampler_name: config.FORGE_SAMPLER,
      batch_size: 1
    };

    const response = await fetch(`${config.FORGE_HOST}/sdapi/v1/txt2img`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      const imageBase64 = data.images[0];
      const buffer = Buffer.from(imageBase64, "base64");
      attachment = new AttachmentBuilder(buffer, { name: "boss.png" });
    }
  } catch (err) {
    console.error("Erro ao gerar imagem do boss:", err);
  }

  const payloadMsg = {
    content: `@here 🚨 **ALERTA GLOBAL: UM WORLD BOSS APARECEU!** 🚨\n\nUma aberração colossal de **10.000 HP** invadiu o chat! Vocês têm **15 minutos** para derrotá-lo!\nQuem participar da batalha dividirá o grande prêmio de **10.000 Nanacoins 🪙** com base no dano causado.\n\nHP do Boss: \`10000 / 10000\``,
    components: [row]
  };

  if (attachment) {
    payloadMsg.files = [attachment];
  }

  for (const channel of channels) {
    if (!channel) continue;
    try {
      const msg = await channel.send(payloadMsg);
      
      const bossInstance = {
        hp: 10000,
        maxHp: 10000,
        damageDealt: new Map(),
        cooldowns: new Map(),
        messageId: msg.id,
        timerId: null
      };

      bossInstance.timerId = setTimeout(() => {
        if (activeBosses.has(msg.id)) {
          msg.edit({ content: "⏰ **O BOSS FUGIU!** O tempo acabou e vocês não conseguiram derrotar a criatura...", components: [] }).catch(() => null);
          activeBosses.delete(msg.id);
        }
      }, 15 * 60 * 1000);

      activeBosses.set(msg.id, bossInstance);
    } catch (err) {
      console.log(`⚠️ Falha ao spawnar World Boss no canal ${channel.id}: ${err.message}`);
    }
  }
}

async function handleBossInteraction(interaction) {
  if (!interaction.isButton() || interaction.customId !== "boss_attack_btn") return false;

  const bossInstance = activeBosses.get(interaction.message.id);
  if (!bossInstance) {
    await interaction.reply({ content: "Este boss já foi derrotado ou expirou!", flags: MessageFlags.Ephemeral });
    return true;
  }

  const userId = interaction.user.id;
  const now = Date.now();

  // Cooldown de 10 segundos
  if (bossInstance.cooldowns.has(userId)) {
    const nextAttack = bossInstance.cooldowns.get(userId);
    if (now < nextAttack) {
      const wait = Math.ceil((nextAttack - now) / 1000);
      await interaction.reply({ content: `⏳ Você precisa respirar! Aguarde **${wait}s** para atacar novamente.`, flags: MessageFlags.Ephemeral });
      return true;
    }
  }

  // Define cooldown
  bossInstance.cooldowns.set(userId, now + 10000);

  // Calcula dano aleatório (50 a 150, média 100)
  const dano = Math.floor(Math.random() * 101) + 50;
  
  // Deduz do HP
  bossInstance.hp -= dano;
  if (bossInstance.hp < 0) bossInstance.hp = 0;

  // Soma o dano deste usuário
  const totalUserDamage = (bossInstance.damageDealt.get(userId) || 0) + dano;
  bossInstance.damageDealt.set(userId, totalUserDamage);

  if (bossInstance.hp > 0) {
    await interaction.reply({ content: `💥 Você golpeou o boss e causou **${dano} de dano**!`, flags: MessageFlags.Ephemeral });
    
    // Atualiza APENAS a mensagem deste boss
    interaction.message.edit({
      content: interaction.message.content.replace(/HP do Boss: \`\d+ \/ 10000\`/, `HP do Boss: \`${bossInstance.hp} / 10000\``)
    }).catch(() => null);
    
    return true;
  } else {
    // BOSS DERROTADO!
    if (bossInstance.timerId) clearTimeout(bossInstance.timerId);
    
    const prize = 10000;
    const totalBossDamage = bossInstance.maxHp; // 10000

    let winnersText = `🏆 **WORLD BOSS DERROTADO!** 🏆\nO monstro sucumbiu! O prêmio de **${prize} Nanacoins 🪙** foi dividido:\n\n`;
    
    // Calcula recompensas e lista top atacantes (max 10 na msg para n quebrar limite)
    const sortedDamage = Array.from(bossInstance.damageDealt.entries()).sort((a, b) => b[1] - a[1]);
    
    for (let i = 0; i < sortedDamage.length; i++) {
      const [uId, dmg] = sortedDamage[i];
      const proportion = dmg / totalBossDamage;
      const userPrize = Math.floor(prize * proportion);
      
      addCoins(uId, userPrize);
      
      if (i < 10) {
        let username = "Desconhecido";
        try {
          const userObj = interaction.client.users.cache.get(uId) || await interaction.client.users.fetch(uId);
          username = userObj ? userObj.username : uId;
        } catch(e) {}
        
        winnersText += `⚔️ **${username}**: Causou ${dmg} de dano e levou **${userPrize} 🪙**\n`;
      }
    }

    if (sortedDamage.length > 10) {
      winnersText += `\n*E mais ${sortedDamage.length - 10} heróis também receberam suas partes!*`;
    }

    // Remove do Map de bosses ativos
    activeBosses.delete(interaction.message.id);

    await interaction.update({ components: [] }).catch(() => null);
    await interaction.message.edit({ content: winnersText, components: [] }).catch(() => null);

    return true;
  }
}

module.exports = {
  spawnWorldBoss,
  handleBossInteraction
};
