// Sandbox-only: emits a minimal but structurally-correct type surface for
// `.prisma/client` so TypeScript can check server code without the real
// engine. On a normal machine `prisma generate` overwrites this entirely.
import fs from "fs";
import path from "path";

const schema = fs.readFileSync("prisma/schema.prisma", "utf8");

const enums = {};
for (const m of schema.matchAll(/enum\s+(\w+)\s*\{([^}]*)\}/g)) {
  const name = m[1];
  const vals = m[2]
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("//"));
  enums[name] = vals;
}

const scalarMap = {
  String: "string",
  Boolean: "boolean",
  Int: "number",
  Float: "number",
  DateTime: "Date",
  Json: "any",
};

const models = {};
for (const m of schema.matchAll(/model\s+(\w+)\s*\{([\s\S]*?)\n\}/g)) {
  const name = m[1];
  const body = m[2];
  const fields = [];
  for (const line of body.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("//") || t.startsWith("@@")) continue;
    const fm = t.match(/^(\w+)\s+([\w.]+)(\[\])?(\?)?/);
    if (!fm) continue;
    const [, fname, ftypeRaw, arr, opt] = fm;
    const ftype = ftypeRaw.replace(/@.*/, "").trim();
    fields.push({ fname, ftype, isArray: !!arr, isOpt: !!opt });
  }
  models[name] = fields;
}

const isModel = (t) => Object.prototype.hasOwnProperty.call(models, t);
const isEnum = (t) => Object.prototype.hasOwnProperty.call(enums, t);

function tsType(f) {
  let base;
  if (scalarMap[f.ftype]) base = scalarMap[f.ftype];
  else if (isEnum(f.ftype)) base = f.ftype;
  else if (isModel(f.ftype)) base = f.ftype; // relation
  else base = "any";
  if (f.isArray) base = `${base}[]`;
  if (f.isOpt) base = `${base} | null`;
  return base;
}

let out = `// AUTO-GENERATED sandbox type shim. Do NOT ship. Replaced by \`prisma generate\`.
/* eslint-disable */
export namespace $Enums {}
`;

// Enums
for (const [name, vals] of Object.entries(enums)) {
  out += `export type ${name} = ${vals.map((v) => `"${v}"`).join(" | ")};\n`;
  out += `export const ${name}: { [K in ${name}]: K } = { ${vals
    .map((v) => `${v}: "${v}"`)
    .join(", ")} } as any;\n`;
}

// Model interfaces (scalars + enum fields; relations required for payload use)
for (const [name, fields] of Object.entries(models)) {
  out += `export interface ${name} {\n`;
  for (const f of fields) {
    if (isModel(f.ftype)) {
      // Relations are typed as present (arrays default to []) so payloads with
      // `include` type-check without optional-chaining noise.
      const base = f.isArray ? `${f.ftype}[]` : `${f.ftype}`;
      out += `  ${f.fname}: ${base};\n`;
    } else {
      out += `  ${f.fname}: ${tsType(f)};\n`;
    }
  }
  out += `}\n`;
}

// Prisma namespace: GetPayload, Include, CreateInput (loose)
out += `export namespace Prisma {\n`;
for (const name of Object.keys(models)) {
  out += `  export type ${name}Include = any;\n`;
  out += `  export type ${name}GetPayload<T> = ${name} & Record<string, any>;\n`;
  out += `  export type ${name}CreateInput = any;\n`;
  out += `  export type ${name}UpdateInput = any;\n`;
  out += `  export type ${name}CreateWithoutProductInput = any;\n`;
  out += `  export type ${name}UncheckedCreateInput = any;\n`;
  out += `  export type ${name}WhereInput = any;\n`;
  out += `  export type ${name}WhereUniqueInput = any;\n`;
  out += `  export type ${name}OrderByWithRelationInput = any;\n`;
  out += `  export type ${name}Select = any;\n`;
}
out += `  export type TransactionClient = any;\n`;
out += `}\n`;

// Delegate type: every method returns a thenable any
const delegate = `{
  findMany: (args?: any) => Promise<any[]>;
  findFirst: (args?: any) => Promise<any>;
  findUnique: (args?: any) => Promise<any>;
  create: (args: any) => Promise<any>;
  createMany: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  upsert: (args: any) => Promise<any>;
  delete: (args: any) => Promise<any>;
  deleteMany: (args?: any) => Promise<any>;
  count: (args?: any) => Promise<number>;
  groupBy: (args?: any) => Promise<any[]>;
  aggregate: (args?: any) => Promise<any>;
}`;

out += `export class PrismaClient {\n`;
out += `  constructor(...args: any[]);\n`;
for (const name of Object.keys(models)) {
  const camel = name[0].toLowerCase() + name.slice(1);
  out += `  ${camel}: ${delegate};\n`;
}
out += `  $connect(): Promise<void>;\n`;
out += `  $disconnect(): Promise<void>;\n`;
out += `  $transaction(arg: any): Promise<any>;\n`;
out += `}\n`;

const dir = "node_modules/.prisma/client";
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, "index.d.ts"), out);
fs.writeFileSync(path.join(dir, "default.d.ts"), `export * from "./index";\n`);

// Runtime shim: a no-op PrismaClient whose model delegates return empty data,
// so build-time evaluation (route module load) doesn't crash. Real client
// replaces this via `prisma generate`.
const runtime = `
const handler = {
  get: () => new Proxy(function(){}, {
    get: () => async () => [],
    apply: () => async () => [],
  }),
};
class PrismaClient {
  constructor() { return new Proxy(this, {
    get(target, prop) {
      if (prop === '$connect' || prop === '$disconnect') return async () => {};
      if (prop === '$transaction') return async (a) => Array.isArray(a) ? [] : a();
      return new Proxy({}, {
        get: () => async () => { return []; },
      });
    },
  }); }
}
const enums = ${JSON.stringify(
  Object.fromEntries(
    Object.entries(enums).map(([k, vals]) => [
      k,
      Object.fromEntries(vals.map((v) => [v, v])),
    ])
  )
)};
module.exports = { PrismaClient, Prisma: {}, ...enums };
`;
fs.writeFileSync(path.join(dir, "index.js"), runtime);
fs.writeFileSync(path.join(dir, "default.js"), `module.exports = require("./index.js");\n`);

console.log(
  `Shim written: ${Object.keys(models).length} models, ${Object.keys(enums).length} enums`
);
