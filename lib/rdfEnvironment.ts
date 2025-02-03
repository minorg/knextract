import { n3RdfEnvironment } from "@/lib/rdf-environments/n3RdfEnvironment";
// import { oxigraphRdfEnvironment } from "@/lib/rdf-environments/oxigraphRdfEnvironment";

export const rdfEnvironment = n3RdfEnvironment;
// export const rdfEnvironment = oxigraphRdfEnvironment;
export const dataFactory = rdfEnvironment.dataFactory;
export const datasetCoreFactory = rdfEnvironment.datasetCoreFactory;
