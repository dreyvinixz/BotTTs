# Plano de Teste Funcional Completo — BotTTs

## Escopo correto

Este plano valida o BotTTs inteiro do zero, usando um cenário mock com **2 servidores**, **10 usuários**, todos com **10.000 Nanacoins**, cobrindo comandos, botões, menus, modais, lógica econômica, persistência, permissões, ledger e falhas.

A Raid é apenas uma das suítes. O plano cobre também economia, loja, bolsa, inventário, forja, armas, daily, roubo, prisão, fiança, parrudo, beijar muro, games, forca, trivia, improviso, duelo, lootboxes, boss, admin, imagem, IA, voz, clear, help, rank, saldo e interações espontâneas.

---

## 0. Pré-validação do projeto atual

### Comandos técnicos obrigatórios

```bash
npm install
npm run check
npm test
node --test tests/*.test.js
```

### Observação do ZIP atual

No ambiente em que o ZIP foi analisado, `npm run check` passou. O `npm test` não pôde rodar completamente porque o ZIP estava sem `node_modules`, gerando erro de dependência ausente, principalmente `dotenv`. Antes de validar release, instalar dependências é obrigatório.

### Gatilhos de reprovação imediata

- Qualquer arquivo `.js` falhando no `npm run check`.
- Qualquer teste automatizado falhando.
- Qualquer botão sem handler ou sem resposta.
- Qualquer saldo negativo.
- Qualquer item duplicado.
- Qualquer arma duplicada.
- Qualquer recompensa paga duas vezes.
- Qualquer stake/trade/order preso sem forma de recuperar.
- Qualquer fluxo econômico sem ledger.
- Qualquer erro não tratado em `messageCreate` ou `interactionCreate`.

---

## 1. Cenário mock oficial

### Servidores

```json
{
  "guild_alpha": {
    "guildId": "guild_alpha",
    "name": "Reino Alpha",
    "eventChannelId": "chan_alpha",
    "enabled": true,
    "canAttack": true,
    "canBeRaided": true
  },
  "guild_beta": {
    "guildId": "guild_beta",
    "name": "Reino Beta",
    "eventChannelId": "chan_beta",
    "enabled": true,
    "canAttack": true,
    "canBeRaided": true
  }
}
```

### Canais

```txt
chan_alpha       canal principal/eventos do Reino Alpha
chan_beta        canal principal/eventos do Reino Beta
voice_alpha      canal de voz de Alpha
voice_beta       canal de voz de Beta
test_channel     canal de modo teste
```

### Usuários

Todos começam com **10.000 NC**.

```txt
Alpha:
alpha_01 — líder/testador principal/superadmin opcional
alpha_02 — usuário comum
alpha_03 — usuário comum
alpha_04 — usuário comum
alpha_05 — usuário comum

Beta:
beta_01 — defensor/testador principal
beta_02 — usuário comum
beta_03 — usuário comum
beta_04 — usuário comum
beta_05 — usuário comum
```

### Economia inicial

```json
{
  "alpha_01": 10000,
  "alpha_02": 10000,
  "alpha_03": 10000,
  "alpha_04": 10000,
  "alpha_05": 10000,
  "beta_01": 10000,
  "beta_02": 10000,
  "beta_03": 10000,
  "beta_04": 10000,
  "beta_05": 10000
}
```

Total inicial:

```txt
100.000 NC
```

### Arquivos de runtime devem iniciar vazios ou controlados

```txt
data/economia.json
data/inventory.json
data/timers.json
data/economy/ledger.json
data/economy/market.json
data/economy/shopStock.json
data/economy/raids.json
data/economy/raidServers.json
data/economy/activeEffects.json
```

Critério:

- O bot deve criar arquivos ausentes sem quebrar.
- Estado vazio não pode causar exceção.
- Todos os testes devem conseguir resetar estado entre suítes.

---

## 2. Matriz global de comandos

Todos os comandos abaixo precisam ser validados com:

- caso feliz;
- argumento vazio;
- argumento inválido;
- usuário sem permissão, quando aplicável;
- usuário sem saldo, quando aplicável;
- usuário errado clicando em interação de outro, quando aplicável;
- persistência após reinício, quando aplicável.

### Gerais

```txt
!help
!new
!clear
!clear 10
!clear cmd 10
```

### Economia

