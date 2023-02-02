
import { Output, State } from "./scanner.js";
import { Scanner } from "./scanner.js";

export enum TokenType {
  IDENTIFIER,
  CURLY_BRACKET,
  PARENTHESIS,
  COLON,
  STRING,
  NUMBER,
  COMMA
}

export class Token {
  src: string;
  contentStart: number;
  contentEnd: number;

  type: TokenType;

  constructor () {

  }

  is(t: TokenType): boolean;
  is(t: TokenType, exactly: string): boolean;
  is(exactly: string): boolean;
  is(a: TokenType | string, b?: string): boolean {
    if (typeof (a) === "string") {
      return this.toString() === a;
    } else {
      if (b !== undefined) {
        return this.type === a && this.toString() === b;
      } else {
        return this.type === a;
      }
    }
  }

  toString(): string {
    return this.src.substring(
      this.contentStart, this.contentEnd
    );
  }
  static from(s: State, o: Output, type: TokenType): Token {
    let t = new Token();
    t.type = type;
    t.src = s.src;
    t.contentStart = o.contentStart;
    t.contentEnd = o.contentEnd;
    return t;
  }
}

export class Lexer {
  
  static lex (src: string): Array<Token> {
    let result = new Array<Token>();
    
    let s: State = {
      src,
      offset: 0,
      srcLength: src.length
    };
    
    let o: Output = {
      contentEnd: 0,
      contentStart: 0,
      successfulReadCount: 0
    };
    
    while (s.offset < s.srcLength) {
//      System.out.printf("Offset %d of %d\n", s.offset, s.srcLength);
      
      Scanner.whitespace(s, o); //ignore whitespace
      if (Scanner.success(o)) Scanner.advance(s, o);
      
      Scanner.single(s, o, '(');
      if (Scanner.success(o)) { Scanner.advance(s, o); result.push(Token.from(s, o, TokenType.PARENTHESIS)); continue; }
  
      Scanner.single(s, o, ')');
      if (Scanner.success(o)) { Scanner.advance(s, o); result.push(Token.from(s, o, TokenType.PARENTHESIS)); continue; }

      // Scanner.fromTo(s, o, '"', '"');
      // if (Scanner.success(o)) { Scanner.advance(s, o); result.push(Token.from(s, o, TokenType.STRING)); continue; }
      
      Scanner.charset(s, o, "0123456789");
      if (Scanner.success(o)) { Scanner.advance(s, o); result.push(Token.from(s, o, TokenType.NUMBER)); continue; }
      
      Scanner.charset(s, o, "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_',.?:&$!/\\|[]");
      if (Scanner.success(o)) { Scanner.advance(s, o); result.push(Token.from(s, o, TokenType.IDENTIFIER)); continue; }

      console.log(`end with no match "${s.src.substring(s.offset, s.offset + 10)}"`);

      break;
    }
    
    
    return result;
  }
  
}