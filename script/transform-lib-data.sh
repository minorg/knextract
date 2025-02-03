#!/bin/sh

set -e

cd "$(dirname "$0")/.."

npm exec -- tsx --env-file=.env --tsconfig tsconfig.cli.json script/transform-lib-data.ts "$@"

npm run check:write