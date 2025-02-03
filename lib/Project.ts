import path from "node:path";
import { fileURLToPath } from "node:url";
import { DocumentFactory } from "@/lib/DocumentFactory";
import { BlobStore } from "@/lib/blob-stores/BlobStore";
import { FsBlobStore } from "@/lib/blob-stores/FsBlobStore";
import { S3BlobStore } from "@/lib/blob-stores/S3BlobStore";
import { ontologyDataset } from "@/lib/data/ontology/ontologyDataset";
import { referenceDataset } from "@/lib/data/reference/referenceDataset";
import { LanguageModelFactory } from "@/lib/language-models";
import { logger } from "@/lib/logger";
import { ClientConfiguration, Locale, ModelSet } from "@/lib/models";
import { FsModelSet } from "@/lib/models/FsModelSet";
import { SparqlModelSet } from "@/lib/models/SparqlModelSet";
import { dataFactory, datasetCoreFactory } from "@/lib/rdfEnvironment";
import { logShaclValidationReport } from "@/lib/utilities/logShaclValidationReport";
import { RdfDirectory, intValidator } from "@kos-kit/next-utils/server";
import { existingPathValidator } from "@kos-kit/next-utils/server/envalidValidators";
import {
  HttpSparqlGraphStoreClient,
  HttpSparqlQueryClient,
  HttpSparqlUpdateClient,
  LoggingSparqlGraphStoreClient,
  LoggingSparqlQueryClient,
  LoggingSparqlUpdateClient,
  SparqlGraphStoreClient,
  SparqlQueryClient,
  SparqlUpdateClient,
} from "@kos-kit/sparql-client";
import { DatasetCore } from "@rdfjs/types";
import * as dotenv from "dotenv";
import * as envalid from "envalid";
import { Either, Right } from "purify-ts";
import SHACLValidator from "rdf-validate-shacl";
import { Memoize } from "typescript-memoize";

export class Project {
  readonly cachesDirectoryPath: string;
  readonly managedRdfDirectory: RdfDirectory;
  readonly storageDirectoryPath: string;
  readonly unmanagedRdfDirectory: RdfDirectory;
  private dataset: DatasetCore | null = null;
  private readonly env: Record<string, string>;

  constructor({
    env,
    rootDirectoryPath,
  }: { env: Record<string, string>; rootDirectoryPath: string }) {
    this.env = env;

    this.cachesDirectoryPath = path.resolve(rootDirectoryPath, "caches");
    this.managedRdfDirectory = new RdfDirectory({
      logger,
      path: path.resolve(
        rootDirectoryPath,
        "data",
        "knextract",
        "rdf",
        "managed",
      ),
    });
    this.storageDirectoryPath = path.resolve(rootDirectoryPath, "storage");
    this.unmanagedRdfDirectory = new RdfDirectory({
      logger,
      path: path.resolve(
        rootDirectoryPath,
        "data",
        "knextract",
        "rdf",
        "unmanaged",
      ),
    });
  }

  @Memoize()
  get clientConfiguration(): ClientConfiguration {
    return {
      basePath: this.nextConfiguration.basePath,
    };
  }

  @Memoize()
  get documentFactory(): DocumentFactory {
    return new DocumentFactory({
      cachesDirectoryPath: this.cachesDirectoryPath,
    });
  }

  @Memoize()
  get nextConfiguration(): {
    readonly basePath: string;
    readonly generatePageMetadata: boolean;
    readonly generateStaticParams: boolean;
    readonly publicBaseUrl: string;
    readonly publicDirectoryPath: string;
  } {
    const cleanEnv = envalid.cleanEnv(this.env, {
      KNEXTRACT_NEXT_BASE_PATH: envalid.str({ default: "" }),
      KNEXTRACT_NEXT_PUBLIC_BASE_URL: envalid.url({
        default: "http://localhost:3000/",
      }),
      KNEXTRACT_NEXT_PUBLIC_DIRECTORY_PATH: existingPathValidator({
        default: path.resolve(
          path.dirname(fileURLToPath(import.meta.url)),
          "..",
          "public",
        ),
      }),
    });

    return {
      basePath: cleanEnv.KNEXTRACT_NEXT_BASE_PATH,
      generatePageMetadata: process.env.NODE_ENV !== "development",
      generateStaticParams: false, // process.env.NODE_ENV !== "development",
      publicBaseUrl: cleanEnv.KNEXTRACT_NEXT_PUBLIC_BASE_URL,
      publicDirectoryPath: cleanEnv.KNEXTRACT_NEXT_PUBLIC_DIRECTORY_PATH,
    };
  }

