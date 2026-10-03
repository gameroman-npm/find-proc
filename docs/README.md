# `find-proc`

## Examples

### Find process by PID

```typescript
import { byPid } from "find-proc";

byPid(12345)
  .then((list) => {
    console.log(list);
  })
  .catch((err: Error) => {
    console.log(err.stack || err);
  });
```

### Find process listening on port 80

```typescript
import { byPort } from "find-proc";

byPort(80).then((list) => {
  if (!list.length) {
    console.log("Port 80 is free now");
  } else {
    console.log(`${list[0].name} is listening on port 80`);
  }
});
```

### Find all nginx processes

```typescript
import { byName } from "find-proc";

byName("nginx", true).then((list) => {
  console.log(`There are ${list.length} nginx process(es)`);
});
```

### Find processes with configuration options

```typescript
import { byName } from "find-proc";

const config = { strict: true };

byName("nginx", config).then((list) => {
  console.log(`Found ${list.length} nginx process(es)`);
});
```

### Using async/await

```typescript
import { byName } from "find-proc";

async function findNodeProcesses() {
  try {
    const processes = await byName("node");
    console.log(`Found ${processes.length} Node.js processes`);

    processes.forEach((proc) => {
      console.log(`PID: ${proc.pid}, Name: ${proc.name}, CMD: ${proc.cmd}`);
    });
  } catch (error) {
    console.error("Error finding processes:", error);
  }
}
```
