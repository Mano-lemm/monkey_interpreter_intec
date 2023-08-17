import {
  BooleanLiteral,
  ExpressionStatement,
  IntegerLiteral,
  type Node,
  Program,
  StringLiteral,
  PrefixExpression,
  InfixExpression,
  BlockStatement,
  IfExpression,
  ReturnStatement,
  LetStatement,
  Identifier,
  FunctionLiteral,
  CallExpression,
  type Expression,
  ArrayLiteral,
  IndexExpression,
  HashLiteral,
} from "./ast";
import {
  FALSE,
  Integer_OBJ,
  NULL,
  String_OBJ,
  TRUE,
  returnValue,
  type mk_Object,
  error_OBJ,
  Environment,
  mk_Function,
  builtins,
  Builtin,
  Array_OBJ,
  Hash,
  Hashable,
} from "./object";
import { ObjectType } from "./types";

// being able to switch on the type would be very nice here but
// as far as i know it isnt possible in typescript
export function evaluate(node: Node, env: Environment): mk_Object {
  if (node instanceof ExpressionStatement) {
    if (node.expr == undefined) {
      return new error_OBJ("expression of ExpressionStatement is undefined");
    }
    return evaluate(node.expr, env);
  } /* literal expressions */ else if (node instanceof IntegerLiteral) {
    return new Integer_OBJ(node.val);
  } else if (node instanceof BooleanLiteral) {
    return node.val ? TRUE : FALSE;
  } else if (node instanceof StringLiteral) {
    return new String_OBJ(node.val);
  } else if (node instanceof Program) {
    return evalProgram(node, env);
  } else if (node instanceof PrefixExpression) {
    if (node.right == undefined) {
      return new error_OBJ("right expression of PrefixExpression is undefined");
    }
    const right = evaluate(node.right, env);
    return evalPrefixExpression(node.operator, right);
  } else if (node instanceof InfixExpression) {
    const left = evaluate(node.left, env);
    if (left instanceof error_OBJ) {
      return left;
    }
    if (node.right == undefined) {
      return new error_OBJ("right expression of InfixExpression is undefined");
    }
    const right = evaluate(node.right, env);
    if (right instanceof error_OBJ) {
      return right;
    }
    return evalInfixExpression(node.oper, left, right);
  } else if (node instanceof BlockStatement) {
    return evalBlockStatement(node, env);
  } else if (node instanceof IfExpression) {
    return evalIfExpression(node, env);
  } else if (node instanceof ReturnStatement) {
    if (node.rval == undefined) {
      return NULL;
    }
    const val = evaluate(node.rval, env);
    if (val == undefined) {
      return NULL;
    }
    return new returnValue(val);
  } else if (node instanceof LetStatement) {
    if (node.val == undefined) {
      return new error_OBJ(`let statement with undefined value`);
    }
    const val = evaluate(node.val, env);
    if (isError(val)) {
      return val;
    }
    env.set(node.name.val, val);
    return val;
  } else if (node instanceof Identifier) {
    return evalIdentifier(node, env);
  } else if (node instanceof FunctionLiteral) {
    const params = node.parameters;
    const body = node.body;
    return new mk_Function(params, body, env);
  } else if (node instanceof CallExpression) {
    const func = evaluate(node.func, env);
    if (isError(func)) {
      return func;
    }
    const args = evalExpressions(node.args, env);
    if (args[0] != undefined && isError(args[0])) {
      return args[0];
    }
    return applyFunction(func, args);
  } else if (node instanceof ArrayLiteral) {
    const el = evalExpressions(node.elements, env);
    if (el.length === 1 && el[0] instanceof error_OBJ) {
      return el[0];
    }
    return new Array_OBJ(el);
  } else if (node instanceof IndexExpression) {
    const left = evaluate(node.left, env);
    if (isError(left)) {
      return left;
    }
    const idx = evaluate(node.index, env);
    if (isError(idx)) {
      return idx;
    }
    return evalIndexExpression(left, idx);
  } else if (node instanceof HashLiteral) {
    return evalHashLiteral(node, env);
  }
  return new error_OBJ(`unhandled ast node of type ${node.constructor.name}`);
}

