import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { AuditRecord } from "./types.ts";

/** JSONL audit trail: one record per run, append-only. */
export class JsonlAuditLog {
  private readonly path: string;

  constructor(path: string) {
    this.path = path;
  }

  async append(record: AuditRecord): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
    await appendFile(this.path, `${JSON.stringify(record)}\n`, "utf8");
  }

  async readAll(): Promise<AuditRecord[]> {
    let text: string;
    try {
      text = await readFile(this.path, "utf8");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw err;
    }
    return text
      .split("\n")
      .filter((l) => l.trim() !== "")
      .map((l) => JSON.parse(l) as AuditRecord);
  }
}
