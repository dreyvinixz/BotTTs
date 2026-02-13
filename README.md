# BotTTs 🤖🔊

Um bot Discord que converte texto em fala usando Google Cloud Text-to-Speech API, permitindo que o bot fale mensagens em canais de voz em português brasileiro.

## 🌟 Características

- ✅ Integração com Discord.js v14
- 🎤 Síntese de voz com Google Cloud Text-to-Speech
- 🇧🇷 Suporte a português brasileiro (pt-BR)
- 🔗 Suporte a múltiplos provedores de TTS (OpenAI, ElevenLabs, gTTS)
- 🎵 Reprodução de áudio em canais de voz
- 🧹 Limpeza automática de mensagens após execução

## 📋 Pré-requisitos

- Node.js 18+
- Conta no Discord
- [Credenciais do Google Cloud](https://cloud.google.com/docs/authentication/getting-started)
- Token do Discord Bot

## 🚀 Instalação

1. Clone o repositório:

```bash
git clone https://github.com/dreyvinixz/botTTs.git
cd botTTs
```

2. Instale as dependências:

```bash
npm install
```

3. Crie um arquivo `.env` na raiz do projeto:

```env
DISCORD_TOKEN=seu_token_aqui
GOOGLE_APPLICATION_CREDENTIALS=./google_credentials.json
```

4. Configure suas credenciais do Google Cloud:
   - Baixe o arquivo JSON de credenciais
   - Salve como `google_credentials.json` na raiz do projeto

## 📝 Como Usar

1. Inicie o bot:

```bash
node index.js
```

2. Entre em um canal de voz no Discord

3. Use o comando `!f` seguido do texto:

```
!f Olá mundo
```

O bot irá se conectar ao seu canal de voz e reproduzir o áudio gerado.

## 🛠️ Dependências

```json
{
  "@discordjs/opus": "^0.10.0",
  "@discordjs/voice": "^0.19.0",
  "@google-cloud/text-to-speech": "^6.2.0",
  "discord.js": "^14.21.0",
  "dotenv": "^17.2.1",
  "elevenlabs": "^1.59.0",
  "ffmpeg-static": "^5.2.0",
  "gtts": "^0.2.1",
  "openai": "^5.12.2"
}
```

## ⚙️ Configuração

### Variáveis de Ambiente

| Variável                         | Descrição                                          |
| -------------------------------- | -------------------------------------------------- |
| `DISCORD_TOKEN`                  | Token do seu bot Discord                           |
| `GOOGLE_APPLICATION_CREDENTIALS` | Caminho para arquivo JSON de credenciais do Google |

## 📊 Estrutura do Projeto

```
botTTs/
├── index.js                    # Arquivo principal do bot
├── test.js                     # Testes
├── package.json                # Dependências do projeto
├── google_credentials.json      # Credenciais do Google Cloud
├── README.md                   # Este arquivo
└── voz.mp3                     # Arquivo de áudio gerado
```

## 🎤 Comandos

| Comando      | Descrição                                  | Exemplo         |
| ------------ | ------------------------------------------ | --------------- |
| `!f {texto}` | Faz o bot falar o texto em um canal de voz | `!f Olá galera` |

## 🔐 Segurança

⚠️ **IMPORTANTE**: Nunca compartilhe suas credenciais do Google Cloud ou token do Discord!

- Mantenha o arquivo `google_credentials.json` fora do controle de versão
- Use variáveis de ambiente para armazenar tokens
- Adicione `google_credentials.json` ao `.gitignore`

## 🐛 Troubleshooting

### O bot não conecta ao canal de voz

- Verifique se o bot tem permissões de conectar e falar em canais de voz
- Certifique-se de que você está em um canal de voz

### Erro ao gerar áudio

- Verifique se as credenciais do Google Cloud estão corretas
- Confirme se a variável `GOOGLE_APPLICATION_CREDENTIALS` está definida
- Verifique se a API Text-to-Speech está ativada no Google Cloud

### Problemas de áudio

- Certifique-se de que FFmpeg está instalado
- Reinicie o bot

## 📄 Licença

ISC

## 👤 Autor

[dreyvinixz](https://github.com/dreyvinixz)

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📚 Referências

- [Discord.js Documentation](https://discord.js.org/)
- [Google Cloud Text-to-Speech](https://cloud.google.com/text-to-speech/docs)
- [Discord Developer Portal](https://discord.com/developers/applications)
- [FFmpeg](https://ffmpeg.org/)
