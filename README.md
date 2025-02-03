# Knextract

## Getting Started

### Prerequisites

1. Node 22

### One-time setup

#### Install dependencies

    script/bootstrap

#### (Optional) Populate the .gitignore'd .env file

Copy the template to `.env`:

    cp .env.template .env

The template file has comments about the semantics of the different environment variables.

### Running the app

#### In development mode

    npm run dev

### Running the Command Line Interface

The Command Line Interface (CLI) can be used to annotate batches of documents.

Run:

    script/cli --help

for help information.

### Using a SPARQL server

By default, the app runs without a database and reads RDF data from `data/knextract` on every request. In production the app should use a SPARQL server for efficiency.

#### Start the Oxigraph SPARQL server

    docker compose up oxigraph

#### One-time: specify the SPARQL endpoints

Set the `KNEXTRACT_SPARQL_*` environment variables in your `.env` file. See the `.env.template` file for documentation.

#### As needed: load the SPARQL server

    cli/load-sparql-server.sh
