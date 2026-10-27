import {describe,expect,it} from 'vitest';
import {WORD_BANK,WORDS_BY_TOPIC,TOPIC_LABELS,normalizeAnswer} from './bank';
import {generateCrossword,validateCrossword,isCrosswordSolved,emptyFill,filledProgress,
  entryCells,findEntryAt,seedRandom,validSave,CROSSWORD_SAVE_KEY} from './logic';

describe('Dominican editorial word bank',()=>{
  it('contains a large and diverse curated catalog without duplicate answers per topic',()=>{
    expect(WORD_BANK.length).toBeGreaterThanOrEqual(130);
    expect(Object.keys(TOPIC_LABELS)).toHaveLength(8);
    for(const [topic,words] of Object.entries(WORDS_BY_TOPIC)){
      expect(words.length,topic).toBeGreaterThanOrEqual(13);
      expect(new Set(words.map(w=>w.answer)).size,topic).toBe(words.length);
      for(const word of words){
        expect(word.answer).toMatch(/^[A-ZÑ]{3,15}$/);
        expect(word.clue.length).toBeGreaterThan(20);
        expect(word.clue.toUpperCase()).not.toContain(word.answer);
      }
    }
  });
  it('preserves Ñ as a separate crossword letter but ignores accents and spaces',()=>{
    expect(normalizeAnswer('año')).toBe('AÑO');
    expect(normalizeAnswer('Bahía de las Águilas')).toBe('BAHIADELASAGUILAS');
    expect(normalizeAnswer('Güira')).toBe('GUIRA');
  });
  it('only labels entries with a direct source URL when linked',()=>{
    const verified=WORD_BANK.filter(term=>term.source);
    expect(verified.length).toBeGreaterThanOrEqual(9);
    expect(verified.every(term=>term.source?.startsWith('https://'))).toBe(true);
  });
});
describe('Crossword procedural generator',()=>{
  const themes=['mixto',...Object.keys(TOPIC_LABELS)] as const;
  it('constructs crossing words, unambiguous numbering and valid reachable cells across themes',()=>{
    for(const theme of themes)for(let seed=1;seed<=9;seed++){
      const crossword=generateCrossword(theme,seed*713+29);
      expect(validateCrossword(crossword),theme+' seed '+seed).toBe(true);
      expect(crossword.entries.length).toBeGreaterThanOrEqual(4);
      expect(crossword.entries.length).toBeLessThanOrEqual(13);
      for(const entry of crossword.entries){
        expect(crossword.numbers[entry.row][entry.col]).toBe(entry.number);
        expect(entryCells(entry)).toHaveLength(entry.answer.length);
        expect(findEntryAt(crossword,entry.row,entry.col)).not.toBeNull();
      }
    }
  },45000);
  it('is reproducible for a saved theme and seed',()=>{
    const a=generateCrossword('lexico',1024);
    const b=generateCrossword('lexico',1024);
    expect(a).toEqual(b);
    expect(seedRandom(41)()).toBe(seedRandom(41)());
  });
  it('creates variations across multiple seeds',()=>{
    const layouts=Array.from({length:9},(_,i)=>generateCrossword('mixto',i+35))
      .map(x=>x.entries.map(e=>e.answer+'@'+e.row+','+e.col).join('|'));
    expect(new Set(layouts).size).toBeGreaterThanOrEqual(7);
  });
  it('recognizes success from all intersections while ignoring black squares',()=>{
    const game=generateCrossword('gastronomia',98);
    const blank=emptyFill(game);
    expect(isCrosswordSolved(game,blank)).toBe(false);
    const filled=game.grid.map(row=>row.map(ch=>ch??''));
    expect(isCrosswordSolved(game,filled)).toBe(true);
    const stats=filledProgress(game,filled);
    expect(stats.correct).toBe(stats.total);
    expect(stats.percent).toBe(100);
    filled[game.entries[0].row][game.entries[0].col]='';
    expect(isCrosswordSolved(game,filled)).toBe(false);
  });
  it('rejects corrupt progress or out-of-range theme for local saves',()=>{
    const game=generateCrossword('geografia',135);
    const saved={theme:game.theme,seed:game.seed,fill:emptyFill(game),elapsedMs:45000,hints:0};
    expect(validSave(saved)).toBe(true);
    expect(validSave({...saved,theme:'inventado'})).toBe(false);
    expect(validSave({...saved,seed:-1})).toBe(false);
    expect(validSave({...saved,fill:[[]]})).toBe(false);
    expect(validSave({...saved,hints:-2})).toBe(false);
    expect(CROSSWORD_SAVE_KEY).toContain('crossword');
  });
});
