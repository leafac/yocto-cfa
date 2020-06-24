import { evaluate } from "./step-0--substitution-based-interpreter";

describe("run()", () => {
  test("§ An Expression That Already Is a Value", () => {
    expect(evaluate(`x => x`)).toMatchInlineSnapshot(`"x => x"`);
  });

  test("§ A Call Involving Immediate Functions", () => {
    expect(evaluate(`(y => y)(x => x)`)).toMatchInlineSnapshot(`"x => x"`);
  });

  test("§ Substitution in Function Definitions", () => {
    expect(evaluate(`(y => z => y)(x => x)`)).toMatchInlineSnapshot(
      `"z => x => x"`
    );
  });

  test("§ Name Mismatch", () => {
    expect(evaluate(`(z => x => x)(y => y)`)).toMatchInlineSnapshot(`"x => x"`);
  });

  test("§ Name Reuse", () => {
    expect(evaluate(`(x => x => x)(y => y)`)).toMatchInlineSnapshot(`"x => x"`);
  });

  test("§ Substitution in Function Calls", () => {
    expect(evaluate(`(y => z => y(y))(x => x)`)).toMatchInlineSnapshot(
      `"z => (x => x)((x => x))"`
    );
  });

  test("§ An Argument That Is Not Immediate", () => {
    expect(evaluate(`(a => z => a)((y => y)(x => x))`)).toMatchInlineSnapshot(
      `"z => x => x"`
    );
  });

  test("§ A Function That Is Not Immediate", () => {
    expect(evaluate(`((z => z)(y => y))(x => x)`)).toMatchInlineSnapshot(
      `"x => x"`
    );
  });

  test("§ Continuing to Run After a Function Call", () => {
    expect(evaluate(`(z => (y => y)(z))(x => x)`)).toMatchInlineSnapshot(
      `"x => x"`
    );
  });

  test("§ A Reference to an Undefined Variable", () => {
    expect(() => {
      evaluate(`(y => u)(x => x)`);
    }).toThrowErrorMatchingInlineSnapshot(
      `"Reference to undefined variable: u"`
    );
    expect(evaluate(`y => u`)).toMatchInlineSnapshot(`"y => u"`);
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
      evaluate(`() => x`);
    }).toThrowErrorMatchingInlineSnapshot(
      `"Unsupported Yocto-JavaScript feature: ArrowFunctionExpression doesn’t have exactly one parameter"`
    );
    expect(() => {
      evaluate(`(x, y) => x`);
    }).toThrowErrorMatchingInlineSnapshot(
      `"Unsupported Yocto-JavaScript feature: ArrowFunctionExpression doesn’t have exactly one parameter"`
    );
  });

  test("Function with parameter that is a pattern", () => {
    expect(() => {
      evaluate(`([x, y]) => x`);
    }).toThrowErrorMatchingInlineSnapshot(
      `"Unsupported Yocto-JavaScript feature: ArrowFunctionExpression param isn’t an Identifier"`
    );
  });

  test("Call with multiple arguments", () => {
    expect(() => {
      evaluate(`f()`);
    }).toThrowErrorMatchingInlineSnapshot(
      `"Unsupported Yocto-JavaScript feature: CallExpression doesn’t have exactly one argument"`
    );
    expect(() => {
      evaluate(`f(a, b)`);
    }).toThrowErrorMatchingInlineSnapshot(
      `"Unsupported Yocto-JavaScript feature: CallExpression doesn’t have exactly one argument"`
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
});
