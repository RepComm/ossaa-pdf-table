export class Scanner {
  static whitespace(s, o) {
    Scanner.clear(o);
    o.contentStart = s.offset;
    let c;
    for (let i = s.offset; i < s.srcLength; i++) {
      c = s.src.charAt(i);
      if (Scanner.whitespaceChars.indexOf(c) < 0) {
        o.contentEnd = i;
        o.successfulReadCount = o.contentEnd - o.contentStart;
        break;
      }
    }
  }
  static clear(o) {
    o.successfulReadCount = 0;
    o.contentStart = 0;
    o.contentEnd = 0;
  }
  static single(s, o, matcher) {
    Scanner.clear(o);
    if (s.src.charAt(s.offset) == matcher) {
      o.contentStart = s.offset;
      o.contentEnd = o.contentStart + 1;
      o.successfulReadCount = 1;
    }
  }
  static str(s, o, matcher) {
    Scanner.clear(o);
    let searchLen = matcher.length;
    for (let i = s.offset; i < searchLen; i++) {
      if (matcher.charAt(i) != s.src.charAt(i)) return;
    }
    o.contentStart = s.offset;
    o.contentEnd = o.contentStart + searchLen;
    o.successfulReadCount = searchLen;
  }
  static charset(s, o, charset) {
    Scanner.clear(o);
    o.contentStart = s.offset;
    let c;
    for (let i = s.offset; i < s.srcLength; i++) {
      c = s.src.charAt(i);
      if (charset.indexOf(c) < 0) {
        o.contentEnd = i;
        o.successfulReadCount = o.contentEnd - o.contentStart;
        break;
      }
    }
  }
  static fromTo(s, o, begin, end = undefined) {
    if (end == undefined) end = begin;
    Scanner.single(s, o, begin);
    if (!Scanner.success(o)) return;
    Scanner.advance(s, o);
    o.contentStart = s.offset;
    let c;
    for (let i = s.offset; i < s.srcLength; i++) {
      c = s.src.charAt(i);
      if (c == end) {
        o.contentEnd = i;
        o.successfulReadCount = o.contentEnd - o.contentStart + 1;
        break;
      }
    }
  }
  static success(o) {
    return o.successfulReadCount > 0;
  }
  static advance(s, o) {
    s.offset += o.successfulReadCount;
    //    s.offset = o.contentEnd;
  }
}

Scanner.whitespaceChars = " \n\t\r ";