const { start } = require("./scripts/app/bot");

const mode = (process.argv[2] || "").toLowerCase();
const testMode = ["teste", "test", "--test", "--teste"].includes(mode);

start({ testMode });
