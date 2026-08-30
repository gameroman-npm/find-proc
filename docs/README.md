# `find-proc`

## Examples

### Find process by PID

```typescript
import { findByPid } from "find-proc";

findByPid(12345)
  .then((list) => {
    console.log(list);
  })
  .catch((err: Error) => {
    console.log(err.stack || err);
  });
```

### Find process listening on port 80

```typescript
import { findByPort } from "find-proc";

findByPort(80).then((list) => {
  if (!list.length) {
    console.log("Port 80 is free now");
  } else {
    console.log(`${list[0].name} is listening on port 80`);
  }
});
```

### Find all nginx processes

```typescript
import { findByName } from "find-proc";

findByName("nginx", true).then((list) => {
  console.log(`There are ${list.length} nginx process(es)`);
});
```

### Find processes with configuration options

```typescript
import { findByName, type FindConfig } from "find-proc";

const config: FindConfig = {
  strict: true,
  logLevel: "warn",
};

findByName("nginx", config).then((list) => {
  console.log(`Found ${list.length} nginx process(es)`);
});
```

### Using async/await

```typescript
import { findByName } from "find-proc";

async function findNodeProcesses() {
  try {
    const processes = await findByName("node");
    console.log(`Found ${processes.length} Node.js processes`);

    processes.forEach((proc) => {
      console.log(`PID: ${proc.pid}, Name: ${proc.name}, CMD: ${proc.cmd}`);
    });
  } catch (error) {
    console.error("Error finding processes:", error);
  }
}
```
