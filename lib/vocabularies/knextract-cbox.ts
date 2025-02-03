import namespace, { NamespaceBuilder } from "@rdfjs/namespace";
import { NamedNode } from "@rdfjs/types";

export interface KnextractCbox {
  "": NamedNode<"http://purl.archive.org/purl/knextract/cbox#">;

  // _EncodingType_TextHtml: NamedNode<"http://purl.archive.org/purl/knextract/cbox#_EncodingType_TextHtml">;
  // _EncodingType_TextPlain: NamedNode<"http://purl.archive.org/purl/knextract/cbox#_EncodingType_TextPlain">;
  // _Role_AI: NamedNode<"http://purl.archive.org/purl/knextract/cbox#_Role_AI">;
  // _Role_Human: NamedNode<"http://purl.archive.org/purl/knextract/cbox#_Role_Human">;
  // _Role_System: NamedNode<"http://purl.archive.org/purl/knextract/cbox#_Role_System">;
}

const builder = namespace(
  "http://purl.archive.org/purl/knextract/cbox#",
) as any;
export const strict = builder as NamespaceBuilder<keyof KnextractCbox> &
  KnextractCbox;
export const loose = builder as NamespaceBuilder & KnextractCbox;
