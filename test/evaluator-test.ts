import { Identifier } from "./ast";
import {
  mk_Function,
  Integer_OBJ,
  Null_OBJ,
  String_OBJ,
  error_OBJ,
  type mk_Object,
  Hash,
  Hashkey,
  TRUE,
  FALSE,
} from "./object";
import {
  testBooleanObject,
  testEval,
  testIntegerObject,
  testNullObject,
} from "./test-helper";

function testEvalIntegerExpression() {
  const tests: { input: string; expected: number }[] = [
    { input: "5", expected: 5 },
    { input: "10", expected: 10 },
    { input: "-5", expected: -5 },
    { input: "-10", expected: -10 },
    { input: "5 + 5 + 5 + 5 - 10", expected: 10 },
    { input: "2 * 2 * 2 * 2 * 2", expected: 32 },
    { input: "-50 + 100 + -50", expected: 0 },
    { input: "5 * 2 + 10", expected: 20 },
    { input: "5 + 2 * 10", expected: 25 },
    { input: "20 + 2 * -10", expected: 0 },
    { input: "50 / 2 * 2 + 10", expected: 60 },
    { input: "2 * (5 + 10)", expected: 30 },
    { input: "3 * 3 * 3 + 10", expected: 37 },
    { input: "3 * (3 * 3) + 10", expected: 37 },
    { input: "(5 + 10 * 2 + 15 / 3) * 2 + -10", expected: 50 },
  ];

  for (const test of tests) {
    const result = testEval(test.input);
    if (result == undefined) {
      console.error(`\tExpected object, got undefined instead.`);
      continue;
    }
    testIntegerObject(result, test.expected);
  }
}

function testEvalBooleanExpression() {
  const tests: { input: string; expected: boolean }[] = [
    { input: "true", expected: true },
    { input: "false", expected: false },
    { input: "1 < 2", expected: true },
    { input: "1 > 2", expected: false },
    { input: "1 < 1", expected: false },
    { input: "1 > 1", expected: false },
    { input: "1 == 1", expected: true },
    { input: "1 != 1", expected: false },
    { input: "1 == 2", expected: false },
    { input: "1 != 2", expected: true },
    { input: "true == true", expected: true },
    { input: "false == false", expected: true },
    { input: "true == false", expected: false },
    { input: "true != false", expected: true },
    { input: "false != true", expected: true },
    { input: "(1 < 2) == true", expected: true },
    { input: "(1 < 2) == false", expected: false },
    { input: "(1 > 2) == true", expected: false },
    { input: "(1 > 2) == false", expected: true },
  ];
  let result: mk_Object | undefined;
  for (const test of tests) {
    result = testEval(test.input);
    if (result == undefined) {
      console.error(`Expected object, got undefined instead.`);
      continue;
    }
    testBooleanObject(result, test.expected);
  }
}

function testBangOperator() {
  const tests: { input: string; expected: boolean }[] = [
    { input: "!true", expected: false },
    { input: "!false", expected: true },
    { input: "!5", expected: false },
    { input: "!0", expected: false },
    { input: "!!true", expected: true },
    { input: "!!5", expected: true },
  ];

  for (const test of tests) {
    const result = testEval(test.input);
    if (result == undefined) {
      console.error(`Expected object, got undefined instead.`);
      continue;
    }
    testBooleanObject(result, test.expected);
  }
}

function testIfElseExpressions() {
  const tests: { input: string; expected: number | null }[] = [
    { input: "if (true) { 10 }", expected: 10 },
    { input: "if (false) { 10 }", expected: null },
    { input: "if (1) { 10 }", expected: 10 },
    { input: "if (1 < 2) { 10 }", expected: 10 },
    { input: "if (1 > 2) { 10 }", expected: null },
    { input: "if (1 > 2) { 10 } else { 20 }", expected: 20 },
    { input: "if (1 < 2) { 10 } else { 20 }", expected: 10 },
  ];

  for (const test of tests) {
    const result = testEval(test.input);
    if (result == undefined) {
      console.error(`Expecting result, got undefined instead.`);
      continue;
    } else if (result instanceof Null_OBJ) {
      testNullObject(result);
    } else if (result instanceof Integer_OBJ) {
      if (test.expected == null) {
        console.error(
          `Expecting Integer result, got ${String(test.expected)} instead.`
        );
        continue;
      }
      testIntegerObject(result, test.expected);
    }
  }
}

function testReturnStatements() {
  const tests: { input: string; expected: number }[] = [
    { input: "return 10;", expected: 10 },
    { input: "return 10; 9;", expected: 10 },
    { input: "return 2 * 5; 9;", expected: 10 },
    { input: "9; return 2 * 5; 9;", expected: 10 },
    {
      input: `
    if (10 > 1) {
      if (10 > 1) {
        return 10;
      }
      return 1;
    }`,
      expected: 10,
    },
  ];

  for (const test of tests) {
    const result = testEval(test.input);
    if (result == undefined) {
      console.error(`Expected a result value, got undefined instead.`);
      continue;
    }
    testIntegerObject(result, test.expected);
  }
}

