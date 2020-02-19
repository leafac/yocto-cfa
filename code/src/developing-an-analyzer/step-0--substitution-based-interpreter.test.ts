import { evaluate } from "./step-0--substitution-based-interpreter";

describe("run()", () => {
  test("§ An Expression That Already Is a Value", () => {
    expect(evaluate("x => x")).toEqual("x => x");
  });

  test("§ A Call Involving Immediate Functions", () => {
    expect(evaluate("(x => x)(y => y)")).toEqual("y => y");
  });

  test("§ Substitution in Function Definitions", () => {
    expect(evaluate("(x => z => x)(y => y)")).toEqual("z => y => y");
  });

  test("§ Name Mismatch", () => {
    expect(evaluate("(x => z => z)(y => y)")).toEqual("z => z");
  });

  test("§ Name Reuse", () => {
    expect(evaluate("(x => x => x)(y => y)")).toEqual("x => x");
  });

  test("§ Substitution in Function Calls", () => {
    expect(evaluate("(x => z => x(x))(y => y)")).toEqual(
      "z => (y => y)(y => y)"
    );
  });

  test("§ An Argument That Is Not Immediate", () => {
    expect(evaluate("(x => z => x)((a => a)(y => y))")).toEqual("z => y => y");
  });

  test("§ A Function That Is Not Immediate", () => {
    expect(evaluate("((z => z)(x => x))(y => y)")).toEqual("y => y");
  });

  test("§ Continuing to Run After a Function Call", () => {
    expect(evaluate("(x => (z => z)(x))(y => y)")).toEqual("y => y");
  });

  test("§ A Reference to an Undefined Variable", () => {
    expect(() => {
      evaluate("(x => y)(y => y)");
    }).toThrow("Reference to undefined variable: y");
  });

  test("§ A Program That Does Not Terminate", () => {
    expect(() => {
      evaluate("(f => f(f))(f => f(f))");
    }).toThrow("Maximum call stack size exceeded");
  });
});

describe("parse()", () => {
  test("Syntax error", () => {
    expect(() => {
      evaluate("x =>");
    }).toThrow("Line 1: Unexpected end of input");
  });

  test("Program with multiple statements", () => {
    expect(() => {
      evaluate("x => x; y => y");
    }).toThrow(
      "Unsupported Yocto-JavaScript feature: Program with multiple statements"
    );
  });

  test("Function of multiple parameters", () => {
    expect(() => {
      evaluate("(x, y) => x");
    }).toThrow("Unsupported Yocto-JavaScript feature: SequenceExpression");
  });

  test("Function with parameter that is a pattern", () => {
    expect(() => {
      evaluate("([x, y]) => x");
    }).toThrow("Unsupported Yocto-JavaScript feature: ArrayExpression");
  });

  test("Call with multiple arguments", () => {
    expect(() => {
      evaluate("f(a, b)");
    }).toThrow(
      "Unsupported Yocto-JavaScript feature: CallExpression with multiple arguments"
    );
  });

  test("Number", () => {
    expect(() => {
      evaluate("29");
    }).toThrow("Unsupported Yocto-JavaScript feature: Literal");
  });

  test("Variable declaration", () => {
    expect(() => {
      evaluate("const f = x => x");
    }).toThrow("Unsupported Yocto-JavaScript feature: VariableDeclarator");
  });
});
