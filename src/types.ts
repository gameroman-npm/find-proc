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

/**
 * Configuration options for find operations
 */
export interface FindConfig {
  logLevel?: "warn" | "error";
  strict?: boolean;
}

/**
 * Condition for finding processes
 */
export interface FindCondition {
  pid?: number;
  name?: string | RegExp;
  config: FindConfig;
}

/**
 * Supported find methods
 */
export type FindMethod = "port" | "pid" | "name";

/**
 * Platform-specific finder function
 */
export type PlatformFinder = (cond: FindCondition) => Promise<ProcessInfo[]>;
