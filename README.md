# BotTTs

BotTTs is a Discord bot focused on Portuguese-BR voice, local LLM chat, image generation, and a serious `!question` support mode.

The project is designed to run mostly locally:

- Discord integration with `discord.js`
- Local casual/persona chat through Ollama
- Optional Gemini CLI provider for serious questions
- Text-to-speech through Microsoft Edge TTS, with optional Google Cloud TTS
- Image generation through Stable Diffusion Forge WebUI
- Runtime memory for GIFs and server notes stored under `data/`

## Features

- Casual Discord persona responses when mentioned.
- Low-frequency spontaneous replies for questions/media/casual chat.
- `!question` mode for serious, professional answers.
- Optional Gemini CLI routing for `!question`, with local Ollama fallback.
- `!imagem`, `!img`, and `!anime` commands for Forge image generation.
- `!voz`, `!f`, and `!voice` commands for voice-channel TTS.
- Auto-collection of GIF links used by the server.
- Optional long-memory notes for a configured server.

## Requirements

- Node.js 20 or newer
- A Discord bot token
- Ollama installed and running
- A local Ollama model, usually `botbanana`
- Optional: Gemini CLI logged in with Google
- Optional: Stable Diffusion Forge WebUI running with `--api`
- Optional: Google Cloud TTS credentials

## Setup

Install dependencies:

```powershell
npm install
```

Create your local environment file:

```powershell
Copy-Item examples/.env.example .env
```

Create your local Ollama Modelfile:

```powershell
New-Item -ItemType Directory -Force local/ollama
Copy-Item examples/Modelfile.example local/ollama/Modelfile
```

Edit `.env` and set at least:

```env
DISCORD_TOKEN=your_discord_bot_token
OLLAMA_MODEL=botbanana
```

Create or refresh the local Ollama model:

```powershell
npm run ollama:create
```

Start Ollama:

```powershell
ollama serve
```

Run the bot:

```powershell
npm start
```

## Commands

| Command | Purpose |
| --- | --- |
| `!help` | Show command list. |
| `!new` | Show latest bot updates. |
| `!saldo` | Check your Nanacoins balance. |
| `!rank` | View the global richest players. |
| `!roubar @user` | Try to steal Nanacoins (risks going to prison). |
| `!games` | Open the game hub for Hangman, Multiverse/Trivia, and Duels. |
| `!fliperama` | Open lootboxes and arcade rewards. |
| `!nana <text>` | Casual/persona LLM response. |
| `!question <question>` | Serious professional answer. |
| `!img <prompt>` | Generate a realistic image. |
| `!anime <prompt>` | Generate an anime-style image. |
| `!f <text>` | Speak in your current voice channel. |

The bot also responds when mentioned or when users say `nana` / `botbanana` as separate words.

## Serious Question Mode

`!question` is intentionally separated from the casual persona.

Use local Ollama only:

```env
QUESTION_PROVIDER=local
```

Use Gemini CLI with local fallback:

```env
QUESTION_PROVIDER=gemini_cli
GEMINI_CLI_MODEL=auto
```

Gemini CLI must be logged in once:

```powershell
gemini
```

The bot launches Gemini CLI on demand. The CLI does not need to stay open.

Terminal logs show provider choice, latency, and token usage for each `!question`.

## Image Generation

Forge must be running with API enabled.

From the bundled Forge directory:

```powershell
cd stable-diffusion-webui-forge
.\webui-user.bat
```

The default API endpoint is:

```env
FORGE_HOST=http://127.0.0.1:7860
```

Image prompt behavior is configured by:

```text
data/policies/politicas_imagem.txt
```

Forge model names, image size, steps, sampler, and negative prompts are configured through `.env`.

## Voice

Voice commands use Microsoft Edge TTS by default:

```env
EDGE_TTS_VOICE=pt-BR-AntonioNeural
VOICE_IDLE_TIMEOUT_MS=300000
```

The bot stays in voice for the idle timeout after the last speech, then disconnects automatically.

Google Cloud TTS can be enabled by setting:

```env
GOOGLE_APPLICATION_CREDENTIALS=local/secrets/google_credentials.json
```

## Runtime Data

Runtime files are stored under:

```text
data/
```

Default files:

- `data/gifs.json`
- `data/fofocas.json`
- `data/economia.json`
- `data/inventory.json`
- `data/timers.json`
- `data/media/`
- `data/policies/`

These files are local runtime state and should not contain source code configuration.

## Project Structure

- `index.js` - process entrypoint.
- `package.json` - npm scripts and dependencies.
- `scripts/app/` - Discord client and command router.
- `scripts/admin/` - superadmin commands and permission checks.
- `scripts/ai/` - chat, questions, images, and Ollama integrations.
- `scripts/core/` - config, storage, random helpers, UI builders, services, and shared utils.
- `scripts/economy/` - Nanacoins, inventory, boosts, lootboxes, and arcade rewards.
- `scripts/games/` - Forca, RPG/Trivia, duels, boss events, menus, and game data loaders.
- `scripts/voice/` - TTS and voice-channel handling.
- `scripts/features/` - small engagement features.
- `data/config/` and `data/games/` - editable static config and game data.
- `data/policies/` - local persona and image policy files.
- `local/` - ignored machine-local files such as Ollama Modelfile and secrets.
- `tools/` - manual utilities and local startup scripts.
- `examples/` - public templates for local files.
- `tests/` - `node:test` coverage for config, permissions, economy, games, and interactions.

## Policy Files

The bot reads policy/persona files at runtime:

- `data/policies/politicas.txt` for general chat/persona behavior
- `data/policies/politicas_imagem.txt` for image-prompt behavior only

These files are intentionally separate so image prompting can be tuned without changing chat behavior.

## Response Frequency

Spontaneous replies are controlled by `.env`:

```env
CHANCE_RESPONDER_PERGUNTA=0.12
CHANCE_RESPONDER_CASUAL=0.003
CHANCE_RESPONDER_MIDIA=0.10
COOLDOWN_USUARIO_MS=120000
COOLDOWN_CANAL_MS=60000
```

Mentions still respond immediately. Non-mentioned messages are intentionally quiet by default.

## Development

Check syntax:

```powershell
npm run check
```

Run:

```powershell
npm start
```

Regenerate the Ollama model:

```powershell
npm run ollama:create
```

Run the manual Trivia/Ollama diagnostic:

```powershell
npm run test:trivia
```

## Security Notes

Never commit `.env`, `local/`, Discord tokens, API keys, Google credentials, or generated media.

Use `examples/.env.example` as the public template and keep local secrets in `.env`.
