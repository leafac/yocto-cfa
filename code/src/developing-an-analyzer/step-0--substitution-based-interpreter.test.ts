import { parse } from "./step-0--substitution-based-interpreter";

describe("parser", () => {
  test("the simplest program possible", () => {
    expect(parse("x => x")).toMatchInlineSnapshot(`
      Object {
        "body": Object {
          "name": "x",
          "type": "Identifier",
        },
        "params": Array [
          Object {
            "name": "x",
            "type": "Identifier",
          },
        ],
        "type": "ArrowFunctionExpression",
      }
    `);
  });

  test("a program illustrating all Yocto-JavaScript features", () => {
    expect(parse("(x => x)(y => y)")).toMatchInlineSnapshot(`
      Object {
        "arguments": Array [
          Object {
            "body": Object {
              "name": "y",
              "type": "Identifier",
            },
            "params": Array [
              Object {
                "name": "y",
                "type": "Identifier",
              },
            ],
            "type": "ArrowFunctionExpression",
          },
        ],
        "callee": Object {
          "body": Object {
            "name": "x",
            "type": "Identifier",
          },
          "params": Array [
            Object {
              "name": "x",
              "type": "Identifier",
            },
          ],
          "type": "ArrowFunctionExpression",
        },
        "type": "CallExpression",
      }
    `);
  });

  test.each([
    ["Line 1: Unexpected end of input", "x =>"],
    [
      "‘Program’ has a ‘body’ whose length isn’t exactly one.",
      "x => x; y => y"
    ],
    [
      "‘Program’ has a ‘body’ that isn’t an ‘ExpressionStatement’.",
      "const f = x => x;"
    ],
    [
      "‘ArrowFunctionExpression’ doesn’t have exactly one ‘param’.",
      "(x, y) => x"
    ],
    [
      "‘ArrowFunctionExpression’ has a ‘param’ that isn’t an ‘Identifier’.",
      "([x, y]) => x"
    ],
    [
      "‘CallExpression’ doesn’t have exactly one ‘argument’.",
      "f => a => b => f(a, b)"
    ],
    ["Variable reference to ‘y’ not in scope.", "x => y"],
    [`Invalid node type: ‘Literal’.`, "29"]
  ])("error case: %s", (error, input) => {
    expect(() => {
      parse(input);
    }).toThrow(error);
  });
});
