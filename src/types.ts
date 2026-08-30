/**
 * Process information
 */
export interface ProcessInfo {
  pid: number;
  ppid: number;
  uid?: number;
  gid?: number;
  name: string;
  bin?: string;
  cmd: string;
}

export type LogLevel = "warn" | "error";

export interface FindConfig {
  logLevel?: LogLevel;
}

export interface FindByNameConfig extends FindConfig {
  strict?: boolean;
}