```txt
!saldo
!nanacoins
!atm
!dinheiro
!rank
!top
!doar @user valor
!daily
!diario
!loja
!boost
!boosts
!inventario
!inv
!equipar <weaponId/instanceId>
!bolsa
!trade
!fliperama
!lootbox
```

### Crime e risco

```txt
!roubar @user
!timeout
!fianca
!fiança
!suborno
!parrudo 1h
!parrudo 2h
!parrudo 5h
!beijarmuro
!bejarmuro
```

### Games

```txt
!games
```

Dentro dele validar Forca, Trivia/Aventura, Duelo e Lootbox.

### Raid

```txt
!raid
!raid servidores
!raid loja
!raid status
!raid proteger
!raid iniciar <id> <valor>
!raid admin cadastrar <nome>
!raid admin desativar
```

### Admin

```txt
!spawn_boss
!spawnboss
!spawn_miniboss
!spawn_mini
!econadmin resumo
```

### IA, imagem e voz

```txt
!nana <texto>
!question <texto>
!img <prompt>
!anime <prompt>
!f <texto>
```

### Respostas não-comando

```txt
menção ao bot
mensagem contendo nana
mensagem contendo botbanana
mensagem com GIF
mensagem casual/pergunta para resposta espontânea
```

---

## 3. Matriz global de botões, menus e modais

Todo `customId` precisa responder com `reply`, `update`, `deferUpdate`, `showModal` ou retorno seguro. Nenhuma interação pode ficar sem resposta.

### Loja

```txt
shop_cat_boosts_<ownerId>
shop_cat_items_<ownerId>
shop_cat_weapons_<ownerId>
shop_cat_legendary_<ownerId>
shop_cat_market_<ownerId>
boost_select_<ownerId>
weapon_select_<ownerId>
```

### Inventário e Forja

```txt
inv_equip_<ownerId>
open_forge_menu
forge_home
forge_menu_repair
forge_select_repair
forge_repair:<instanceId>:<materialId>
forge_menu_fortify
forge_select_fortify
forge_fortify_confirm:<instanceId>
forge_menu_craft
forge_select_craft
forge_craft_confirm:<weaponId>
forge_menu_buff
forge_buff_confirm:<materialId>
forge_menu_reroll
forge_select_reroll
forge_reroll_confirm:<instanceId>
```

### Bolsa

```txt
market_home_<ownerId>
market_sell_<ownerId>
market_buy_<ownerId>
market_trade_<ownerId>
market_history_<ownerId>
market_myorders_<ownerId>
market_shop_<ownerId>
market_sell_pick_<ownerId>
market_buy_pick_<ownerId>
market_trade_pick_<ownerId>
market_cancel_pick_<ownerId>
market_sell_order_<ownerId>_<kind>_<ref>
market_sell_system_<ownerId>_<kind>_<ref>
market_sell_price_<ownerId>_<kind>_<ref>
market_sell_systemamount_<ownerId>_<kind>_<ref>
market_confirm_buy_<buyerId>_<orderId>
market_trade_offer_<ownerId>_<kind>_<ref>
market_confirm_trade_<tradeId>
market_reject_trade_<tradeId>
```

### Raid

```txt
raid_home
raid_start
raid_defend
raid_shop
raid_shop_attack
raid_shop_defense
raid_my_items
raid_status
raid_servers
raid_history
raid_use_item
raid_buy_item
raid_use_item_pick
raid_start_modal
raid_join_<raidId>
raid_leave_<raidId>
raid_startnow_<raidId>
raid_cancel_<raidId>
```

Observação crítica: validar especificamente `raid_my_items`. Se o botão existir na UI, precisa ter handler.

### Games

```txt
games_menu_forca_<ownerId>
games_menu_aventura_<ownerId>
games_menu_duelo_<ownerId>
games_menu_lootbox_<ownerId>
modal_duelo_start
duelo_target
duelo_amount
```

### Forca e evento de baú

```txt
forca_r_<round>_<ownerId>
forca_tema_<tema>_<ownerId>
forca_tema_aleatorio_<ownerId>
event_claim_btn
```

### RPG/Trivia/Improviso

