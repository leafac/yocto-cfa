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
    expect(evaluate("(x => x => x)(y => y)(z => z)")).toMatchInlineSnapshot(`
      "{
        \\"function\\": \\"z => z\\",
        \\"environment\\": []
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

  test("§ A Program That Does Not Terminate", () => {
    expect(() => {
      evaluate("(f => f(f))(f => f(f))");
    }).toThrowErrorMatchingInlineSnapshot(`"Maximum call stack size exceeded"`);
  });

  test("§ A Function Body Is Evaluated with the Environment under Which Its Closure Is Created", () => {
    expect(evaluate("(f => (x => f(x))(b => b))((x => y => x)(a => a))"))
      .toMatchInlineSnapshot(`
      "{
        \\"function\\": \\"a => a\\",
        \\"environment\\": []
      }"
    `);
  });
});

describe("parse()", () => {
  test("Syntax error", () => {
    expect(() => {
      evaluate("x =>");
    }).toThrowErrorMatchingInlineSnapshot(`"Line 1: Unexpected end of input"`);
  });

  test("Program with multiple statements", () => {
    expect(() => {
      evaluate("x => x; y => y");
    }).toThrowErrorMatchingInlineSnapshot(
      `"Unsupported Yocto-JavaScript feature: Program with multiple statements"`
    );
  });

  test("Function of multiple parameters", () => {
    expect(() => {
      evaluate("(x, y) => x");
    }).toThrowErrorMatchingInlineSnapshot(
      `"Unsupported Yocto-JavaScript feature: SequenceExpression"`
    );
  });

  test("Function with parameter that is a pattern", () => {
    expect(() => {
      evaluate("([x, y]) => x");
    }).toThrowErrorMatchingInlineSnapshot(
      `"Unsupported Yocto-JavaScript feature: ArrayExpression"`
    );
  });

  test("Call with multiple arguments", () => {
    expect(() => {
      evaluate("f(a, b)");
    }).toThrowErrorMatchingInlineSnapshot(
      `"Unsupported Yocto-JavaScript feature: CallExpression with multiple arguments"`
    );
  });

  test("Number", () => {
    expect(() => {
      evaluate("29");
    }).toThrowErrorMatchingInlineSnapshot(
      `"Unsupported Yocto-JavaScript feature: Literal"`
    );
  });

  test("Variable declaration", () => {
    expect(() => {
      evaluate("const f = x => x");
    }).toThrowErrorMatchingInlineSnapshot(
      `"Unsupported Yocto-JavaScript feature: VariableDeclarator"`
    );
  });
});
