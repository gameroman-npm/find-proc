export type LogLevel = "error" | "warn" | "info" | "debug";

let quiet = false;

export default {
  setLevel(level: LogLevel): void {
    quiet = level === "error";
  },
  warn(...args: unknown[]): void {
    if (!quiet) console.warn(...args);
  },
};