```txt
rpg_mode_improviso_<ownerId>
rpg_mode_enigma_<ownerId>
rpg_rounds_1_<ownerId>
rpg_rounds_3_<ownerId>
rpg_rounds_5_<ownerId>
rpg_enigma_rounds_1_<ownerId>
rpg_enigma_rounds_3_<ownerId>
rpg_enigma_rounds_5_<ownerId>
rpg_theme_geral_<ownerId>
rpg_theme_historia_<ownerId>
rpg_theme_ciencia_<ownerId>
rpg_theme_geek_<ownerId>
rpg_theme_esportes_<ownerId>
rpg_theme_musica_<ownerId>
rpg_theme_filmes_<ownerId>
rpg_theme_biologia_<ownerId>
rpg_theme_politica_<ownerId>
rpg_theme_economia_<ownerId>
rpg_theme_artelit_<ownerId>
rpg_theme_astronomia_<ownerId>
rpg_diff_facil_<ownerId>
rpg_diff_medio_<ownerId>
rpg_diff_dificil_<ownerId>
rpg_diff_infernal_<ownerId>
rpg_imp_modal
rpg_imp_input
rpg_imp_write
rpg_imp_vote_A
rpg_imp_vote_B
rpg_imp_vote_C
rpg_imp_vote_D
rpg_enigma_0
rpg_enigma_1
rpg_enigma_2
rpg_enigma_3
```

### Fliperama/Lootbox

```txt
fliperama_buy_bronze_<ownerId>
fliperama_buy_prata_<ownerId>
fliperama_buy_ouro_<ownerId>
```

### Boss

```txt
boss_basic_<messageId>
boss_heavy_<messageId>
boss_charge_<messageId>
boss_weapon_<messageId>
```

### Duelo clássico

IDs dinâmicos no formato:

```txt
<duelId>_Ataque
<duelId>_Defesa
<duelId>_Magia
```

---

## 4. Suite 1 — Smoke test de inicialização

### Testes

- `npm run check` passa.
- `npm test` passa.
- Bot inicia em `start:test`.
- Bot respeita `testChannelId` no modo teste.
- `messageCreate` ignora bots.
- `messageCreate` ignora DM.
- `interactionCreate` fora do canal de teste responde com aviso de modo teste.
- `scheduleExistingRaids` não quebra com `raids.json` vazio.

### Reprovar se

- Qualquer exceção não tratada aparecer no console.
- Bot responder fora do canal de teste em modo teste.
- Bot travar com arquivo de runtime ausente.

---

## 5. Suite 2 — Comandos gerais

### `!help`

Validar:

- Responde com embed.
- Lista economia, crime, games, IA e utilidades.
- Não menciona everyone/here.

### `!new`

Validar:

- Responde com embed de novidades.
- Não quebra se imagem/gif externo falhar.

### `!clear`

Cenários:

- `!clear`
- `!clear 10`
- `!clear 999`, deve limitar a 100.
- `!clear cmd 10`
- Sem permissão para deletar mensagens, deve responder erro amigável.
- Canal sem mensagens alvo, deve responder que não encontrou.

---

## 6. Suite 3 — Economia base

### `!saldo`

Para cada um dos 10 usuários:

- Deve mostrar 10.000 NC no início.
- Deve mostrar posição no ranking.
- Apelidos `!nanacoins`, `!atm`, `!dinheiro` funcionam.

### `!rank` / `!top`

Validar:

- Mostra top 10.
- Com 10 usuários de 10k, todos aparecem.
- Após alterações de saldo, ordena corretamente.
- Não inclui usuário de teste proibido, se configurado.

### `!doar`

Cenários:

- `alpha_01` doa 1.000 para `alpha_02`.
- Saldo `alpha_01`: 9.000.
- Saldo `alpha_02`: 11.000.
- Doar para si mesmo bloqueia.
- Doar para bot bloqueia.
- Doar zero bloqueia.
- Doar negativo bloqueia.
- Doar decimal inválido bloqueia.
- Doar mais do que saldo bloqueia.
- Doar sem mencionar usuário bloqueia.

Invariante:

- Soma total da economia não muda em doação.

---

## 7. Suite 4 — Daily e inventário simples

### `!daily` / `!diario`

Com RNG controlado, testar todos os resultados:

- Ganha moedas.
- Ganha bomba de fumaça.
- Ganha pé de coelho.
- Ganha jackpot.
- Ganha nada.
- Cooldown impede segunda coleta.
- Game boost multiplica apenas onde o código determinar.

