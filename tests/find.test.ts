import assert from "node:assert";
import cp from "node:child_process";
import type { ChildProcessWithoutNullStreams } from "node:child_process";
import path from "node:path";
import { describe, it } from "node:test";

import { findByPort, findByPid, findByName } from "../src/index.ts";
import listen, { close } from "./fixtures/listen_port.ts";
import listenUdp, { close as closeUdp } from "./fixtures/listen_port_udp.ts";

describe("Find process test", function () {
  for (const { protocol, start, stop, port, skip } of [
    { protocol: "TCP", start: listen, stop: close, port: 12345 },
    {
      protocol: "UDP",
      start: listenUdp,
      stop: closeUdp,
      port: 12346,
      skip: process.platform === "darwin",
    },
  ] as const) {
    it(
      `should find process of listening ${protocol} port`,
      { timeout: 10_000, skip },
      async function () {
        await start(port);
        try {
          const list = await findByPort(port);
          assert.strictEqual(list.length, 1);
          assert.strictEqual(process.pid, list[0]!.pid);
        } finally {
          stop();
        }
      },
    );
  }

  it("should find process of pid", async function () {
    const file = path.join(import.meta.dirname, "fixtures/child_process.js");
    const cps: ChildProcessWithoutNullStreams = cp.spawn(process.execPath, [
      file,
    ]);

    try {
      const list = await findByPid(cps.pid!);
      assert.strictEqual(list.length, 1);
      assert.strictEqual(cps.pid, list[0]!.pid);
    } finally {
      cps.kill();
    }
  });

  it(
    "should find process list matched given name",
    { timeout: 10_000 },
    async function () {
      const file = path.join(import.meta.dirname, "fixtures/child_process.js");
      const cps: ChildProcessWithoutNullStreams = cp.spawn(process.execPath, [
        file,
        "AAABBBCCC",
      ]);

      try {
        const list = await findByName("AAABBBCCC");
        assert.strictEqual(list.length, 1);
        assert.strictEqual(cps.pid, list[0]!.pid);

        // test strict mode
        const strictList = await findByName("node", true);
        for (const item of strictList) {
          assert.strictEqual(
            item.name,
            process.platform == "win32" ? "node.exe" : "node",
          );
        }
      } finally {
        cps.kill();
      }
    },
  );

  it("should find process list matched given regexp", async function () {
    const file = path.join(import.meta.dirname, "fixtures/child_process.js");
    const cps: ChildProcessWithoutNullStreams = cp.spawn(process.execPath, [
      file,
      "AAABBBCCC",
    ]);

    try {
      const list = await findByName(/A{2,3}B{2,3}C{2,3}/gi);
      assert.strictEqual(list.length, 1);
      assert.strictEqual(cps.pid, list[0]!.pid);
    } finally {
      cps.kill();
    }
  });

  it("should resolve empty array when pid not exists", async function () {
    const list = await findByPort(100000);
    assert.strictEqual(list.length, 0);
  });
});
