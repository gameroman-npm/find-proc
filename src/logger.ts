export type LogLevel = "error" | "warn" | "info" | "debug";

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

let currentWeight = LEVEL_WEIGHT.warn;

function enabled(level: LogLevel): boolean {
  return LEVEL_WEIGHT[level] <= currentWeight;
}

export default {
  setLevel(level: LogLevel): void {
    currentWeight = LEVEL_WEIGHT[level];
  },
  error(...args: unknown[]): void {
    if (enabled("error")) console.error(...args);
  },
  warn(...args: unknown[]): void {
    if (enabled("warn")) console.warn(...args);
  },
  info(...args: unknown[]): void {
    if (enabled("info")) console.info(...args);
  },
};
