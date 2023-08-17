import { type Expression } from "./ast";
import { mk_Object } from "./object";

export type prefixParseFn = () => Expression;
export type infixParseFn = (expr: Expression) => Expression;

export enum TokenType {
  //special
  Illegal = "Illegal",
  EOF = "EOF",

  // ident and literal
  Ident = "Ident",
  Int = "Int",
  String = "String",

  // operations
  Assign = "Assign",
  Plus = "Plus",
  Minus = "Minus",
  Bang = "Bang",
  Asterisk = "Asterisk",
  Slash = "Slash",
  LessThan = "LessThan",
  GreaterThan = "GreaterThan",
  Equal = "Equal",
  NotEqual = "NotEqual",

  // semantic
  Comma = "Comma",
  Semicolon = "Semicolon",
  Colon = "Colon",

  // keywords
  Function = "Function",
  Let = "Let",
  True = "True",
  False = "False",
  If = "If",
  Else = "Else",
  Return = "Return",

  // braces
  LeftRoundBrace = "LeftRoundBrace",
  RightRoundBrace = "RightRoundBrace",
  LeftSquirlyBrace = "LeftSquirlyBrace",
  RightSquirlyBrace = "RightSquirlyBrace",
  LeftSquareBrace = "LeftSquareBrace",
  RightSquareBrace = "RightSquareBrace",
}

export type token = { type: TokenType; literal: string | number };

export enum operationOrder {
  LOWEST = 0,
  EQUALS = 1,
  LESSGREATER = 2,
  SUM = 3,
  PRODUCT = 4,
  PREFIX = 5,
  CALL = 6,
  INDEX = 7,
}

export type HashPair = { key: mk_Object; val: mk_Object };

export enum ObjectType {
  INTEGER = "INTEGER",
  BOOLEAN = "BOOLEAN",
  STRING = "STRING",
  NULL = "NULL",
  RETURN_VALUE = "RETURN_VALUE",
  ERROR = "ERROR",
  FUNCTION = "FUNCTION",
  BUILTIN = "BUILTIN",
  ARRAY = "ARRAY",
  HASH_OBJ = "HASH",
}
