import axios from "axios";
import * as cheerio from "cheerio";
import { CatalogEntryType, TypedCatalogEntry } from "./classify/types";
import { CatalogHierarchy } from "./urls/types";
import { Err, Ok, Result } from "@graduate/common";

export const loadHtmlWithUrl = async (
  url: URL
): Promise<{ url: URL; result: Result<CheerioStatic, unknown> }> => {
  let result: Result<CheerioStatic, unknown>;
  try {
    result = Ok(await loadHTML(url.href));
  } catch (error) {
    result = Err(error);
  }
  return { url, result };
};

export const loadHTML = async (url: string): Promise<CheerioStatic> => {
  const { data } = await axios.get(url);
  return cheerio.load(data);
};

export const appendPath = (base: string, path: string, hash?: string) => {
  const url = new URL(path, base);
  if (hash) {
    url.hash = hash;
  }
  return url;
};

export const ensureLength = <T>(n: number, l: T[]) => {
  const length = l.length;
  if (length !== n) {
    const msg = `expected text row to contain exactly ${n} cells, found ${length}`;
    throw new Error(msg);
  }
  return l;
};

export const ensureLengthAtLeast = <T>(n: number, l: T[]) => {
  const length = l.length;
  if (length < n) {
    const msg = `expected text row to contain at least ${n} cells, found ${length}`;
    throw new Error(msg);
  }
  return l;
};

export const parseText = (td: Cheerio) => {
  // replace &NBSP with space
  return td.text().replaceAll("\xa0", " ").trim();
};

export const flattenCatalogHierarchy = (
  hierarchy: CatalogHierarchy
): string[] => {
  const list: string[] = [];
  const recur = (node: CatalogHierarchy[string]) => {
    if (typeof node === "string") {
      // it's a leaf!
      list.push(node);
    } else {
      for (const child of Object.values(node)) {
        recur(child);
      }
    }
  };
  recur(hierarchy);
  return list;
};

export const filterByEntryType = (
  typedUrls: TypedCatalogEntry[],
  include: CatalogEntryType[]
): TypedCatalogEntry[] => {
  return typedUrls.filter((typedUrl) => include.includes(typedUrl.type));
};

export const joinParts = (base: string, parts: string[]) => {
  return appendPath(base, parts.join("/"));
};

export const getPathParts = (path: string) => {
  return path.split("/").filter((s) => s !== "");
};

/**
 * Converts a flat list of entries to catalog hierarchy.
 *
 * @param urls a flat list of URLs
 * @returns the resulting catalog hierarchy
 */
export const convertToHierarchy = (
  urls: URL[]
): CatalogHierarchy => {
  const hierarchy: CatalogHierarchy = {};
  for (const url of urls) {
    const path = getPathParts(url.pathname);
    let obj: CatalogHierarchy = hierarchy;

    // For each part of the path, add it to the hierarchy
    // except for the last piece
    for (const part of path.slice(0, -1)) {
      if (!(part in obj)) {
        obj[part] = {};
      }
      const child = obj[part];
      if (typeof child === "string") {
        // shouldn't ever be reached, as long as majors cannot be sub entries of other majors.
        // ex. breaks if a major exists at "coe/marine-bio" and also
        // "coe/marine-bio/fishing-concentration"
        throw new Error(
          "Hierarchy was inconsistent: found a child, where a parent was expected"
        );
      }
      obj = child;
    }

    const last = path[path.length - 1];
    // Obj should equal the parent of the entry
    // the "leaf" is the full url to the catalog entry
    obj[last] = url.href;
  }
  return hierarchy;
};