Validar:

- Saldo muda corretamente.
- Item entra no inventário.
- Cooldown persiste em `inventory.json`.

### `!inventario` / `!inv`

Validar:

- Inventário vazio responde corretamente.
- Itens empilháveis aparecem com quantidade.
- Armas aparecem com durabilidade.
- Arma equipada aparece destacada.
- Botão Forja/Reparo aparece.
- Select `inv_equip_<ownerId>` funciona.
- Outro usuário tentando mexer no inventário é bloqueado.

---

## 8. Suite 5 — Loja `!loja`

### Painel

Validar botões:

- Boosts.
- Itens.
- Armas.
- Lendárias.
- Bolsa de Valores.

### Compra de boosts

Testar:

- `game_2x`.
- `game_3x`.
- `game_4x`.
- `steal_10`.
- `steal_20`.
- Pé de Cabra.
- Escudo de Espinhos.

Critérios:

- Saldo reduz.
- Boost ativo entra no mapa/estado correto.
- Sem saldo bloqueia.
- Outro usuário clicando no menu é bloqueado.

### Compra de itens

Testar:

- Pé de Coelho.
- Bomba de Fumaça.
- Bomba de Fumaça grátis.
- Ácido Corrosivo.
- Materiais: pedra, fragmento, essência, núcleo.
- Itens de Raid consumíveis.

Critérios:

- Item entra no inventário.
- Quantidade empilha.
- Bomba grátis respeita cooldown.
- Materiais usam preço dinâmico quando aplicável.
- Compra registra ledger quando aplicável.

### Compra de armas

Testar:

- Arma comum.
- Arma rara.
- Arma épica.
- Arma lendária.
- Sem saldo.
- Arma com `shopEnabled: false`, se existir, não aparece/não compra.

Critérios:

- Instância única criada.
- Durabilidade correta.
- `fortifyLevel` inicial 0.
- Arma aparece em `!inv`.

---

## 9. Suite 6 — Armas, equipar e durabilidade

### `!equipar`

Cenários:

- Equipar arma existente.
- Equipar arma inexistente.
- Equipar arma de outro usuário.
- Equipar sem armas.

### Durabilidade

Cenários:

- Usar arma em boss reduz durabilidade.
- Durabilidade não fica negativa.
- Arma com durabilidade zero é removida ou bloqueada conforme regra atual.
- Arma travada na Bolsa não pode ser equipada/consumida indevidamente.

---

## 10. Suite 7 — Forja completa

### Reparo

Dados:

- Dar `espada_madeira` danificada para `alpha_01`.
- Dar `pedra_amolar x10`.

Testes:

- Reparar 12/18 com pedra aumenta para 17/18.
- Reparar 16/18 com pedra não passa de 18/18.
- Material é consumido.
- Material incompatível bloqueia.
- Arma travada na Bolsa bloqueia.
- Sem material bloqueia.

### Fortificação

Testes:

- Sucesso +0 para +1.
- Falha consome material e não aumenta nível.
- +5 bloqueia nova tentativa.
- Stats de boss/duelo mudam.
- Arma travada bloqueia.

### Buff de combate

Testes:

- Usar material cria efeito ativo.
- Efeito persiste em `activeEffects.json`.
- Aplica no próximo boss/duelo.
- Expira depois do uso.
- Reiniciar bot não remove buff.

### Crafting

Testes:

- Craftar `espada_madeira`.
- Craftar `arco_cacador`.
- Craftar `machado_trovao`.
- Sem material bloqueia.
- Sem NC bloqueia.
- Arma criada começa `fortifyLevel: 0`.

### Reroll lendário

Testes:

- Lendária com ability pode rerollar.
- Núcleo é consumido.
- Chance nova fica dentro do range.
- Chance substitui a anterior, não soma.
- Arma não-lendária bloqueia.
- Lendária sem ability bloqueia.

---

## 11. Suite 8 — Bolsa `!bolsa`

### Painel

Validar:

- `market_home`.
- `market_sell`.
- `market_buy`.
- `market_trade`.
- `market_history`.
- `market_myorders`.
- `market_shop`.
- Outro usuário clicando em painel de dono é bloqueado.

### Criar ordem de venda

Testes:

