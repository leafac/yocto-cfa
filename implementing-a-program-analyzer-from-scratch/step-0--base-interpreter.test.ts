import { evaluate } from "./step-0--base-interpreter"
import { YJS } from "../languages/yocto-javascript"

test("A function is a value", () => {
  expect(evaluate(YJS`x => x`)).toEqual(YJS`x => x`)
})

test.each([
  [YJS`(x => x)(y => y)`, YJS`y => y`],
  [YJS`(x => z => x)(y => y)`, YJS`z => y => y`],
  [YJS`(f => u => f(f))(x => x)`, YJS`u => (x => x)(x => x)`],
])(
  "A call substitutes the argument in the function body",
  (program, expectedValue) => {
    expect(evaluate(program)).toEqual(expectedValue)
  }
)

test("Substitution doesn’t affect other Identifiers", () => {
  expect(evaluate(YJS`(x => z => z)(y => y)`)).toEqual(YJS`z => z`)
})

test("Substitution doesn’t affect a shadowed Identifier", () => {
  expect(evaluate(YJS`(x => x => x)(y => y)`)).toEqual(YJS`x => x`)
})

test("Evaluation may not terminate", () => {
  expect(() => evaluate(YJS`(f => f(f))(f => f(f))`))
    .toThrow(new RangeError("Maximum call stack size exceeded"))
})
