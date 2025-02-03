import { LevelWithSilentOrString, pino } from "pino";

function getLevel(): LevelWithSilentOrString {
  if (process.env["KNEXTRACT_LOG_LEVEL"]) {
    return process.env["KNEXTRACT_LOG_LEVEL"];
  }

  switch (process.env.NODE_ENV) {
    case "development":
    case "test":
      return "debug";
    default:
      return "info";
  }
}

export const logger = pino(
  {
    level: getLevel(),
  },
  pino["destination"] ? pino.destination(2) : undefined,
);