- Vender arma.
- Vender item empilhável `pedra_amolar x10`.
- Preço zero bloqueia.
- Preço negativo bloqueia.
- Preço texto bloqueia.
- Quantidade zero bloqueia.
- Quantidade acima do inventário bloqueia.
- Arma/item fica travado/removido corretamente.
- Ledger registra `market_create_order`.

### Comprar ordem

Testes:

- Comprador compra ordem de arma.
- Comprador compra lote de material.
- Comprador sem saldo bloqueia.
- Comprador não pode comprar própria ordem.
- Taxa de 5% aplicada.
- Vendedor recebe líquido.
- Comprador recebe item.
- Ledger registra `market_buy` e `market_fee`.

### Cancelar ordem

Testes:

- Dono cancela ordem ativa.
- Item volta ao inventário.
- Outro usuário não cancela.
- Ordem vendida não cancela.
- Ordem expirada é tratada.

### Venda instantânea

Testes:

- Vender arma para sistema.
- Vender material x1.
- Vender material x10.
- Estoque da loja aumenta.
- Preço de venda respeita anti-arbitragem.
- Item não some sem registro.
- Ledger registra `system_sell`.

### Trade

Testes:

- Propor trade para `beta_01`.
- Alvo aceita.
- Alvo recusa.
- Propor para si mesmo bloqueia.
- Preço negativo bloqueia.
- Alvo sem saldo bloqueia no aceite.
- Item travado não pode ser vendido em outra ordem.

---

## 12. Suite 9 — Fliperama e Lootboxes

### `!fliperama` / `!lootbox`

Validar botões:

- Bronze.
- Prata.
- Ouro.
- Outro usuário clicando no botão de quem abriu é bloqueado, se o código aplicar lock.

### Bronze

Forçar RNG para:

- Pé de Coelho.
- Boost Roubo +10%.
- Bomba de Fumaça.
- Pé de Cabra.
- Arma comum.
- Coins range.
- Nada.

### Prata

Forçar RNG para:

- Ácido.
- Game 2x.
- Escudo Espinhos.
- Roubo +20%.
- Pé de Cabra.
- Game 3x.
- Arma rara.
- Coins range.
- Nada.

### Ouro

Forçar RNG para:

- Penalidade de coins.
- Spawn Boss.
- Game 4x.
- Game 3x.
- Ácido.
- Arma épica.
- Arma lendária.
- Coins range.
- Nada.

Critérios:

- Custo da caixa é removido.
- Prêmio é aplicado corretamente.
- Penalidade não deixa saldo negativo.
- Boss spawnado aparece.
- Inventário e saldo batem.

---

## 13. Suite 10 — Games hub `!games`

### Painel principal

Validar:

- Forca.
- Aventura/Trivia.
- Duelo.
- Lootbox.
- Outro usuário clicando em menu de dono é bloqueado.

### Forca

Fluxo:

- Abrir Forca.
- Escolher número de rodadas.
- Escolher tema.
- Escolher aleatório.
- Chutar letra correta.
- Chutar letra errada.
- Chutar palavra correta.
- Chutar palavra errada.
- Vencer por letras.
- Perder por erros.
- Trocar rodada.
- Timeout limpa jogo.

Critérios:

- Recompensas e penalidades corretas.
- Letras já usadas não duplicam reward.
- Dono do menu controla tema/rodadas.
- Outros podem jogar se essa for a regra atual, mas não podem configurar.

### Trivia/Enigma

Fluxo:

- Abrir Aventura.
- Escolher modo enigma/trivia.
- Escolher 1, 3 e 5 rodadas.
- Escolher tema.
- Escolher dificuldade: fácil, médio, difícil, infernal.
- Responder alternativa correta.
- Responder alternativa errada.
- Rodadas avançam.
- Pontuação final aparece.

Critérios:

- Ganhos por dificuldade corretos.
- Penalidade por erro correta.
- Perguntas não repetem indevidamente.
- Owner lock do menu funciona.

### Improviso

Fluxo:

- Escolher improviso.
- Escolher rodadas.
- Abrir modal de escrita.
- Enviar texto.
- Votar A/B/C/D.
- Apurar rodada.
- Encerrar.

Critérios:

- Modal abre.
- Texto vazio bloqueia.
- Voto inválido bloqueia.
- Mesmo usuário não vota duplicado se essa regra existir.

### Duelo via games

Fluxo:

