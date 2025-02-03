#!/bin/sh

set -e

cd "$(dirname "$0")"

npm exec -- tsx --tsconfig ../../tsconfig.cli.json ./transform-medline-plus-concept-scheme.ts data/medline-plus/mplus_topics_compressed_2024-06-06.zip | brotli >data/knextract/rdf/unmanaged/concept_schemes/medline-plus-health-topics-2024-06-06.nt.br
npm exec -- tsx --tsconfig ../../tsconfig.cli.json ./transform-medline-plus-corpus.ts data/medline-plus/mplus_topics_compressed_2024-06-06.zip | brotli >data/knextract/rdf/unmanaged/corpora/medline-plus-health-topics-2024-06-06.nt.br
npm exec -- tsx --tsconfig ../../tsconfig.cli.json ./transform-medline-plus-corpus.ts --sample data/medline-plus/mplus_topics_compressed_2024-06-06.zip | brotli >data/knextract/rdf/unmanaged/corpora/medline-plus-health-topics-2024-06-06-sample.nt.br
