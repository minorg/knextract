import fs from "node:fs";
import path from "node:path";
import { ModelSet as IModelSet, Identifier } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { datasetCoreFactory, rdfEnvironment } from "@/lib/rdfEnvironment";
import { encodeFileName } from "@kos-kit/next-utils";
import { DatasetCore } from "@rdfjs/types";
import { snakeCase } from "change-case";
import * as N3 from "n3";
import { Either, EitherAsync } from "purify-ts";

function datasetToNquadsSync(dataset: DatasetCore): string {
  const writer = new N3.Writer({ format: "application/N-Quads" });
  const nquads: string[] = [];
  for (const quad of dataset) {
    nquads.push(
      writer
        .quadToString(quad.subject, quad.predicate, quad.object, quad.graph)
        .trimEnd(),
    );
  }
  return `${nquads.join("\n")}\n`;
}

export class FsModelSet extends RdfjsDatasetModelSet {
  private readonly managedRdfDirectoryPath: string;

  constructor({
    managedRdfDirectoryPath,
    ...superParameters
  }: {
    managedRdfDirectoryPath: string;
  } & ConstructorParameters<typeof RdfjsDatasetModelSet>[0]) {
    super(superParameters);
    this.managedRdfDirectoryPath = managedRdfDirectoryPath;
  }

  override async addModel(
    model: IModelSet.AddableModel,
  ): Promise<Either<Error, null>> {
    const result = await super.addModel(model);
    if (result.isLeft()) {
      return result;
    }

    const fileStem = encodeFileName(Identifier.toString(model.identifier));
    const subdirectoryPath = path.resolve(
      this.managedRdfSubdirectoryPath(model.type),
      fileStem,
    );

    await fs.promises.mkdir(subdirectoryPath, { recursive: true });
    const fileModelSet = new RdfjsDatasetModelSet();
    await fileModelSet.addModel(model);
    await fs.promises.writeFile(
      path.resolve(subdirectoryPath, `${fileStem}.trig`),
      await rdfEnvironment.serializers.serializeToString(fileModelSet.dataset, {
        format: "application/trig",
      }),
    );

    return result;
  }

  override addModelSync(model: IModelSet.AddableModel): this {
    super.addModelSync(model);

    const fileStem = encodeFileName(Identifier.toString(model.identifier));
    const subdirectoryPath = path.resolve(
      this.managedRdfSubdirectoryPath(model.type),
      fileStem,
    );

    fs.mkdirSync(subdirectoryPath, { recursive: true });
    const fileModelSet = new RdfjsDatasetModelSet();
    fileModelSet.addModelSync(model);
    fs.writeFileSync(
      path.resolve(subdirectoryPath, `${fileStem}.nq`),
      datasetToNquadsSync(fileModelSet.dataset),
    );

    return this;
  }

  override async clear(): Promise<Either<Error, null>> {
    return EitherAsync(async () => {
      await fs.promises.rm(this.managedRdfDirectoryPath, {
        force: true,
        recursive: true,
      });
      return null;
    });
  }

  override clearSync(): void {
    throw new Error("not implemented");
  }

  override cloneSync(): FsModelSet {
    const dataset = datasetCoreFactory.dataset();
    for (const quad of this.dataset.match()) {
      dataset.add(quad);
    }
    return new FsModelSet({
      dataset,
      languageIn: this.languageIn,
      managedRdfDirectoryPath: this.managedRdfDirectoryPath,
    });
  }

  override async deleteModel(
    model: IModelSet.DeletableModel,
  ): Promise<Either<Error, null>> {
    const result = await super.deleteModel(model);
    if (result.isLeft()) {
      return result;
    }

    const fileStem = encodeFileName(Identifier.toString(model.identifier));
    const subdirectoryPath = path.resolve(
      this.managedRdfSubdirectoryPath(model.type),
      fileStem,
    );
    await fs.promises.mkdir(subdirectoryPath, { recursive: true });
    const fileModelSet = new RdfjsDatasetModelSet();
    await fileModelSet.deleteModel(model);
    await fs.promises.writeFile(
      path.resolve(subdirectoryPath, `${fileStem}-deletion.trig`),
      await rdfEnvironment.serializers.serializeToString(fileModelSet.dataset, {
        format: "application/trig",
      }),
    );

    return result;
  }

  override deleteModelSync(model: IModelSet.DeletableModel): void {
    super.deleteModelSync(model);

    const fileStem = encodeFileName(Identifier.toString(model.identifier));
    const subdirectoryPath = path.resolve(
      this.managedRdfSubdirectoryPath(model.type),
      fileStem,
    );
    fs.mkdirSync(subdirectoryPath, { recursive: true });
    const fileModelSet = new RdfjsDatasetModelSet();
    fileModelSet.deleteModelSync(model);
    fs.writeFileSync(
      path.resolve(subdirectoryPath, `${fileStem}-deletion.nq`),
      datasetToNquadsSync(fileModelSet.dataset),
    );
  }

  private managedRdfSubdirectoryPath(
    modelType:
      | IModelSet.AddableModel["type"]
      | IModelSet.DeletableModel["type"],
  ): string {
    return path.resolve(this.managedRdfDirectoryPath, snakeCase(modelType));
  }
}