- Abrir `!games`.
- Clicar Duelo.
- Modal com alvo e valor.
- Criar duelo contra `beta_01`.
- Jogador 1 escolhe Ataque.
- Jogador 2 escolhe Magia.
- Resolver vitória.
- Testar empate.
- Testar timeout.

Critérios:

- Ambos pagam aposta.
- Vencedor recebe pote.
- Empate devolve.
- Usuário fora do duelo não joga.
- Sem saldo bloqueia.
- Alvo inválido bloqueia.
- Bot como alvo bloqueia.

---

## 14. Suite 11 — Roubo, prisão, parrudo, fiança e beijar muro

### Roubo básico

Cenários:

- Roubo com sucesso.
- Roubo com falha.
- Roubo sem mencionar alvo.
- Roubo contra si mesmo.
- Roubo contra bot.
- Alvo com saldo abaixo do mínimo.
- Ladrão preso tentando roubar.

### Boosts de roubo

Cenários:

- Roubo com `steal_10`.
- Roubo com `steal_20`.
- Roubo com Pé de Cabra.
- Pé de Cabra aumenta percentual roubado.
- Boost expira.

### Parrudo

Cenários:

- `!parrudo 1h`.
- `!parrudo 2h`.
- `!parrudo 5h`.
- Sem saldo bloqueia.
- Roubo contra parrudo sem ácido.
- Roubo contra parrudo com ácido.
- Ácido quebra parrudo quando sucesso.
- Ácido é consumido.

### Escudo de Espinhos

Cenários:

- Alvo com escudo.
- Ladrão falha.
- Ladrão perde penalidade.
- Alvo recebe/efeito aplicado conforme regra.
- Ladrão não fica negativo.

### Bomba de Fumaça e prisão

Cenários:

- Falhar roubos até prisão.
- Com bomba de fumaça, escapar e consumir item.
- Sem bomba, prender.
- `!timeout` mostra tempo.
- `!fianca` solta a si mesmo.
- `!fianca @user` solta outro.
- Sem saldo para fiança bloqueia.

### Beijar muro

Cenários com RNG:

- Prêmio grande.
- Prêmio pequeno.
- Penalidade pequena.
- Penalidade grande.
- Prisão.
- Cooldown bloqueia repetição.
- Pé de Coelho garante resultado positivo e é consumido.

---

## 15. Suite 12 — Boss

### Spawn

Cenários:

- Admin `!spawn_boss`.
- Admin `!spawn_miniboss`.
- Não-admin bloqueado.
- Invocar boss pela loja.
- Invocar mini boss pela loja.
- Lootbox ouro spawnando boss.

### Botões de ataque

Validar:

- `boss_basic_<messageId>`.
- `boss_heavy_<messageId>`.
- `boss_charge_<messageId>`.
- `boss_weapon_<messageId>`.

Cenários:

- Ataque básico causa dano.
- Golpe pesado causa dano maior.
- Carregar aumenta próxima ação conforme regra.
- Usar arma considera arma equipada.
- Durabilidade da arma reduz.
- Cooldown de ação bloqueia spam.
- Fase do boss muda por HP.
- Fraqueza/resistência por classe aplica multiplicador.
- Lendária pode ativar ability.
- Fortificação aumenta dano.
- Buff de combate aplica e expira.

### Finalização

Cenários:

- Boss morto.
- Mini boss morto.
- Boss expira.
- Jogador sem dano mínimo não recebe prêmio.
- Prêmio em coins correto.
- Material dropa conforme tabela.
- Ledger registra `boss_material_drop`.
- Resultado final mostra ranking.

---

## 16. Suite 13 — Raid completa

Usar o plano de Raid, mas dentro do teste global.

### Fluxo feliz

- Cadastrar Alpha e Beta.
- `alpha_01` abre `!raid`.
- Abre servidores.
- Abre loja.
- Compra itens ofensivos.
- Beta compra itens defensivos.
- Alpha inicia Raid contra Beta com 5.000 NC.
- 5 atacantes entram.
- 5 defensores protegem.
- Atacantes usam itens.
- Defensores usam itens.
- Ver status dos dois lados.
- Resolver com RNG controlado.
- Aplicar taxa.
- Distribuir recompensa.
- Aplicar cooldown Alpha.
- Aplicar shield Beta.
- Registrar ledger completo.

