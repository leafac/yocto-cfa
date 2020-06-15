import { evaluate } from "./step-1--environment-based-interpreter";

describe("run()", () => {
  test("§ An Expression That Already Is a Value", () => {
    expect(evaluate("x => x")).toMatchInlineSnapshot(`
      "{
        \\"function\\": \\"x => x\\",
        \\"environment\\": []
      }"
    `);
  });

  test("§ A Call Involving Immediate Functions", () => {
    expect(evaluate("(x => x)(y => y)")).toMatchInlineSnapshot(`
      "{
        \\"function\\": \\"y => y\\",
        \\"environment\\": []
      }"
    `);
  });

  test("§ Substitution in Function Definitions", () => {
    expect(evaluate("(x => z => x)(y => y)")).toMatchInlineSnapshot(`
      "{
        \\"function\\": \\"z => x\\",
        \\"environment\\": [
          [
            \\"x\\",
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
        \\"function\\": \\"z => z\\",
        \\"environment\\": [
          [
            \\"x\\",
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
        \\"function\\": \\"x => x\\",
        \\"environment\\": [
          [
            \\"x\\",
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
        \\"function\\": \\"z => x\\",
        \\"environment\\": [
          [
            \\"x\\",
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
        \\"function\\": \\"z => x(x)\\",
        \\"environment\\": [
          [
            \\"x\\",
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
        \\"function\\": \\"z => x\\",
        \\"environment\\": [
          [
            \\"x\\",
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
        \\"function\\": \\"y => y\\",
        \\"environment\\": []
      }"
    `);
  });

  test("§ Continuing to Run After a Function Call", () => {
    expect(evaluate("(x => (z => z)(x))(y => y)")).toMatchInlineSnapshot(`
      "{
        \\"function\\": \\"y => y\\",
        \\"environment\\": []
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
        \\"function\\": \\"x => y\\",
        \\"environment\\": []
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
      \\"function\\": \\"y => y\\",
      \\"environment\\": []
    }"
  `);
});
