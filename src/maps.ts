import { TokenType, operationOrder } from "./types";

export const precedences: Map<TokenType, operationOrder> = new Map([
  [TokenType.Equal, operationOrder.EQUALS],
  [TokenType.NotEqual, operationOrder.EQUALS],
  [TokenType.LessThan, operationOrder.LESSGREATER],
  [TokenType.GreaterThan, operationOrder.LESSGREATER],
  [TokenType.Plus, operationOrder.SUM],
  [TokenType.Minus, operationOrder.SUM],
  [TokenType.Slash, operationOrder.PRODUCT],
  [TokenType.Asterisk, operationOrder.PRODUCT],
  [TokenType.LeftRoundBrace, operationOrder.CALL],
  [TokenType.LeftSquareBrace, operationOrder.INDEX],
]);

export const keywords: Record<string, TokenType> = {
  fn: TokenType.Function,
  let: TokenType.Let,
  true: TokenType.True,
  false: TokenType.False,
  if: TokenType.If,
  else: TokenType.Else,
  return: TokenType.Return,
} as const;
