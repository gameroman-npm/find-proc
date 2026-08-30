import findPidByPort from "./find_pid.ts";
import findProcess from "./find_process.ts";
import log from "./logger.ts";
import type { ProcessInfo, FindConfig, FindByNameConfig } from "./types.ts";

const DEFAULT_CONFIG: FindConfig = { logLevel: "warn" };

function applyLogLevel(config: FindConfig): void {
  if (config.logLevel) {
    log.setLevel(config.logLevel);
  }
}

function resolveConfig(options?: FindConfig): FindConfig {
  return { ...DEFAULT_CONFIG, ...options };
}

/**
 * Find the process listening on the given port
 */
export function findByPort(
  port: number,
  options?: FindConfig,
): Promise<ProcessInfo[]> {
  const config = resolveConfig(options);
  applyLogLevel(config);
  return findPidByPort(port).then(
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
export function findByPid(
  pid: number,
  options?: FindConfig,
): Promise<ProcessInfo[]> {
  const config = resolveConfig(options);
  applyLogLevel(config);
  return findProcess({ pid, config });
}

/**
 * Find processes by name
 */
export function findByName(
  name: string | RegExp,
  options?: FindByNameConfig | boolean,
): Promise<ProcessInfo[]> {
  const config: FindByNameConfig = {
    ...resolveConfig(typeof options === "object" ? options : undefined),
  };

  if (typeof options === "boolean") {
    config.strict = options;
  }

  applyLogLevel(config);

  // strict is only applicable when finding by name and the value is a string
  if (typeof name !== "string") {
    config.strict = false;
  }

  return findProcess({ name, config });
}
