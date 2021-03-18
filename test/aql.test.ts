// deno-lint-ignore-file
import { assert } from "./assert.ts";
import {
  aql,
  isAqlLiteral,
  isArangoCollection,
  isGeneratedAqlQuery,
} from "../mod.ts";

Deno.test({
  name: `basic aql query`,
  async fn() {
    const query = aql`return 1`;

    assert(query.query === "return 1");
    assert(typeof query.bindVars === "object");
    assert([...Object.entries(query.bindVars)].length === 0);
  },
});

Deno.test({
  name: `aql query with variable`,
  async fn() {
    const id = 1;
    const query = aql`return ${id}`;

    assert(query.query === "return @value0");
    assert(typeof query.bindVars === "object");
    assert(query.bindVars.value0 === id);
  },
});

Deno.test({
  name: `aql literal`,
  async fn() {
    const literal = aql.literal("");
    assert(isAqlLiteral(literal));
  },
});

Deno.test({
  name: `aql join`,
  async fn() {
    const a = aql.literal("a");
    const b = aql.literal("b");

    const joint = aql.join([a, b]);
    assert(isGeneratedAqlQuery(joint));
    assert(joint.query === "a b");
  },
});

Deno.test({
  name: `aql join with separator`,
  async fn() {
    const a = aql.literal("a");
    const b = aql.literal("b");

    const joint = aql.join([a, b], " == ");
    assert(isGeneratedAqlQuery(joint));
    assert(joint.query === "a == b");
  },
});

Deno.test({
  name: `aql join with variables`,
  async fn() {
    const test = "test";
    const a = aql`${test}`;
    const b = aql.literal("b");

    const joint = aql.join([a, b], " == ");
    assert(isGeneratedAqlQuery(joint));
    assert(joint.query === "@value0 == b");
    assert(joint.bindVars?.value0 === test);
  },
});

Deno.test({
  name: `merge 2 aql queries`,
  async fn() {
    const test1 = "test1";
    const test2 = "test2";
    const a = aql`${test1}`;
    const b = aql`${test2}`;

    const joint = aql.join([a, b], " == ");
    assert(isGeneratedAqlQuery(joint));
    assert(joint.query === `@value0 == @value1`);
    assert(joint.bindVars?.value0 === test1);
    assert(joint.bindVars?.value1 === test2);
  },
});