function evalProgram(prog: Program, env: Environment): mk_Object {
  let result: mk_Object = NULL;
  for (const statement of prog.statements) {
    result = evaluate(statement, env);

    if (result instanceof returnValue) {
      return result.value;
    } else if (result instanceof error_OBJ) {
      return result;
    }
  }
  return result;
}

function evalBlockStatement(
  block: BlockStatement,
  env: Environment
): mk_Object {
  let result: mk_Object = NULL;

  for (const stmt of block.statements) {
    const tmp = evaluate(stmt, env);
    result = tmp == undefined ? NULL : tmp;
    if (result instanceof returnValue || result instanceof error_OBJ) {
      return result;
    }
  }

  return result;
}

function evalPrefixExpression(oper: string, right: mk_Object): mk_Object {
  switch (oper) {
    case "!":
      return evalBangOperatorExpression(right);
    case "-":
      return evalMinusPrefixOperatorExpression(right);
    default:
      return new error_OBJ(`unknown operator: ${oper}${right.Type()}`);
  }
}

function evalBangOperatorExpression(right: mk_Object): mk_Object {
  switch (right) {
    case TRUE:
      return FALSE;
    case FALSE:
      return TRUE;
    case NULL:
      return TRUE;
    default:
      return FALSE;
  }
}

function evalMinusPrefixOperatorExpression(right: mk_Object): mk_Object {
  if (right.Type() != ObjectType.INTEGER) {
    return new error_OBJ(`unknown operator: -${right.Type()}`);
  }
  const value = (right as Integer_OBJ).val;
  return new Integer_OBJ(-value);
}

function evalInfixExpression(
  operator: string,
  left: mk_Object,
  right: mk_Object
): mk_Object {
  if (left.Type() != right.Type()) {
    return new error_OBJ(
      `type mismatch: ${left.Type()} ${operator} ${right.Type()}`
    );
  }
  if (left.Type() == ObjectType.INTEGER && right.Type() == ObjectType.INTEGER) {
    return evalIntegerInfixExpression(operator, left, right);
  } else if (
    left.Type() == ObjectType.STRING &&
    right.Type() == ObjectType.STRING
  ) {
    return evalStringInfixExpression(operator, left, right);
  }
  // should only be entered by booleans or null
  // we can check for hard equality because we never allocate new booleans
  // so the objects will be the same ones in memory
  if (operator === "==") {
    return left === right ? TRUE : FALSE;
  } else if (operator === "!=") {
    return left !== right ? TRUE : FALSE;
  }
  return new error_OBJ(
    `unknown operator: ${left.Type()} ${operator} ${right.Type()}`
  );
}

function evalIntegerInfixExpression(
  operator: string,
  left: mk_Object,
  right: mk_Object
): mk_Object {
  const rightVal = (right as Integer_OBJ).val;
  const leftVal = (left as Integer_OBJ).val;
  switch (operator) {
    case "+":
      return new Integer_OBJ(leftVal + rightVal);
    case "-":
      return new Integer_OBJ(leftVal - rightVal);
    case "*":
      return new Integer_OBJ(leftVal * rightVal);
    case "/":
      return new Integer_OBJ(Math.floor(leftVal / rightVal));
    case "<":
      return leftVal < rightVal ? TRUE : FALSE;
    case ">":
      return leftVal > rightVal ? TRUE : FALSE;
    case "==":
      return leftVal == rightVal ? TRUE : FALSE;
    case "!=":
      return leftVal != rightVal ? TRUE : FALSE;
    default:
      return new error_OBJ(
        `unknown operator: ${left.Type()} ${operator} ${right.Type()}`
      );
  }
}

function evalStringInfixExpression(
  operator: string,
  left: mk_Object,
  right: mk_Object
): mk_Object {
  if (operator != "+") {
    return new error_OBJ(
      `unknown operator: ${left.Type()} ${operator} ${right.Type()}`
    );
  }
  return new String_OBJ((left as String_OBJ).val + (right as String_OBJ).val);
}

