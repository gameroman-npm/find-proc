# `find-proc`

## Examples

### Types

```typescript
import find, { ProcessInfo, FindConfig } from "find-proc";

// Find process by PID
find("pid", 12345)
  .then((list: ProcessInfo[]) => {
    console.log(list);
  })
  .catch((err: Error) => {
    console.log(err.stack || err);
  });

// With configuration options
const config: FindConfig = {
  strict: true,
  logLevel: "warn",
};

find("name", "nginx", config).then((list: ProcessInfo[]) => {
  console.log(`Found ${list.length} nginx processes`);
});
```

### Find process listening on port 80

```typescript
import find from "find-proc";

find("port", 80).then((list) => {
  if (!list.length) {
    console.log("Port 80 is free now");
  } else {
    console.log(`${list[0].name} is listening on port 80`);
  }
});
```

### Find process by PID

```typescript
import find from "find-proc";

find("pid", 12345)
  .then((list) => {
    console.log(list);
  })
  .catch((err) => {
    console.log(err.stack || err);
  });
```

### Find all nginx processes

```typescript
import find from "find-proc";

find("name", "nginx", true).then((list) => {
  console.log(`There are ${list.length} nginx process(es)`);
});
```

### Find processes with configuration options

```typescript
import find from "find-proc";

find("name", "nginx", { strict: true, logLevel: "error" }).then((list) => {
  console.log(`Found ${list.length} nginx process(es)`);
});
```

### Using async/await

```typescript
import find from "find-proc";

async function findNodeProcesses() {
  try {
    const processes = await find("name", "node");
    console.log(`Found ${processes.length} Node.js processes`);

    processes.forEach((proc) => {
      console.log(`PID: ${proc.pid}, Name: ${proc.name}, CMD: ${proc.cmd}`);
    });
  } catch (error) {
    console.error("Error finding processes:", error);
  }
}
```
