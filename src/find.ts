import findPidByPort from "./find_pid.ts";
import findProcess from "./find_process.ts";
import type { ProcessInfo, FindConfig, FindByNameConfig } from "./types.ts";
import { exec } from "./utils.ts";

function resolveConfig(options?: FindConfig): FindConfig {
  return { logLevel: "warn", ...options };
}

/**
 * Find the process listening on the given port
 */
export function byPort(
  port: number,
  options?: FindConfig,
): Promise<ProcessInfo[]> {
  const config = resolveConfig(options);
  return findPidByPort(port, exec, config.logLevel).then(
    (pid) => {
      return findProcess({ pid, config });
    },
    () => {
      // return empty array when pid not found
      return [];
    },
  );
}

/**
 * Find the process with the given PID
 */
export function byPid(
  pid: number,
  options?: FindConfig,
): Promise<ProcessInfo[]> {
  const config = resolveConfig(options);
  return findProcess({ pid, config });
}

/**
 * Find processes by name
 */
export function byName(
  name: string | RegExp,
  options?: FindByNameConfig | boolean,
): Promise<ProcessInfo[]> {
  const config: FindByNameConfig = {
    ...resolveConfig(typeof options === "object" ? options : undefined),
  };

  if (typeof options === "boolean" && typeof name === "string") {
    config.strict = options;
  }

  return findProcess({ name, config });
}
