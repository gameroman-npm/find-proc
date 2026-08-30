/**
 * Process information interface
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

export interface FindConfig {
  logLevel?: "warn" | "error";
}

export interface FindByNameConfig extends FindConfig {
  strict?: boolean;
}
