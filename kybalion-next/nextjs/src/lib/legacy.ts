import fs from "fs";
import path from "path";

const LEGACY_ROOT = path.join(process.cwd(), "public", "old-static");

const toPosix = (value: string) => value.split(path.sep).join("/");

const walkDir = (dirPath: string): string[] => {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath));
    } else {
      results.push(fullPath);
    }
  }

  return results;
};

export type LegacyEntry = {
  slug: string[];
  filePath: string;
  relPath: string;
};

const toSlug = (relPath: string) => {
  const parsed = path.posix.parse(relPath);
  const segments = parsed.dir ? parsed.dir.split("/") : [];
  if (parsed.name === "index") {
    return segments;
  }
  return [...segments, parsed.name];
};

export const getLegacyEntries = (): LegacyEntry[] => {
  if (!fs.existsSync(LEGACY_ROOT)) {
    return [];
  }

  const files = walkDir(LEGACY_ROOT)
    .filter((filePath) => filePath.toLowerCase().endsWith(".html"))
    .map((filePath) => path.relative(LEGACY_ROOT, filePath));

  return files.map((relPath) => {
    const posixPath = toPosix(relPath);
    return {
      slug: toSlug(posixPath),
      filePath: path.join(LEGACY_ROOT, relPath),
      relPath: posixPath,
    };
  });
};

export const resolveLegacyEntry = (slug: string[]): LegacyEntry | null => {
  if (!fs.existsSync(LEGACY_ROOT)) {
    return null;
  }

  const slugPath = slug.join("/");
  const fileCandidate = slugPath ? `${slugPath}.html` : "index.html";
  const indexCandidate = slugPath ? `${slugPath}/index.html` : "index.html";

  const filePath = path.join(LEGACY_ROOT, fileCandidate);
  if (fs.existsSync(filePath)) {
    return {
      slug,
      filePath,
      relPath: toPosix(fileCandidate),
    };
  }

  const indexPath = path.join(LEGACY_ROOT, indexCandidate);
  if (fs.existsSync(indexPath)) {
    return {
      slug,
      filePath: indexPath,
      relPath: toPosix(indexCandidate),
    };
  }

  return null;
};

export const getLegacyTitle = (html: string) => {
  const match = html.match(/<title>([^<]*)<\/title>/i);
  if (!match) {
    return "Legacy page";
  }
  return match[1].trim() || "Legacy page";
};
