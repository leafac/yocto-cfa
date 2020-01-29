import { evaluate } from "./step-0--substitution-based-interpreter";

describe("parse()", () => {
  testEvaluateError("Line 1: Unexpected end of input", "x =>");

  testEvaluateError(
    "Unsupported Yocto-JavaScript feature: Program with multiple statements",
    "x => x; y => y"
  );

  testEvaluateError(
    "Unsupported Yocto-JavaScript feature: CallExpression with multiple arguments",
    "f => a => b => f(a, b)"
  );

  testEvaluateError(`Unsupported Yocto-JavaScript feature: Literal`, "29");

  testEvaluateError(
    `Unsupported Yocto-JavaScript feature: VariableDeclarator`,
    "const f = x => x"
  );

  testEvaluateError(
    "Unsupported Yocto-JavaScript feature: SequenceExpression",
    "(x, y) => x"
  );

  testEvaluateError(
    "Unsupported Yocto-JavaScript feature: ArrayExpression",
    "([x, y]) => x"
  );
});

describe("evaluate()", () => {
  testEvaluate("an Expression that is already a Value", "x => x", "x => x");

  testEvaluate(
    "a call involving immediate functions",
    "(x => x)(y => y)",
    "y => y"
  );

  testEvaluate(
    "a call in which substitution must occur within another function",
    "(x => z => x)(y => y)",
    "z => y => y"
  );

  testEvaluate(
    "a call in which substitution must stop because of shadowing",
    "(x => x => x)(y => y)",
    "x => x"
  );

  testEvaluate(
    "a call in which substitution must occur within another call",
    "(x => z => x(x))(y => y)",
    "z => (y => y)(y => y)"
  );

  testEvaluate(
    "a call in which substitution must stop because the variable doesn’t match",
    "(x => z => z(z))(y => y)",
    "z => z(z)"
  );

  testEvaluate(
    "a call in which the argument isn’t immediate",
    "(x => x)((z => z)(y => y))",
    "y => y"
  );

  testEvaluate(
    "a call in which the function isn’t immediate",
    "((z => z)(x => x))(y => y)",
    "y => y"
  );

  testEvaluate(
    "a call after which more work is necessary",
    "(x => (z => z)(x))(y => y)",
    "y => y"
  );

  testEvaluateError("Reference to undefined variable: y", "(x => y)(y => y)");

  testEvaluateError(
    "Maximum call stack size exceeded",
    "(f => f(f))(f => f(f))"
  );
});

function testEvaluate(name: string, input: string, expectedOutput: string) {
  test(name, () => {
    expect(evaluate(input)).toEqual(expectedOutput);
  });
}

function testEvaluateError(name: string, input: string) {
  test(name, () => {
    expect(() => {
      evaluate(input);
    }).toThrow(name);
  });
}
