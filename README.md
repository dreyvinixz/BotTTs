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
| `!duelo @user <amount>` | Initiate a tactical button duel. |
| `!aventura` | Start the Multiverse RPG and Enigma Hub. |
| `!forca` | Play AI-generated Hangman game. |
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
politicas_imagem.txt
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
GOOGLE_APPLICATION_CREDENTIALS=path/to/google_credentials.json
```

## Runtime Data

Runtime files are stored under:

```text
data/
```

Default files:

- `data/gifs.json`
- `data/fofocas.json`

These files are local runtime state and should not contain source code configuration.

## Policy Files

The bot reads policy/persona files at runtime:

- `politicas.txt` for general chat/persona behavior
- `politicas_imagem.txt` for image-prompt behavior only

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

## Security Notes

Never commit `.env`, Discord tokens, API keys, Google credentials, or generated media.

Use `examples/.env.example` as the public template and keep local secrets in `.env`.
