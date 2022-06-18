// source from: https://github.com/arangodb/arangojs/blob/v6/src/aql-query.ts

export function aql(
  templateStrings: TemplateStringsArray,
  ...args: AqlValue[]
): GeneratedAqlQuery {
  const strings: string[] = [...templateStrings];
  const values: Map<AqlValue, string> = new Map();

  let query: string = strings[0];

  for (let i = 0; i < args.length; i++) {
    const current = args[i];
    const currentString = strings[i];
    const nextString = strings[i + 1];

    if (current === undefined) {
      query += nextString;
      continue;
    }

    if (isGeneratedAqlQuery(current)) {
      const source = current._source();

      if (source.args.length) {
        query += source.strings[0];
        args.splice(i, 1, ...source.args);
        strings.splice(
          i,
          2,
          currentString + source.strings[0],
          ...source.strings.slice(1, source.args.length),
          source.strings[source.args.length] + nextString,
        );
      } else {
        query += current.query + nextString;
        args.splice(i, 1);
        strings.splice(i, 2, currentString + current.query + nextString);
      }

      i -= 1;
      continue;
    }

    if (isAqlLiteral(current)) {
      query += `${current.toAQL()}${nextString}`;
      continue;
    }

    const name = values.get(current) ?? `value${values.size}`;

    if (isArangoCollection(current)) {
      values.set(current.name, `@${name}`);
      query += `@@${name}`;
      query += nextString;
      continue;
    }

    if (!values.has(current)) {
      values.set(current, name);
    }

    query += `@${name}`;
    query += nextString;
  }

  const bindVars = Object.fromEntries([...values].map(([v, n]) => [n, v]));
  return { query, bindVars, _source: () => ({ strings, args }) };
}

export function literal(value: AqlLiteralValueType): AqlLiteral {
  if (isAqlLiteral(value)) return value;
  return { toAQL: () => String(value ?? "") };
}

export function join(values: AqlValue[], separator = " "): GeneratedAqlQuery {
  if (!values.length) return aql``;
  if (values.length === 1) return aql`${values}`;

  const parts = Array(values.length - 1).fill(separator);
  const query = ["", ...parts, ""];
  return aql((query as unknown) as TemplateStringsArray, ...values);
}

aql.literal = literal;
aql.join = join;

// Helpers

export function isArangoCollection(value: unknown): value is ArangoCollection {
  const isArangoCollection = value && typeof value === "object" &&
    "isArangoCollection" in value;
  return !!isArangoCollection;
}

export function isGeneratedAqlQuery(
  value: unknown,
): value is GeneratedAqlQuery {
  const isGeneratedAqlQuery = typeof (value as Dict)?._source === "function";
  return !!isGeneratedAqlQuery;
}

export function isAqlLiteral(value: unknown): value is AqlLiteral {
  return !!(value && typeof (value as Dict)?.toAQL === "function");
}

// Types

export interface ArangoCollection {
  isArangoCollection: true;
  name: string;
}

export interface AqlQuery {
  query: string;
  bindVars: { [name: string]: AqlValue };
}

export interface GeneratedAqlQuery extends AqlQuery {
  _source: () => { strings: string[]; args: AqlValue[] };
}

export interface AqlLiteral {
  toAQL: () => string;
}

export type AqlLiteralValueType =
  | string
  | number
  | AqlLiteral
  | null
  | undefined;

export type AqlValue =
  | ArangoCollection
  | GeneratedAqlQuery
  | AqlLiteral
  | string
  | number
  | boolean
  | null
  | undefined
  | AqlValue[]
  // deno-lint-ignore no-explicit-any
  | Record<string, any>
  // deno-lint-ignore no-explicit-any
  | any[];

export type Dict<T extends unknown = unknown> = Record<string, T>;
