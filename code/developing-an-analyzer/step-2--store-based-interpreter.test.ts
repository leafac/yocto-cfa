import { evaluate } from "./step-2--store-based-interpreter";

describe("run()", () => {
  test("§ An Expression That Already Is a Value", () => {
    expect(evaluate("x => x")).toMatchInlineSnapshot(`
      "{
        \\"value\\": {
          \\"function\\": \\"x => x\\",
          \\"environment\\": []
        },
        \\"store\\": []
      }"
    `);
  });

  test("§ A Call Involving Immediate Functions", () => {
    expect(evaluate("(x => x)(y => y)")).toMatchInlineSnapshot(`
      "{
        \\"value\\": {
          \\"function\\": \\"y => y\\",
          \\"environment\\": []
        },
        \\"store\\": [
          [
            0,
            {
              \\"function\\": \\"y => y\\",
              \\"environment\\": []
            }
          ]
        ]
      }"
    `);
  });

  test("§ Substitution in Function Definitions", () => {
    expect(evaluate("(x => z => x)(y => y)")).toMatchInlineSnapshot(`
      "{
        \\"value\\": {
          \\"function\\": \\"z => x\\",
          \\"environment\\": [
            [
              \\"x\\",
              0
            ]
          ]
        },
        \\"store\\": [
          [
            0,
            {
              \\"function\\": \\"y => y\\",
              \\"environment\\": []
            }
          ]
        ]
      }"
    `);
  });

  test("§ Name Mismatch", () => {
    expect(evaluate("(x => z => z)(y => y)")).toMatchInlineSnapshot(`
      "{
        \\"value\\": {
          \\"function\\": \\"z => z\\",
          \\"environment\\": [
            [
              \\"x\\",
              0
            ]
          ]
        },
        \\"store\\": [
          [
            0,
            {
              \\"function\\": \\"y => y\\",
              \\"environment\\": []
            }
          ]
        ]
      }"
    `);
  });

  test("§ Name Reuse", () => {
    expect(evaluate("(x => x => x)(y => y)")).toMatchInlineSnapshot(`
      "{
        \\"value\\": {
          \\"function\\": \\"x => x\\",
          \\"environment\\": [
            [
              \\"x\\",
              0
            ]
          ]
        },
        \\"store\\": [
          [
            0,
            {
              \\"function\\": \\"y => y\\",
              \\"environment\\": []
            }
          ]
        ]
      }"
    `);
    expect(evaluate("(x => x => z => x)(a => a)(y => y)"))
      .toMatchInlineSnapshot(`
      "{
        \\"value\\": {
          \\"function\\": \\"z => x\\",
          \\"environment\\": [
            [
              \\"x\\",
              1
            ]
          ]
        },
        \\"store\\": [
          [
            0,
            {
              \\"function\\": \\"a => a\\",
              \\"environment\\": []
            }
          ],
          [
            1,
            {
              \\"function\\": \\"y => y\\",
              \\"environment\\": []
            }
          ]
        ]
      }"
    `);
  });

  test("§ Substitution in Function Calls", () => {
    expect(evaluate("(x => z => x(x))(y => y)")).toMatchInlineSnapshot(`
      "{
        \\"value\\": {
          \\"function\\": \\"z => x(x)\\",
          \\"environment\\": [
            [
              \\"x\\",
              0
            ]
          ]
        },
        \\"store\\": [
          [
            0,
            {
              \\"function\\": \\"y => y\\",
              \\"environment\\": []
            }
          ]
        ]
      }"
    `);
  });

  test("§ An Argument That Is Not Immediate", () => {
    expect(evaluate("(x => z => x)((a => a)(y => y))")).toMatchInlineSnapshot(`
      "{
        \\"value\\": {
          \\"function\\": \\"z => x\\",
          \\"environment\\": [
            [
              \\"x\\",
              1
            ]
          ]
        },
        \\"store\\": [
          [
            0,
            {
              \\"function\\": \\"y => y\\",
              \\"environment\\": []
            }
          ],
          [
            1,
            {
              \\"function\\": \\"y => y\\",
              \\"environment\\": []
            }
          ]
        ]
      }"
    `);
  });

  test("§ A Function That Is Not Immediate", () => {
    expect(evaluate("((z => z)(x => x))(y => y)")).toMatchInlineSnapshot(`
      "{
        \\"value\\": {
          \\"function\\": \\"y => y\\",
          \\"environment\\": []
        },
        \\"store\\": [
          [
            0,
            {
              \\"function\\": \\"x => x\\",
              \\"environment\\": []
            }
          ],
          [
            1,
            {
              \\"function\\": \\"y => y\\",
              \\"environment\\": []
            }
          ]
        ]
      }"
    `);
  });

  test("§ Continuing to Run After a Function Call", () => {
    expect(evaluate("(x => (z => z)(x))(y => y)")).toMatchInlineSnapshot(`
      "{
        \\"value\\": {
          \\"function\\": \\"y => y\\",
          \\"environment\\": []
        },
        \\"store\\": [
          [
            0,
            {
              \\"function\\": \\"y => y\\",
              \\"environment\\": []
            }
          ],
          [
            1,
            {
              \\"function\\": \\"y => y\\",
              \\"environment\\": []
            }
          ]
        ]
      }"
    `);
  });

  test("§ A Reference to an Undefined Variable", () => {
    expect(() => {
      evaluate("(x => y)(y => y)");
    }).toThrowErrorMatchingInlineSnapshot(
      `"Reference to undefined variable: y"`
    );
    expect(evaluate("x => y")).toMatchInlineSnapshot(`
      "{
        \\"value\\": {
          \\"function\\": \\"x => y\\",
          \\"environment\\": []
        },
        \\"store\\": []
      }"
    `);
  });
});

