
import { Lexer, Token, TokenType } from "./lexer.js";

export interface Member {
  name: string;
  index: number;
  seedTime: number;
}

export interface Team {
  name: string;
  index: string;
  seedTime: string;
  members: Array<Member>;
}

export interface Event {
  index: string;
  teams: Array<Team>;
  gender: string;
  type: string;
  distance: string;
}

export interface EventParserResult {
  events: Array<Event>;
}

export class EventParser {
  tokens: Array<Token>;

  offsetStack: Array<number>;

  offset: number;

  saveOffset () {
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

  available (): number {
    return (this.end-1) - this.offset;
  }

  read (): Token;
  read (count: number): Array<Token>;
  read(count: number = 1): Token|Array<Token> {
    if (!this.hasCount(count)) {
      console.log(Error().stack);
      throw `Cannot read ${count} tokens, only ${this.available()} available in current scope: ${ Token.join( this.read(this.available()), ", " ) }`;
    }
    if (count > 1) {
      return this.tokens.slice(this.offset, this.offset + count);
    } else {
      return this.tokens[this.offset];
    }
  }

  next(n: number = 1): void {
    if (n < 1) n = 1;
    this.offset+=n;
  }

  expected(v: string): void {
    throw `Error at ${this.offset}, expected ${v}, got ${this.read().toString()}`;
  }

  get hasNext (): boolean {
    return this.offset <= this.end;
    // return this.offset < this.tokens.length;
  }
  hasCount (n: number): boolean {
    return this.offset + n-1 <= this.end;
    // return this.offset + n-1 < this.tokens.length;
  }
  is (...compares: Array<string|TokenType>): boolean {
    let count = compares.length;
    if (!this.hasCount(count)) {
      console.log(Error().stack);
      throw `Cannot 'is()' compare, not enough tokens. Asked for ${count}, available ${this.available()}`
    }

    for (let i=0; i<count; i++) {
      let compare = compares[i];

      // is() can handle token type or string, just cast to string to ignore typescript being silly 
      if (!this.tokens[this.offset + i].is(compare as string)) return false;
    }
    return true;
  }

  scopeStack: Array<number>;
  get end () {
    return this.scopeStack[this.scopeStack.length-1];
  }
  get start () {
    return this.scopeStack[this.scopeStack.length-2];
  }
  push_scope (start: number, end: number) {
    this.saveOffset();
    this.offset = start;
    this.scopeStack.push(start, end);
  }
  pop_scope () {
    this.restoreOffset();
    this.scopeStack.pop();
    this.scopeStack.pop();
  }

  findTeamDetails (event: Event, team: Team) {
    if (event.type.endsWith("Relay")) {
      
    } else {
      team.index = this.read().toString();
      let teamNameStart = this.offset;

      while (this.hasCount(2)) {
        if (!this.is(TokenType.NUMBER, ")")) {
          this.next(); continue;
        }
        
        let teamNameEnd = this.offset;
        
        team.name = Token.join( this.tokens.slice(teamNameStart, teamNameEnd), " ");
        console.log("Team Name", team.name);
        //TODO - parse seedTime and Relay 'A' type
        // team.seedTime = Token.join( this.read(5), "" ); this.next(5);
        break;
      }

      if (this.hasCount(20)) console.log ("After Team Name: ", Token.join( this.read(20) ) );
      
    }

    while (this.hasNext) {
      this.next();
    }
  }

  findEventDetails (event: Event, isContinuation: boolean = false) {
    this.next(); //read 'Event'

    event.index = this.read().toString(); this.next();

    event.gender = this.read().toString(); this.next();

    event.distance = this.read().toString(); this.next();

    if (this.read().is("Yard")) this.next();

    event.type = this.read().toString(); this.next();
    if (this.is("Relay")) event.type += " " + this.read().toString(); this.next();

    
    if (isContinuation) {
      if (this.is(")")) this.next(); //closing event continuation marker
      
      //non-continuation does not include headers, no need to skip them
    } else {

      //skip headers
      //Freestyle (but not Freestyle Relay)
      if (event.type.endsWith("Relay")) {
        this.next(4); //Team, Relay, Seed, Time
      } else {
        this.next(5); //Name, Year, School, Seed, Time
      }
    }

    while (this.hasNext) {
      let team: Team = {
        index: undefined,
        members: [],
        name: undefined,
        seedTime: undefined
      };
      event.teams.push(team);

      this.findTeamDetails(event, team);
    }    
  }

  findEventSections (results: Array<Event>) {
    let lastEvtOffset = -1;
    let evtOffset = -1;

    while (this.hasNext) {
      if (this.is("PAGE_END_MARKER")) {
        while (this.hasNext && !this.is("Event")) {
          this.next();
        }
      }
      if (this.hasNext && this.is("Event")) {
        lastEvtOffset = evtOffset;
        evtOffset = this.offset;

        let event: Event;
        
        if (this.hasCount(2) && this.is("...", "(")) {
          this.next(2);

          event = results[results.length-1];
          // console.log("Continuation of", results[results.length-1]);
        } else {
          event = {
            index: undefined,
            type: undefined,
            distance: undefined,
            gender: undefined,
            teams: []
          };

          results.push(event);
        }

        if (lastEvtOffset !== -1 && evtOffset !== -1) {
          this.push_scope(lastEvtOffset, evtOffset);
          this.findEventDetails(event);
          this.pop_scope();

          // console.log("Event", Token.join( this.read(evtOffset - lastEvtOffset) ) );
        }
      }
      this.next();
      

    }

    return results;
  }

  parse(tokens: Token[]): EventParserResult {
    this.tokens = tokens;
    this.offset = 0;
    this.push_scope(this.offset, this.tokens.length-1);

    let result: EventParserResult = { events: [] };
    this.findEventSections(result.events);

    return result;
  }
}

export function parse(src: string) {
  let tokens = Lexer.lex(src);
  let parser = new EventParser();
  return parser.parse(tokens);
}