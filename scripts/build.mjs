#!/usr/bin/env zx

$.verbose = true;

await $`tsc`;
await $`api-extractor run`;
