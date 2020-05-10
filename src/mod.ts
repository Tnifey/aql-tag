// source from: https://github.com/arangodb/arangojs/blob/v6/src/aql-query.ts

export function aql(
  templateStrings: TemplateStringsArray,
  ...args: AqlValue[]
): GeneratedAqlQuery {
  const strings: string[] = [...templateStrings];
  const values: Map<any, string> = new Map();

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

export namespace aql {
  export function literal(value: AqlLiteralValueType): AqlLiteral {
    if (isAqlLiteral(value)) return value;
    return { toAQL: () => String(value ?? "") };
  }

  export function join(
    values: AqlValue[],
    separator: string = " ",
  ): GeneratedAqlQuery {
    if (!values.length) return aql``;
    if (values.length === 1) return aql`${values}`;

    return aql(
      ["", ...Array(values.length - 1).fill(separator), ""] as any,
      ...values,
    );
  }
}

// Helpers

export function isArangoCollection(value: any): value is ArangoCollection {
  return Boolean(value?.isArangoCollection);
}

export function isGeneratedAqlQuery(value: any): value is GeneratedAqlQuery {
  return typeof value?._source === "function";
}

export function isAqlLiteral(value: any): value is AqlLiteral {
  return typeof value?.toAQL === "function";
}

// Types

export interface ArangoCollection {
  isArangoCollection: true;
  name: string;
}

export interface AqlQuery {
  query: string;
  bindVars: { [name: string]: any; };
}

export interface GeneratedAqlQuery extends AqlQuery {
  _source: () => { strings: string[]; args: any[]; };
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
  | object
  | any[];