function testErrorHandling() {
  const tests: { input: string; expectedMessage: string }[] = [
    { input: "5 + true;", expectedMessage: "type mismatch: INTEGER + BOOLEAN" },
    {
      input: "5 + true; 5;",
      expectedMessage: "type mismatch: INTEGER + BOOLEAN",
    },
    { input: "-true", expectedMessage: "unknown operator: -BOOLEAN" },
    {
      input: "true + false;",
      expectedMessage: "unknown operator: BOOLEAN + BOOLEAN",
    },
    {
      input: "5; true + false; 5",
      expectedMessage: "unknown operator: BOOLEAN + BOOLEAN",
    },
    {
      input: "if (10 > 1) { true + false; }",
      expectedMessage: "unknown operator: BOOLEAN + BOOLEAN",
    },
    {
      input: `
      if (10 > 1) {
        if (10 > 1) {
          return true + false;
        }
        return 1;
      }`,
      expectedMessage: "unknown operator: BOOLEAN + BOOLEAN",
    },
    { input: "foobar", expectedMessage: "identifier not found: foobar" },
    {
      input: `"Hello" - "World"`,
      expectedMessage: "unknown operator: STRING - STRING",
    },
    {
      input: `{"name": "Monkey"}[fn(x) { x }];`,
      expectedMessage: "unusable as hash key: FUNCTION",
    },
  ];

  for (const test of tests) {
    const result = testEval(test.input);
    if (result == undefined) {
      console.error(`Got undefined when expecting a monkey object`);
      continue;
    }

    if (!(result instanceof error_OBJ)) {
      console.error(
        `Expected an error, got ${result.constructor.name} instead.`
      );
      continue;
    }
    if (result.message != test.expectedMessage) {
      console.error(
        `Wrong error message. expected:${test.expectedMessage}, got:${result.message}`
      );
    }
  }
}

function testLetStatements() {
  const tests: { input: string; expected: number }[] = [
    { input: "let a = 5; a;", expected: 5 },
    { input: "let a = 5 * 5; a;", expected: 25 },
    { input: "let a = 5; let b = a; b;", expected: 5 },
    { input: "let a = 5; let b = a; let c = a + b + 5; c;", expected: 15 },
  ];

  for (const test of tests) {
    testIntegerObject(testEval(test.input), test.expected);
  }
}

function testFunctionObject() {
  const input = "fn(x) { x + 2; };";

  const result = testEval(input);
  if (!(result instanceof mk_Function)) {
    console.error(`object is not Function, got=${result.constructor.name}`);
    return;
  }

  if (result.params.length != 1) {
    console.error(
      `function has wrong parameters. Parameters=${JSON.stringify(
        result.params
      )}`
    );
    return;
  }
  const rparam = result.params[0] as Identifier;
  if (rparam.String() != "x") {
    console.error(`parameter is not "x". got=${rparam.String()}`);
    return;
  }
  const expectedBody = "(x + 2)";
  if (result.body.String() != expectedBody) {
    console.error(`body is not ${expectedBody}. got=${result.body.String()}`);
  }
}

function testFunctionApplication() {
  const tests: { input: string; expected: number }[] = [
    { input: "let identity = fn(x) { x; }; identity(5);", expected: 5 },
    { input: "let identity = fn(x) { return x; }; identity(5);", expected: 5 },
    { input: "let double = fn(x) { x * 2; }; double(5);", expected: 10 },
    { input: "let add = fn(x, y) { x + y; }; add(5, 5);", expected: 10 },
    {
      input: "let add = fn(x, y) { x + y; }; add(5 + 5, add(5, 5));",
      expected: 20,
    },
    { input: "fn(x) { x; }(5)", expected: 5 },
  ];

  for (const test of tests) {
    testIntegerObject(testEval(test.input), test.expected);
  }
}

function testClosures() {
  const input = `
  let newAdder = fn(x) {
  fn(y) { x + y };
  };
  let addTwo = newAdder(2);
  addTwo(2);`;
  testIntegerObject(testEval(input), 4);
}

function testStringLiteral() {
  const input = `"Hello World!"`;
  const evaluated = testEval(input);
  if (!(evaluated instanceof String_OBJ)) {
    console.error(`object is not String. got=${evaluated.Type()}`);
    if (evaluated instanceof error_OBJ) {
      console.error(`\t${evaluated.message}`);
    }
    return;
  }
  if (evaluated.val != "Hello World!") {
    console.error(`String has wrong value. got=${evaluated.val}`);
  }
}

