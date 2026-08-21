import http from "node:http";

const server = http.createServer(function () {});

export default function (port: number) {
  return new Promise<void>((resolve) => {
    server.listen(port, () => {
      resolve(void 0);
    });
  });
}

export const close = function () {
  server.close();
};
