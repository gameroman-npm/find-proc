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

export interface FindByNameConfig {
  strict?: boolean;
}