describe("parse()", () => {
  test("Syntax error", () => {
    expect(() => {
      evaluate(`x =>`);
    }).toThrowErrorMatchingInlineSnapshot(`"Unexpected token (1:4)"`);
  });

  test("Program with multiple statements", () => {
    expect(() => {
      evaluate(`x => x; y => y`);
    }).toThrowErrorMatchingInlineSnapshot(`"Unexpected token (1:6)"`);
  });

  test("Variable declaration", () => {
    expect(() => {
      evaluate(`const f = x => x`);
    }).toThrowErrorMatchingInlineSnapshot(`"Unexpected token (1:0)"`);
  });

  test("Function of multiple parameters", () => {
    expect(() => {
      evaluate(`(x, y) => x`);
    }).toThrowErrorMatchingInlineSnapshot(
      `"Unsupported Yocto-JavaScript feature: ArrowFunctionExpression with multiple parameters"`
    );
  });

  test("Function with parameter that is a pattern", () => {
    expect(() => {
      evaluate(`([x, y]) => x`);
    }).toThrowErrorMatchingInlineSnapshot(
      `"Unsupported Yocto-JavaScript feature: ArrowFunctionExpression param that isn’t Identifier"`
    );
  });

  test("Call with multiple arguments", () => {
    expect(() => {
      evaluate(`f(a, b)`);
    }).toThrowErrorMatchingInlineSnapshot(
      `"Unsupported Yocto-JavaScript feature: CallExpression with multiple arguments"`
    );
  });

  test("Number", () => {
    expect(() => {
      evaluate(`29`);
    }).toThrowErrorMatchingInlineSnapshot(
      `"Unsupported Yocto-JavaScript feature: NumericLiteral"`
    );
  });
});

test("§ Programs That Do Not Terminate", () => {
  expect(() => {
    evaluate(`(f => f(f))(f => f(f))`);
  }).toThrowErrorMatchingInlineSnapshot(`"Maximum call stack size exceeded"`);
  expect(() => {
    evaluate(`(f => (f(f))(f(f)))(f => (f(f))(f(f)))`);
  }).toThrowErrorMatchingInlineSnapshot(`"Maximum call stack size exceeded"`);
  expect(() => {
    evaluate(`(f => c => f(f)(x => c))(f => c => f(f)(x => c))(y => y)`);
  }).toThrowErrorMatchingInlineSnapshot(`"Maximum call stack size exceeded"`);
});

test("§ A Function Body Is Evaluated with the Environment in Its Closure", () => {
  expect(evaluate(`(f => (x => f(x))(a => a))((x => z => x)(y => y))`))
    .toMatchInlineSnapshot(`
    "{
      \\"value\\": {
        \\"function\\": \\"y => y\\",
        \\"environment\\": []
      },
      \\"store\\": [
        [
          0,
          {
            \\"function\\": \\"y => y\\",
            \\"environment\\": []
          }
        ],
        [
          1,
          {
            \\"function\\": \\"z => x\\",
            \\"environment\\": [
              [
                \\"x\\",
                0
              ]
            ]
          }
        ],
        [
          2,
          {
            \\"function\\": \\"a => a\\",
            \\"environment\\": [
              [
                \\"f\\",
                1
              ]
            ]
          }
        ],
        [
          3,
          {
            \\"function\\": \\"a => a\\",
            \\"environment\\": [
              [
                \\"f\\",
                1
              ]
            ]
          }
        ]
      ]
    }"
  `);
});
