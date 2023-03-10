import { Lexer, Token, TokenType } from "./lexer.js";
export class EventParser {
  saveOffset() {
    this.offsetStack.push(this.offset);
  }
  restoreOffset() {
    this.offset = this.offsetStack.pop();
  }
  constructor() {
    this.offsetStack = new Array();
    this.scopeStack = new Array();
    this.offset = 0;
  }
  available() {
    return this.end - 1 - this.offset;
  }
  read(count = 1) {
    if (!this.hasCount(count)) {
      console.log(Error().stack);
      throw `Cannot read ${count} tokens, only ${this.available()} available in current scope: ${Token.join(this.read(this.available()), ", ")}`;
    }
    if (count > 1) {
      return this.tokens.slice(this.offset, this.offset + count);
    } else {
      return this.tokens[this.offset];
    }
  }
  next(n = 1) {
    if (n < 1) n = 1;
    this.offset += n;
  }
  expected(v, n = 1) {
    let min = Math.min(n, this.available());
    let got;
    if (min < 2) {
      got = this.read().toString();
    } else {
      got = Token.join(this.read(min), " ");
    }
    throw `Error at ${this.offset}, expected ${v}, got ${got}`;
  }
  get hasNext() {
    return this.offset <= this.end;
    // return this.offset < this.tokens.length;
  }

  hasCount(n) {
    return this.offset + n - 1 <= this.end;
    // return this.offset + n-1 < this.tokens.length;
  }

  is(...compares) {
    let count = compares.length;
    if (!this.hasCount(count)) {
      console.log(Error().stack);
      throw `Cannot 'is()' compare, not enough tokens. Asked for ${count}, available ${this.available()}`;
    }
    for (let i = 0; i < count; i++) {
      let compare = compares[i];

      // is() can handle token type or string, just cast to string to ignore typescript being silly 
      if (!this.tokens[this.offset + i].is(compare)) return false;
    }
    return true;
  }
  get end() {
    return this.scopeStack[this.scopeStack.length - 1];
  }
  get start() {
    return this.scopeStack[this.scopeStack.length - 2];
  }
  push_scope(start, end) {
    this.saveOffset();
    this.offset = start;
    this.scopeStack.push(start, end);
  }
  pop_scope() {
    this.restoreOffset();
    this.scopeStack.pop();
    this.scopeStack.pop();
  }
  findTeamMember(member) {
    this.expect(TokenType.NUMBER, ")");
    if (this.hasNext) member.name = Token.join(this.read(this.available()));
    this.next(this.available());
  }
  findTeamDetails(event, team) {
    let memberOffsets = new Array();
    if (event.isIndividual) {} else {
      team.index = this.read().toString();
      this.next();
      let teamNameStart = this.offset;
      while (this.hasNext) {
        if (!this.is(TokenType.NUMBER)) {
          this.next();
          continue;
        }
        let teamNameEnd = this.offset;
        let teamNameTokenCount = teamNameStart - teamNameEnd;
        let teamNameTokens = this.tokens.slice(teamNameStart, teamNameEnd);
        if (teamNameTokens[teamNameTokens.length - 1].is("A")) teamNameTokens.pop();
        team.name = Token.join(teamNameTokens, " ");
        this.read(teamNameTokenCount);
        console.log("Team Name", team.name);
        //TODO - parse Relay 'A' type

        team.seedTime = Token.join(this.read(5), "");
        this.next(5);
        break;
      }
      if (!this.hasNext) return;
      while (this.hasNext) {
        if (this.hasCount(2) && this.is(TokenType.NUMBER, ")")) {
          memberOffsets.push(this.offset);
          this.next(2);
        } else {
          if (this.is(TokenType.NUMBER)) {
            let bounds = new Array();
            for (let i = 0; i < memberOffsets.length - 1; i++) {
              let start = memberOffsets[i];
              let end = this.offset;
              if (i + 1 < memberOffsets.length) end = memberOffsets[i + 1];
              bounds.push({
                start,
                end
              });
            }
            for (let {
              start,
              end
            } of bounds) {
              let member = {
                index: undefined,
                name: undefined
              };
              team.members.push(member);
              this.push_scope(start, end);
              this.findTeamMember(member);
              this.pop_scope();
            }
            return;
          } else {
            this.next();
          }
        }
      }
      console.log(memberOffsets);
    }
    while (this.hasNext) {
      this.next();
    }
  }
  expect(...compares) {
    let success = false;
    try {
      success = this.is(...compares);
    } catch (ex) {
      success = false;
    }
    if (!success) {
      for (let i = 0; i < compares.length; i++) {
        if (typeof compares[i] !== "string") {
          compares[i] = `TokenType[${compares[i]}]`;
        }
      }
      this.expected(compares.join(","), compares.length);
    } else {
      this.next(compares.length);
    }
  }
  findEventDetails(event, isContinuation = false) {
    event.gender = this.read().toString();
    this.next();
    event.distance = this.read().toString();
    this.next();
    this.expect("Yard");
    // if (this.read().is("Yard")) this.next();

    event.type = this.read().toString();
    this.next();
    if (this.is("Relay")) {
      event.type += " " + this.read().toString();
      this.next();
    }
    if (isContinuation) {
      this.expect(")");
      // if (this.is(")")) this.next(); //closing event continuation marker

      //non-continuation does not include headers, no need to skip them
    } else {
      event.isIndividual = !this.is("Team");
      //skip headers
      //Freestyle (but not Freestyle Relay)
      if (event.isIndividual) {
        this.expect("Name", "Year", "School", "Seed", "Time");
      } else {
        this.expect("Team", "Relay", "Seed", "Time");
      }
    }
    while (this.hasNext) {
      let team = {
        index: undefined,
        members: [],
        name: undefined,
        seedTime: undefined
      };
      event.teams.push(team);
      this.findTeamDetails(event, team);
    }
  }
  findEventSections(results) {
    let lastEvtOffset = -1;
    let evtOffset = -1;
    let eventBounds = new Array();

    //location bounds
    while (this.hasNext) {
      if (this.is("PAGE_END_MARKER")) {
        while (this.hasNext && !this.is("Event")) {
          this.next();
        }
      }
      if (this.hasNext && this.is("Event")) {
        lastEvtOffset = evtOffset;
        evtOffset = this.offset;
        if (lastEvtOffset !== -1) eventBounds.push({
          start: lastEvtOffset,
          end: evtOffset
        });
      }
      this.next();
    }
    eventBounds.push({
      start: lastEvtOffset,
      end: this.tokens.length - 1
    });

    //process bounds separately
    for (let {
      start,
      end
    } of eventBounds) {
      this.push_scope(start, end);
      this.expect("Event");
      let index = this.read().toString();
      this.next();
      let event;
      let isContinuation = false;
      if (this.is("...", "(")) {
        isContinuation = true;
        event = results[results.length - 1];
        this.next(2);
      } else {
        isContinuation = false;
        event = {
          index,
          type: undefined,
          distance: undefined,
          gender: undefined,
          teams: [],
          isIndividual: undefined
        };
        results.push(event);
      }
      this.findEventDetails(event, isContinuation);
      this.pop_scope();
    }
    return results;
  }
  parse(tokens) {
    this.tokens = tokens;
    this.offset = 0;
    this.push_scope(this.offset, this.tokens.length - 1);
    let result = {
      events: []
    };
    this.findEventSections(result.events);
    return result;
  }
}
export function parse(src) {
  let tokens = Lexer.lex(src);
  let parser = new EventParser();
  return parser.parse(tokens);
}