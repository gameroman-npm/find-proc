import * as fs from "node:fs";
import * as os from "node:os";

import type { LogLevel } from "./types.ts";
import { exec as execCmdRaw, stripLine, extractColumns } from "./utils.ts";

const ensureDir = (path: string): Promise<void> =>
  new Promise((resolve, reject) => {
    if (fs.existsSync(path)) {
      resolve();
    } else {
      fs.mkdir(path, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    }
  });

/**
 * Execute command and return stdout/stderr as a promise
 */
function execCmd(
  cmd: string,
  execFn: typeof execCmdRaw,
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFn(cmd, function (err, stdout, stderr) {
      if (err) {
        reject(err);
      } else {
        resolve({ stdout: stdout, stderr: stderr.trim() });
      }
    });
  });
}

/**
 * Check if column's address field ends with :port
 */
function matchPort(column: string[], port: number): boolean {
  const matches = String(column[0]).match(/:(\d+)$/);
  return matches != null && matches[1] === String(port);
}

function isValidPid(pid: number): boolean {
  return !isNaN(pid) && pid > 0;
}

function findPidBySs(
  port: number,
  execFn: typeof execCmdRaw,
  logLevel?: LogLevel,
): Promise<number> {
  return execCmd("ss -tunlp", execFn).then(({ stdout, stderr }) => {
    if (stderr && logLevel !== "error") {
      console.warn(stderr);
    }

    // strip header line
    // Columns: Netid(0) State(1) Recv-Q(2) Send-Q(3) Local Address:Port(4) Peer Address:Port(5) Process(6)
    const data = stripLine(stdout, 1);
    const columns = extractColumns(data, [4, 6], 7).find((column) =>
      matchPort(column, port),
    );

    if (columns?.[1]) {
      const pidMatch = columns[1].match(/pid=(\d+)/);
      if (pidMatch?.[1]) {
        const pid = parseInt(pidMatch[1], 10);
        if (isValidPid(pid)) {
          return pid;
        }
      }
    }

    throw new Error(`pid of port (${port}) not found`);
  });
}

function findPidByNetstatLinux(
  port: number,
  execFn: typeof execCmdRaw,
  logLevel?: LogLevel,
): Promise<number> {
  return execCmd("netstat -tunlp", execFn).then(({ stdout, stderr }) => {
    if (stderr && logLevel !== "error") {
      // netstat -p ouputs warning if user is no-root
      console.warn(stderr);
    }

    // replace header
    const data = stripLine(stdout, 2);
    const columns = extractColumns(data, [3, 6], 7).find((column) =>
      matchPort(column, port),
    );

    if (columns?.[1]) {
      const pid = parseInt(columns[1].split("/", 1)[0]!, 10);

      if (isValidPid(pid)) {
        return pid;
      }
    }

    throw new Error(`pid of port (${port}) not found`);
  });
}

function findPidByNetstatDarwin(
  port: number,
  execFn: typeof execCmdRaw,
  logLevel?: LogLevel,
): Promise<number> {
  return execCmd("netstat -anv -p TCP && netstat -anv -p UDP", execFn).then(
    ({ stdout, stderr }) => {
      if (stderr && logLevel !== "error") {
        console.warn(stderr);
      }

      // Drop group header, e.g. "Active Internet connections"
      const table = stripLine(stdout, 1);
      // Get the next line with the column headers
      const headers = table.slice(0, table.indexOf("\n"));
      // Drop the header line to get the table body
      const body = stripLine(table, 1);

      // In macOS >=Sequoia, columns include `rxbytes` and `txbytes`, which
      // shifts the PID column to index 10. Detect this with a search
      // for rxbytes. (Parsing the headers more robustly isn't possible
      // because some colmn names contain spaces, and others are only separated
      // by a single space.)
      const pidColumn = headers.indexOf("rxbytes") >= 0 ? 10 : 8;

      const found = extractColumns(body, [0, 3, pidColumn], 10)
        .filter((row) => {
          return !!String(row[0]).match(/^(udp|tcp)/);
        })
        .find((row) => {
          const matches = String(row[1]).match(/\.(\d+)$/);
          if (matches && matches[1] === String(port)) {
            return true;
          }
          return false;
        });

      if (found?.[2]?.length) {
        // PID column can be "pid" or "processname:pid"
        const pidCell = found[2];
        const pidMatch = pidCell.match(/:(\d+)$/);
        const pid = pidMatch?.[1]
          ? parseInt(pidMatch[1], 10)
          : parseInt(pidCell, 10);
        if (isValidPid(pid)) {
          return pid;
        }
      }

      throw new Error(`pid of port (${port}) not found`);
    },
  );
}