function evalIfExpression(node: IfExpression, env: Environment): mk_Object {
  const cond = evaluate(node.condition, env);
  if (cond == undefined) {
    return new error_OBJ("Expecting result, got undefined instead.");
  }
  if (isTruthy(cond)) {
    return evaluate(node.consequence, env);
  } else if (node.alternative != undefined) {
    return evaluate(node.alternative, env);
  }
  return NULL;
}

function evalIdentifier(node: Identifier, env: Environment): mk_Object {
  let val = env.get(node.val);
  if (val != undefined) {
    return val;
  }
  val = builtins.get(node.val);
  if (val != undefined) {
    return val;
  }
  return new error_OBJ(`identifier not found: ${node.val}`);
}

function evalExpressions(exps: Expression[], env: Environment): mk_Object[] {
  const result: mk_Object[] = [];
  for (const expr of exps) {
    const evaluated = evaluate(expr, env);
    if (isError(evaluated)) {
      return [evaluated];
    }
    result.push(evaluated);
  }
  return result;
}

function evalIndexExpression(left: mk_Object, index: mk_Object): mk_Object {
  if (left.Type() == ObjectType.ARRAY && index.Type() == ObjectType.INTEGER) {
    return evalArrayIndexExpression(left as Array_OBJ, index as Integer_OBJ);
  } else if (left.Type() == ObjectType.HASH_OBJ) {
    return evalHashIndexExpression(left as Hash, index);
  }
  return new error_OBJ(`index operator not supported: ${left.Type()}`);
}

function evalArrayIndexExpression(
  left: Array_OBJ,
  index: Integer_OBJ
): mk_Object {
  if (index.val < 0 || index.val > left.elements.length - 1) {
    return NULL;
  }
  const r = left.elements[index.val];
  return r == undefined ? NULL : r;
}

function evalHashIndexExpression(hash: Hash, index: mk_Object): mk_Object {
  if ((<mk_Object & Hashable>index).HashKey != undefined) {
    const r = hash.get(<mk_Object & Hashable>index);
    if (r == undefined) {
      return NULL;
    }
    return r.val;
  }
  return new error_OBJ(`unusable as hash key: ${index.Type()}`);
}

function evalHashLiteral(node: HashLiteral, env: Environment): mk_Object {
  let pairs = new Hash();

  for (const kv of node.pairs) {
    let key = evaluate(kv[0], env);
    if (isError(key)) {
      return key;
    }
    // fucked up interface impl check
    if ((<Hashable & mk_Object>key).HashKey == undefined) {
      return new error_OBJ(`unusable as hash key: ${key.Type()}`);
    }

    const value = evaluate(kv[1], env);
    if (isError(value)) {
      return value;
    }
    pairs.put(<Hashable & mk_Object>key, value);
  }
  return pairs;
}

function applyFunction(func: mk_Object, args: mk_Object[]): mk_Object {
  if (func instanceof mk_Function) {
    const extEnv = extendFunctionEnv(func, args);
    const evaluated = evaluate(func.body, extEnv);
    return unwrapReturnValue(evaluated);
  } else if (func instanceof Builtin) {
    return func.fn(args);
  }
  return new error_OBJ(`not a function: ${func.Type()}`);
}

function extendFunctionEnv(func: mk_Function, args: mk_Object[]) {
  const fenv = new Environment(new Map<string, mk_Object>(), func.env);
  for (const [idx, obj] of func.params.entries()) {
    const arg = args[idx];
    if (arg != undefined) {
      fenv.set(obj.val, arg);
    }
  }
  return fenv;
}

function unwrapReturnValue(obj: mk_Object): mk_Object {
  if (obj instanceof returnValue) {
    return obj.value;
  }
  return obj;
}

function isTruthy(obj: mk_Object): boolean {
  if (obj == NULL) {
    return false;
  } else if (obj == TRUE) {
    return true;
  } else if (obj == FALSE) {
    return false;
  }
  return true;
}

function isError(obj: mk_Object | undefined) {
  if (obj == undefined) {
    return false;
  }
  return obj.Type() == ObjectType.ERROR;
}
