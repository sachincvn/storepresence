import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import Ajv from "ajv";
import { describe, expect, it } from "vitest";
import layoutSchema from "./layout.schema.json";
import templateSchema from "./template.schema.json";

// The JSON Schemas power editor autocomplete; this keeps them honest against real files.
const dir = path.join(__dirname);
const ajv = new Ajv({ allErrors: true, strict: false });
const validateTemplate = ajv.compile(templateSchema);
const validateLayout = ajv.compile(layoutSchema);

const read = (file: string) => JSON.parse(readFileSync(file, "utf8"));
const templateFiles = readdirSync(dir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== "layouts")
  .map((d) => path.join(dir, d.name, "template.json"));
const layoutFiles = readdirSync(path.join(dir, "layouts")).map((f) => path.join(dir, "layouts", f));

describe("JSON Schemas", () => {
  it.each(templateFiles.map((f) => [path.basename(path.dirname(f)), f]))("template %s matches template.schema.json", (_, file) => {
    const ok = validateTemplate(read(file));
    expect(ok ? [] : validateTemplate.errors?.map((e) => `${e.instancePath} ${e.message}`)).toEqual([]);
  });

  it.each(layoutFiles.map((f) => [path.basename(f), f]))("layout %s matches layout.schema.json", (_, file) => {
    const ok = validateLayout(read(file));
    expect(ok ? [] : validateLayout.errors?.map((e) => `${e.instancePath} ${e.message}`)).toEqual([]);
  });
});
