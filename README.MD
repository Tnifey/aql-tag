## 🥑 What?

AQL Template Tag Literal. ES Module with no dependencies.

## 🥑 Why?

To work with AQL Queries anywhere.

## 🥑 Usage

```ts
import { aql } from "https://raw.githubusercontent.com/Tnifey/aql-tag/master/src/mod.ts";
// or with tag
import { aql } from "https://raw.githubusercontent.com/Tnifey/aql-tag/0.0.3/mod.ts";
```

### example

Works like
[AQL Helpers](https://www.arangodb.com/docs/stable/drivers/js-reference-aql.html).

TL;DR

```ts
// import { aql } from '...'

const arr = [1, 2, 3];

const query = aql`for u in ${arr}`;
```

_query returns_

```ts
{
  query: "for u in @value0",
  bindVars: { value0: [1,2,3] },
}
```

## 🥑 License

Apache License 2.0

Slightly modified by [Tnifey](https://github.com/Tnifey)

Source from: [https://github.com/arangodb/arangojs/blob/v6/src/aql-query.ts]

🥑
