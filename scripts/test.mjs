#!/usr/bin/env zx

await $`rm -rf yarn.lock`;
await $`tsc --noEmit`;