function testStringConcatenation() {
  const input = `"Hello" + " " + "World!"`;
  const evaluated = testEval(input);
  if (!(evaluated instanceof String_OBJ)) {
    console.error(`object is not String. got=${evaluated.Type()}`);
    if (evaluated instanceof error_OBJ) {
      console.error(`\t${evaluated.message}`);
    }
    return;
  }
  if (evaluated.val != "Hello World!") {
    console.error(`String has wrong value. got=${evaluated.val}`);
  }
}

function testBuiltinFunctions() {
  const tests: { input: string; expected: number | string }[] = [
    { input: `len("")`, expected: 0 },
    { input: `len("four")`, expected: 4 },
    { input: `len("hello world")`, expected: 11 },
    {
      input: `len(1)`,
      expected: "argument to `len` not supported, got INTEGER",
    },
    {
      input: `len("one", "two")`,
      expected: "wrong number of arguments. got=2, want=1",
    },
  ];

  for (const test of tests) {
    const r = testEval(test.input);
    if (typeof test.expected == "number") {
      testIntegerObject(r, test.expected);
    } else {
      if (!(r instanceof error_OBJ)) {
        console.error(`object is not Error. got="${r.constructor.name}"`);
        continue;
      }
      if (r.message != test.expected) {
        console.error(
          `wrong error message. expected="${test.expected}", got="${r.message}"`
        );
      }
    }
  }
}

function testIndexExpression() {
  const tests: { input: string; expected: number | null }[] = [
    { input: "[1, 2, 3][0]", expected: 1 },
    { input: "[1, 2, 3][1]", expected: 2 },
    { input: "[1, 2, 3][2]", expected: 3 },
    { input: "let i = 0; [1][i];", expected: 1 },
    { input: "[1, 2, 3][1 + 1];", expected: 3 },
    { input: "let myArray = [1, 2, 3]; myArray[2];", expected: 3 },
    {
      input: "let myArray = [1, 2, 3]; myArray[0] + myArray[1] + myArray[2];",
      expected: 6,
    },
    {
      input: "let myArray = [1, 2, 3]; let i = myArray[0]; myArray[i]",
      expected: 2,
    },
    { input: "[1, 2, 3][3]", expected: null },
    { input: "[1, 2, 3][-1]", expected: null },
  ];

  for (const test of tests) {
    const result = testEval(test.input);
    if (typeof test.expected === "number") {
      testIntegerObject(result, test.expected);
    } else {
      testNullObject(result);
    }
  }
}

function testHashLiterals() {
  const input = `let two = "two";
  {
  "one": 10 - 9,
  two: 1 + 1,
  "thr" + "ee": 6 / 2,
  4: 4,
  true: 5,
  false: 6
  }`;

  const result = testEval(input);
  if (!(result instanceof Hash)) {
    console.error(`Eval didn't return hash. got=${result.Type()}`);
    return;
  }

  const expected = new Map<string, number>([
    [JSON.stringify(new String_OBJ("one").HashKey()), 1],
    [JSON.stringify(new String_OBJ("two").HashKey()), 2],
    [JSON.stringify(new String_OBJ("three").HashKey()), 3],
    [JSON.stringify(new Integer_OBJ(4).HashKey()), 4],
    [JSON.stringify(TRUE.HashKey()), 5],
    [JSON.stringify(FALSE.HashKey()), 6],
  ]);

  if (result.pairMap.size != expected.size) {
    console.error(`Hash has wrong num of pairs. got=${result.pairMap.size}`);
    return;
  }

  for (const [key, hpair] of result.pairMap) {
    const exp = expected.get(key);
    if (exp == undefined) {
      console.error(`no pair for given key in Pairs`);
      continue;
    }
    testIntegerObject(hpair.val, exp);
  }
}

function testHashIndexExpressions() {
  const tests: { input: string; expected: number | null }[] = [
    { input: `{"foo": 5}["foo"]`, expected: 5 },
    { input: `{"foo": 5}["bar"]`, expected: null },
    { input: `let key = "foo"; {"foo": 5}[key]`, expected: 5 },
    { input: `{}["foo"]`, expected: null },
    { input: `{5: 5}[5]`, expected: 5 },
    { input: `{true: 5}[true]`, expected: 5 },
    { input: `{false: 5}[false]`, expected: 5 },
  ];

  for (const test of tests) {
    const result = testEval(test.input);
    if (typeof test.expected == "number") {
      testIntegerObject(result, test.expected);
    } else {
      testNullObject(result);
    }
  }
}

testLetStatements();
testEvalIntegerExpression();
testEvalBooleanExpression();
testBangOperator();
testIfElseExpressions();
testReturnStatements();
testErrorHandling();
testFunctionObject();
testFunctionApplication();
testClosures();
testStringLiteral();
testStringConcatenation();
testBuiltinFunctions();
testIndexExpression();
testHashLiterals();
testHashIndexExpressions();
