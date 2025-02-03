#!/bin/sh

set -e

cd "$(dirname "$0")"

npm exec -- tsx --tsconfig ../../tsconfig.cli.json ./transform-usda-plants-corpus.ts | brotli >data/knextract/rdf/unmanaged/corpora/usda-plants-2023-08-01.nt.br
npm exec -- tsx --tsconfig ../../tsconfig.cli.json ./transform-usda-plants-concept-schemes.ts | brotli >data/knextract/rdf/unmanaged/concept_schemes/usda-plants-2023-08-01.nt.br