  @Memoize()
  private get readOnly(): boolean {
    return envalid.cleanEnv(this.env, {
      KNEXTRACT_READ_ONLY: envalid.bool({ default: false }),
    }).KNEXTRACT_READ_ONLY;
  }

  static fromEnvironment(): Project {
    return Project.fromRootDirectoryPath(
      envalid.cleanEnv(process.env, {
        KNEXTRACT_PROJECT_DIRECTORY_PATH: existingPathValidator({
          default: path.resolve(
            path.dirname(fileURLToPath(import.meta.url)),
            "..",
            "projects",
            "medline-plus",
          ),
        }),
      }).KNEXTRACT_PROJECT_DIRECTORY_PATH,
    );
  }

  static fromRootDirectoryPath(rootDirectoryPath: string) {
    const env: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (typeof value !== "undefined") {
        env[key] = value;
      }
    }

    dotenv.config({
      path: [
        path.resolve(process.cwd(), ".env"),
        path.resolve(rootDirectoryPath, ".env"),
      ],
      processEnv: env,
    });

    return new Project({ env, rootDirectoryPath });
  }

  async blobStore(): Promise<Either<Error, BlobStore>> {
    const s3BlobStoreBucketName = envalid.cleanEnv(this.env, {
      AWS_S3_BLOB_STORE_BUCKET_NAME: envalid.str({ default: "" }),
    }).AWS_S3_BLOB_STORE_BUCKET_NAME;
    if (s3BlobStoreBucketName) {
      logger.debug("S3 blob store bucket name: %s", s3BlobStoreBucketName);

      // The AWS SDK has no way to pass a custom environment in, so have to modify process.env temporarily.
      const oldProcessEnv = { ...process.env };
      for (const key of Object.keys(this.env)) {
        process.env[key] = this.env[key];
      }
      const s3BlobStore = await S3BlobStore.create({
        bucketName: s3BlobStoreBucketName,
      });
      process.env = oldProcessEnv;
      if (s3BlobStore.isRight()) {
        return s3BlobStore;
      }
      logger.debug(
        "unable to create S3 blob store: %s",
        (s3BlobStore.extract() as Error).message,
      );
    }

    logger.debug(
      "using file system blob store: baseDirectoryPath=%s, baseUrl=%s",
      this.nextConfiguration.publicDirectoryPath,
      this.nextConfiguration.publicBaseUrl,
    );

    return Right(
      new FsBlobStore({
        baseDirectoryPath: this.nextConfiguration.publicDirectoryPath,
        baseUrl: new URL(this.nextConfiguration.publicBaseUrl),
      }),
    );
  }

  /**
   * Iterate over the datasets associated with a project. Primarily used to load/reload a ModelSet.
   */
  async *datasets(): AsyncGenerator<DatasetCore> {
    yield ontologyDataset;

    yield referenceDataset;

    for (const rdfDirectory of [
      this.managedRdfDirectory,
      this.unmanagedRdfDirectory,
    ]) {
      yield* rdfDirectory.parse({ dataFactory, datasetCoreFactory });
    }
  }

  async languageModelFactory(): Promise<LanguageModelFactory> {
    const cleanEnv = envalid.cleanEnv(this.env, {
      OPENAI_API_KEY: envalid.str({ default: "" }),
      OPENAI_USAGE_TIER: intValidator({ default: 1 }),
    });

    const languageModelSpecifications = (
      await (
        await this.modelSet({ locale: "en" })
      ).languageModelSpecifications()
    ).orDefault([]);

    return new LanguageModelFactory({
      credentials: {
        openai: cleanEnv.OPENAI_API_KEY
          ? {
              apiKey: cleanEnv.OPENAI_API_KEY,
              usageTier: cleanEnv.OPENAI_USAGE_TIER,
            }
          : null,
      },
      specifications: languageModelSpecifications,
    });
  }

  async modelSet({ locale }: { locale: Locale }): Promise<ModelSet> {
    const languageIn = [locale, ""];

    const sparqlEnv = envalid.cleanEnv(this.env, {
      KNEXTRACT_SPARQL_GRAPH_STORE_ENDPOINT_URL: envalid.url({ default: "" }),
      KNEXTRACT_SPARQL_QUERY_ENDPOINT_URL: envalid.url({ default: "" }),
      KNEXTRACT_SPARQL_UPDATE_ENDPOINT_URL: envalid.url({ default: "" }),
    });

    if (
      sparqlEnv.KNEXTRACT_SPARQL_GRAPH_STORE_ENDPOINT_URL &&
      sparqlEnv.KNEXTRACT_SPARQL_QUERY_ENDPOINT_URL &&
      sparqlEnv.KNEXTRACT_SPARQL_GRAPH_STORE_ENDPOINT_URL
    ) {
      let sparqlGraphStoreClient: SparqlGraphStoreClient =
        new HttpSparqlGraphStoreClient({
          dataFactory,
          defaultRequestOptions: {
            cache: "no-store",
          },
          endpointUrl: sparqlEnv.KNEXTRACT_SPARQL_GRAPH_STORE_ENDPOINT_URL,
          logger,
        });

      let sparqlQueryClient: SparqlQueryClient = new HttpSparqlQueryClient({
        dataFactory,
        defaultRequestOptions: {
          cache: "no-store",
          method: "POSTDirectly",
          unionDefaultGraph: true,
        },
        endpointUrl: sparqlEnv.KNEXTRACT_SPARQL_QUERY_ENDPOINT_URL,
        logger,
      });

      let sparqlUpdateClient: SparqlUpdateClient = new HttpSparqlUpdateClient({
        defaultRequestOptions: {
          cache: "no-store",
          method: "POSTDirectly",
          // usingUnionGraph: true,
        },
        endpointUrl: sparqlEnv.KNEXTRACT_SPARQL_UPDATE_ENDPOINT_URL,
        logger,
      });

      if (logger.isLevelEnabled("trace")) {
        sparqlGraphStoreClient = new LoggingSparqlGraphStoreClient({
          delegate: sparqlGraphStoreClient,
          logger,
        });
        sparqlQueryClient = new LoggingSparqlQueryClient({
          delegate: sparqlQueryClient,
          logger,
        });
        sparqlUpdateClient = new LoggingSparqlUpdateClient({
          delegate: sparqlUpdateClient,
          logger,
        });
      }

      return new SparqlModelSet({
        languageIn,
        sparqlGraphStoreClient,
        sparqlQueryClient,
        sparqlUpdateClient,
      });
    }

    if (this.readOnly && this.dataset != null) {
      logger.info("reusing previously-loaded project dataset");
      return new FsModelSet({
        dataset: this.dataset,
        languageIn,
        managedRdfDirectoryPath: this.managedRdfDirectory.path,
      });
    }

    logger.debug("loading project dataset from disk");
    const modelSetDataset = datasetCoreFactory.dataset();
    for await (const projectDataset of this.datasets()) {
      await logShaclValidationReport({
        dataGraphDescription: "project dataset",
        validationReport: new SHACLValidator(ontologyDataset).validate(
          projectDataset,
        ),
      });

      for (const quad of projectDataset) {
        modelSetDataset.add(quad);
      }
    }
    const modelSet = new FsModelSet({
      dataset: modelSetDataset,
      languageIn,
      managedRdfDirectoryPath: this.managedRdfDirectory.path,
    });

    if (this.readOnly) {
      this.dataset = modelSet.dataset;
    }
    return modelSet;
  }
}
