import { parse, evaluate } from "./step-0--substitution-based-interpreter";

describe("parse()", () => {
  test("the simplest program", () => {
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

describe("evaluate()", () => {
  test.each([
    ["an Expression that already is a Value", "x => x", "x => x"],
    ["an immediate call", "(x => x)(y => y)", "y => y"],
    [
      "a call in which substitution needs to happen within another function definition",
      "(x => z => x)(y => y)",
      "z => y => y"
    ],
    [
      "a call in which substitution needs to stop because of shadowing",
      "(x => x => x)(y => y)",
      "x => x"
    ],
    [
      "a call in which substitution needs to happen within another call",
      "(x => z => x(x))(y => y)",
      "z => (y => y)(y => y)"
    ],
    [
      "a call in which substitution needs to stop because the variable doesn’t match",
      "(x => z => z(z))(y => y)",
      "z => z(z)"
    ],
    [
      "a call in which the argument isn’t immediate",
      "(x => x)((z => z)(y => y))",
      "y => y"
    ],
    [
      "a call in which the function isn’t immediate",
      "((z => z)(x => x))(y => y)",
      "y => y"
    ],
    [
      "a call after which more work is necessary",
      "(x => (z => z)(x))(y => y)",
      "y => y"
    ]
  ])("%s", (description, input, expectedOutput) => {
    expect(evaluate(parse(input))).toEqual(parse(expectedOutput));
  });

  test("a variable reference to an undefined variable", () => {
    expect(() => {
      evaluate({ type: "Identifier", name: "x" });
    }).toThrow("Undefined variable ‘x’.");
  });

  test("a program that doesn’t terminate", () => {
    expect(() => {
      evaluate(parse("(f => f(f))(f => f(f))"));
    }).toThrow("Maximum call stack size exceeded");
  });
});
