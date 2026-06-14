function escapeXml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isCommand(message, commands) {
  const content = message.content.trim().toLowerCase();
  return commands.some((cmd) => content === cmd || content.startsWith(`${cmd} `));
}

function getCommandText(message, commands) {
  const raw = message.content.trim();
  const lower = raw.toLowerCase();
  const cmd = commands.find((candidate) => lower === candidate || lower.startsWith(`${candidate} `));
  return cmd ? raw.slice(cmd.length).trim() : "";
}

module.exports = {
  escapeXml,
  isCommand,
  getCommandText
};