### Falhas obrigatórias

- Raidar próprio servidor.
- Raidar servidor desativado.
- Raidar servidor sem canal.
- Stake abaixo de 2.000.
- Stake sem saldo.
- Criar duas Raids envolvendo mesmo servidor.
- Participar duplicado.
- Proteger duplicado.
- Usar item do lado errado.
- Usar item sem possuir.
- Resolver duas vezes.
- Reiniciar durante lobby.
- Reiniciar durante active.
- Reiniciar durante resolving.

---

## 17. Suite 14 — Admin e painel econômico

### Superadmin

Testar:

- Superadmin executa `!spawn_boss`.
- Superadmin executa `!spawn_miniboss`.
- Superadmin executa `!econadmin resumo`.
- Usuário comum é bloqueado.

### `!econadmin resumo`

Validar se mostra:

- Nanacoins criadas.
- Nanacoins removidas.
- Taxas da Bolsa.
- Volume de mercado.
- Rerolls lendários.
- Materiais usados.
- Materiais dropados.
- Materiais vendidos.
- Armas fortificadas.
- Top vendedores.

---

## 18. Suite 15 — IA, imagem, voz e chat espontâneo

Esses testes devem mockar serviços externos para não depender de Ollama, Forge, Edge TTS, Google TTS ou internet.

### `!nana`

- Sem texto: pede pergunta.
- Com texto: chama provider mock.
- Erro no provider: responde erro amigável.
- Resposta longa: divide em chunks.

### `!question`

- Sem texto: pede pergunta.
- Pergunta comum: provider mock responde.
- Provider falha: erro amigável.
- Pergunta de mapas Path of Exile com provider local: usa resposta fixa.

### `!img` e `!anime`

- Sem prompt: bloqueia.
- Prompt válido: chama Forge mock.
- Forge fora: erro amigável.
- Política de imagem carregada.
- Anime usa estilo anime.
- Img usa estilo realista.

### `!f`

- Usuário fora de canal de voz: bloqueia.
- Usuário em canal de voz: gera áudio mock.
- Texto vazio bloqueia.
- Erro TTS: responde erro amigável.
- Bot desconecta após idle timeout.

### Chat espontâneo

- Menção ao bot responde.
- Palavra `nana` como palavra separada responde.
- Palavra `botbanana` responde.
- Cooldown por usuário funciona.
- Cooldown por canal funciona.
- Mensagem com GIF é coletada.
- Extração de fofocas não quebra.
- Tips aparecem após threshold.

---

## 19. Teste financeiro global

Após rodar o cenário completo, calcular:

```txt
saldo_final_total = saldo_inicial_total
                   + moedas_criadas
                   - moedas_removidas
```

Separar eventos:

### Criam moeda

- Daily.
- Forca/trivia quando recompensa vem do sistema.
- Boss prize.
- Lootbox coins.
- Beijar muro prêmio.

### Removem moeda

- Loja.
- Lootbox custo.
- Taxa da Bolsa.
- Taxa de Raid.
- Crafting.
- Parrudo.
- Fiança.
- Penalidade de lootbox.

### Transferem moeda

- Doação.
- Roubo.
- Duelo.
- Compra na Bolsa.
- Trade.
- Raid dinheiro roubado antes da taxa.

Critérios:

- Nenhum evento classificado errado.
- Total final bate com ledger.
- Diferença maior que 1 NC por arredondamento reprova.

---

## 20. Teste de persistência global

Reiniciar bot nos pontos críticos:

- Após daily.
- Após compra na loja.
- Após comprar boost.
- Após criar ordem na Bolsa.
- Após criar trade.
- Durante boss ativo.
- Durante duelo aberto.
- Durante forca ativa.
- Durante raid lobby.
- Durante raid active.
- Durante raid resolving.
- Com buff ativo.
- Com usuário preso.
- Com parrudo ativo.

Critérios:

- Estado volta corretamente.
- Nada duplica.
- Nada some sem ledger.
- Timers expirados são limpos.
- Timers ativos continuam ou expiram com segurança.

---

## 21. Teste de permissão e dono de UI

Para cada painel aberto por `alpha_01`, testar clique de `alpha_02`.

Módulos:

- Loja.
- Inventário.
- Bolsa.
- Games.
- Forca configuração.
- Trivia configuração.
- Raid quando ação exige lado correto.
- Trade quando alvo correto.

