import fs from "node:fs/promises";
import path from "node:path";
import { ModelSet as IModelSet, Identifier } from "@/lib/models";
import { RdfjsDatasetModelSet } from "@/lib/models/RdfjsDatasetModelSet";
import { datasetCoreFactory, rdfEnvironment } from "@/lib/rdfEnvironment";
import { encodeFileName } from "@kos-kit/next-utils";
import { snakeCase } from "change-case";
import { Either, EitherAsync } from "purify-ts";

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

    await fs.mkdir(subdirectoryPath, { recursive: true });
    const fileModelSet = new RdfjsDatasetModelSet();
    await fileModelSet.addModel(model);
    await fs.writeFile(
      path.resolve(subdirectoryPath, `${fileStem}.trig`),
      await rdfEnvironment.serializers.serializeToString(fileModelSet.dataset, {
        format: "application/trig",
      }),
    );

    return result;
  }

  override addModelSync(_model: IModelSet.AddableModel): this {
    throw new Error("not implemented");
  }

  override async clear(): Promise<Either<Error, null>> {
    return EitherAsync(async () => {
      await fs.rm(this.managedRdfDirectoryPath, {
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
    await fs.mkdir(subdirectoryPath, { recursive: true });
    const fileModelSet = new RdfjsDatasetModelSet();
    await fileModelSet.deleteModel(model);
    await fs.writeFile(
      path.resolve(subdirectoryPath, `${fileStem}-deletion.trig`),
      await rdfEnvironment.serializers.serializeToString(fileModelSet.dataset, {
        format: "application/trig",
      }),
    );

    return result;
  }

  override deleteModelSync(_model: IModelSet.DeletableModel): void {
    throw new Error("not implemented");
  }

  private managedRdfSubdirectoryPath(
    modelType:
      | IModelSet.AddableModel["type"]
      | IModelSet.DeletableModel["type"],
  ): string {
    return path.resolve(this.managedRdfDirectoryPath, snakeCase(modelType));
  }
}
