import findPidByPort from "./find_pid.ts";
import findProcess from "./find_process.ts";
import log from "./logger.ts";
import type { ProcessInfo, FindConfig, FindMethod } from "./types.ts";

const findBy = {
  port(port: number, config: FindConfig): Promise<ProcessInfo[]> {
    return findPidByPort(port, config).then(
      (pid) => {
        return findBy.pid(pid, config);
      },
      () => {
        // return empty array when pid not found
        return [];
      },
    );
  },
  pid(pid: number, config: FindConfig): Promise<ProcessInfo[]> {
    return findProcess({
      pid,
      config,
    });
  },
  name(name: string, config: FindConfig): Promise<ProcessInfo[]> {
    return findProcess({
      name,
      config,
    });
  },
} as Record<
  FindMethod,
  (
    value: string | RegExp | number,
    config: FindConfig,
  ) => Promise<ProcessInfo[]>
>;

/**
 * find process by condition
 *
 * If no process found, resolve process with empty array (only reject when error occured)
 */
function find(
  by: FindMethod,
  value: string | RegExp | number,
  options?: FindConfig | boolean,
): Promise<ProcessInfo[]> {
  const config: FindConfig = Object.assign(
    {
      logLevel: "warn" as const,
      strict: typeof options === "boolean" ? options : false,
    },
    typeof options === "object" ? options : {},
  );

  // strict is applicable only when finding by name and the value is a string,
  // in all other cases whatever is passed is overwritten to false
  if (by !== "name" || typeof value !== "string") {
    config.strict = false;
  }

  if (config.logLevel) {
    log.setLevel(config.logLevel);
  }

  return new Promise((resolve, reject) => {
    if (!(by in findBy)) {
      reject(new Error(`do not support find by "${by}"`));
    } else {
      const isNumber = /^\d+$/.test(String(value));
      if (by === "pid" && !isNumber) {
        reject(new Error("pid must be a number"));
      } else if (by === "port" && !isNumber) {
        reject(new Error("port must be a number"));
      } else {
        findBy[by](value, config).then(resolve, reject);
      }
    }
  });
}

export default find;
