export type LogLevel = "error" | "warn";

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
};

let currentWeight = LEVEL_WEIGHT.warn;

function enabled(level: LogLevel): boolean {
  return LEVEL_WEIGHT[level] <= currentWeight;
}

export default {
  setLevel(level: LogLevel): void {
    currentWeight = LEVEL_WEIGHT[level];
  },
  warn(...args: unknown[]): void {
    if (enabled("warn")) console.warn(...args);
  },
};
