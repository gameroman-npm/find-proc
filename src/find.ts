import findPidByPort from "./find_pid.ts";
import findProcess from "./find_process.ts";
import type { ProcessInfo, FindByNameConfig } from "./types.ts";
import { exec } from "./utils.ts";

/**
 * Find the process listening on the given port
 */
export function byPort(port: number): Promise<ProcessInfo[]> {
  return findPidByPort(port, exec).then(
    (pid) => findProcess({ pid }),
    // return empty array when pid not found
    () => [],
  );
}

/**
 * Find the process with the given PID
 */
export function byPid(pid: number): Promise<ProcessInfo[]> {
  return findProcess({ pid });
}

/**
 * Find processes by name
 */
export function byName(
  name: string | RegExp,
  options?: FindByNameConfig | boolean,
): Promise<ProcessInfo[]> {
  const config: FindByNameConfig = {
    ...(typeof options === "object" ? options : undefined),
  };

  if (typeof options === "boolean" && typeof name === "string") {
    config.strict = options;
  }

  return findProcess({ name, config });
}
