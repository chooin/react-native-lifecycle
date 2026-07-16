#!/usr/bin/env zx

$.verbose = true;

await $`tsc --noEmit`;
await $`vitest run`;