Critério:

- Se a UI tem owner lock, outro usuário é bloqueado.
- Se a UI é coletiva, outro usuário pode usar apenas ações coletivas permitidas.
- Mensagem de erro deve ser amigável e ephemeral quando possível.

---

## 22. Teste de carga funcional

Cenário ampliado:

- 2 servidores.
- 10 usuários.
- Todos executando ações em sequência.

Sequência:

1. Todos consultam saldo.
2. Todos fazem daily com RNG controlado.
3. 5 compram itens na loja.
4. 5 compram armas.
5. 3 criam ordens na Bolsa.
6. 3 compram ordens.
7. 2 fazem trade.
8. 2 duelos acontecem.
9. 3 roubos acontecem.
10. 1 boss é spawnado.
11. 5 atacam boss.
12. 1 raid acontece.
13. 2 usuários usam forge.
14. Admin roda resumo.
15. Conferir saldo total e ledger.

Critérios:

- Sem exceções.
- Sem interação travada.
- Sem saldo negativo.
- Ledger consistente.
- Arquivos JSON válidos após tudo.

---

## 23. Plano de automação recomendado

Criar testes separados:

```txt
tests/full/00_setup.test.js
tests/full/01_commands_smoke.test.js
tests/full/02_economy_full.test.js
tests/full/03_shop_inventory_forge.test.js
tests/full/04_market_full.test.js
tests/full/05_games_full.test.js
tests/full/06_crime_full.test.js
tests/full/07_boss_full.test.js
tests/full/08_raid_full.test.js
tests/full/09_admin_ai_voice.test.js
tests/full/10_persistence_full.test.js
tests/full/11_financial_invariants.test.js
```

Criar helpers:

```txt
tests/helpers/mockDiscord.js
tests/helpers/mockData.js
tests/helpers/mockRng.js
tests/helpers/resetRuntime.js
tests/helpers/assertLedger.js
tests/helpers/assertEconomy.js
```

---

## 24. Helper mock Discord mínimo

```js
function fakeMessage({ guildId, channelId, userId, username, content, client }) {
  return {
    content,
    guild: { id: guildId, name: guildId === "guild_alpha" ? "Reino Alpha" : "Reino Beta" },
    guildId,
    channelId,
    author: { id: userId, username, bot: false },
    member: { voice: { channel: { id: `voice_${guildId}` } } },
    client,
    channel: {
      id: channelId,
      send: async (payload) => payload,
      messages: { fetch: async () => new Map() },
      bulkDelete: async () => null
    },
    reply: async (payload) => payload,
    delete: async () => null
  };
}

function fakeButton({ customId, guildId, channelId, userId, client }) {
  return {
    customId,
    guildId,
    channelId,
    guild: { id: guildId, name: guildId === "guild_alpha" ? "Reino Alpha" : "Reino Beta" },
    user: { id: userId, username: userId },
    client,
    isButton: () => true,
    isModalSubmit: () => false,
    isStringSelectMenu: () => false,
    reply: async (payload) => payload,
    update: async (payload) => payload,
    showModal: async (payload) => payload,
    isRepliable: () => true
  };
}
```

---

## 25. Checklist final de release

Só liberar se todos estiverem verdes:

- [ ] `npm install` concluído.
- [ ] `npm run check` passou.
- [ ] `npm test` passou.
- [ ] Todos os comandos respondem.
- [ ] Todos os botões respondem.
- [ ] Todos os selects respondem.
- [ ] Todos os modais respondem.
- [ ] Todos os fluxos felizes passam.
- [ ] Todos os fluxos inválidos são bloqueados.
- [ ] Sem saldo negativo.
- [ ] Sem item duplicado.
- [ ] Sem arma duplicada.
- [ ] Sem prêmio duplicado.
- [ ] Sem stake preso.
- [ ] Sem order/trade preso.
- [ ] Sem interação sem resposta.
- [ ] Sem arquivo JSON corrompido.
- [ ] Ledger audita economia inteira.
- [ ] Reinício do bot não quebra estado.
- [ ] Teste manual em 2 servidores reais passou.

---

## 26. Regra final

Se qualquer teste acima falhar, a versão não deve ser lançada. Corrigir, rodar o plano inteiro de novo e só então publicar.