function findPidByLsof(
  port: number,
  execFn: typeof execCmdRaw,
  logLevel?: LogLevel,
): Promise<number> {
  return execCmd(`lsof -nP -i :${port}`, execFn).then(({ stdout, stderr }) => {
    if (stderr && logLevel !== "error") {
      console.warn(stderr);
    }

    // strip header line
    // lsof columns: COMMAND(0) PID(1) USER(2) ...
    const data = stripLine(stdout, 1);
    const columns = extractColumns(data, [1], 2);

    for (const col of columns) {
      const pid = parseInt(col[0]!, 10);
      if (isValidPid(pid)) {
        return pid;
      }
    }

    throw new Error(`pid of port (${port}) not found`);
  });
}

const finders: Record<
  string,
  (
    port: number,
    execFn: typeof execCmdRaw,
    logLevel?: LogLevel,
  ) => Promise<number>
> = {
  darwin(
    port: number,
    execFn: typeof execCmdRaw,
    logLevel?: LogLevel,
  ): Promise<number> {
    return findPidByNetstatDarwin(port, execFn, logLevel).catch(() => {
      return findPidByLsof(port, execFn, logLevel);
    });
  },

  linux(
    port: number,
    execFn: typeof execCmdRaw,
    logLevel?: LogLevel,
  ): Promise<number> {
    return findPidBySs(port, execFn, logLevel)
      .catch(() => findPidByNetstatLinux(port, execFn, logLevel))
      .catch(() => findPidByLsof(port, execFn, logLevel));
  },

  win32(port: number, execFn: typeof execCmdRaw): Promise<number> {
    return execCmd("netstat -ano", execFn).then(({ stdout, stderr }) => {
      if (stderr) {
        throw new Error(stderr);
      }

      // replace header
      const data = stripLine(stdout, 4);
      // Extract address(1), and both possible PID positions:
      // TCP has State at index 3, PID at index 4 (5 columns)
      // UDP has no State column, PID at index 3 (4 columns)
      const columns = extractColumns(data, [1, 3, 4], 5).find((column) =>
        matchPort(column, port),
      );

      if (columns) {
        // TCP: PID at index 4 → columns[2]; UDP: PID at index 3 → columns[1]
        const pidStr = columns[2] !== "" ? columns[2]! : columns[1]!;
        const pid = parseInt(pidStr, 10);
        if (isValidPid(pid)) {
          return pid;
        }
      }

      throw new Error(`pid of port (${port}) not found`);
    });
  },

  android(port: number, execFn: typeof execCmdRaw): Promise<number> {
    return new Promise((resolve, reject) => {
      // on Android Termux, an warning will be emitted when executing `netstat`
      // with option `-p` says 'showing only processes with your user ID', but
      // it can still fetch the information we need. However, NodeJS treat this
      // warning as an error, `util.exec()` will get nothing but the error. To
      // get the true output of the command, we need to save it to a tmpfile and
      // read that file instead.
      const dir = os.tmpdir() + "/.find-process";
      const file = dir + "/" + process.pid;
      const cmd = 'netstat -tunp >> "' + file + '"';

      // oxlint-disable-next-line typescript/no-floating-promises
      ensureDir(dir).then(() => {
        execFn(cmd, () => {
          fs.readFile(file, "utf8", (err, data) => {
            fs.unlink(file, () => {});
            if (err) {
              reject(err);
            } else {
              data = stripLine(data, 2);
              const columns = extractColumns(data, [3, 6], 7).find((column) =>
                matchPort(column, port),
              );

              if (columns?.[1]) {
                const pid = parseInt(columns[1].split("/", 1)[0]!, 10);

                if (isValidPid(pid)) {
                  resolve(pid);
                } else {
                  reject(new Error(`pid of port (${port}) not found`));
                }
              } else {
                reject(new Error(`pid of port (${port}) not found`));
              }
            }
          });
        });
      });
    });
  },
};

// Alias for other platforms
// @ts-expect-error
finders.freebsd = finders.darwin;
// @ts-expect-error
finders.sunos = finders.darwin;

function findPidByPort(
  port: number,
  execFn: typeof execCmdRaw = execCmdRaw,
  logLevel?: LogLevel,
): Promise<number> {
  const platform = process.platform;

  return new Promise((resolve, reject) => {
    const finder = finders[platform];

    if (!finder) {
      return reject(new Error(`platform ${platform} is unsupported`));
    }

    finder(port, execFn, logLevel).then(resolve, reject);
  });
}

export default findPidByPort;
