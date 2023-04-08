#!/usr/bin/env zx

await $`tsc --noEmit`;
await $`jest`;
