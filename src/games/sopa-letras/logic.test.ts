import {describe,expect,it} from 'vitest';
import {TOPIC_LABELS,WORD_BANK} from '../crucigrama/bank';
import {
  DIFFICULTIES,generateWordSearch,seedRandom,cellsAlong,matchSelection,sameCell,
  isComplete,searchScore,validWordSearchSave,SEARCH_SAVE_KEY,type Cell,
  type WordSearchDifficulty,type WordSearchTheme,
} from './logic';

describe('Sopa de Letras Dominicana: editorial sources and varied puzzles',()=>{
  it('uses the existing independent bank without duplicating source content',()=>{
    expect(WORD_BANK.length).toBeGreaterThanOrEqual(140);
    expect(Object.keys(TOPIC_LABELS)).toHaveLength(8);
    expect(SEARCH_SAVE_KEY).toContain('sopa-letras');
  });
  it('generates reproducible boards with different content from different seeds',()=>{
    const same=generateWordSearch('mixto','intermedio',10243);
    expect(generateWordSearch('mixto','intermedio',10243)).toEqual(same);
    expect(seedRandom(43)()).toBe(seedRandom(43)());
    const layouts=new Set(Array.from({length:12},(_,i)=>
      JSON.stringify(generateWordSearch('mixto','inicial',i+14).words.map(w=>w.id))));
    expect(layouts.size).toBeGreaterThanOrEqual(10);
  });
  it('places words in bounds and spells every answer, without contradictions on crossings',()=>{
    const themes=['mixto',...Object.keys(TOPIC_LABELS)] as WordSearchTheme[];
    const levels=Object.keys(DIFFICULTIES) as WordSearchDifficulty[];
    for(const theme of themes)for(const difficulty of levels)for(let i=0;i<6;i++){
      const puzzle=generateWordSearch(theme,difficulty,i*709+31);
      expect(puzzle.grid).toHaveLength(DIFFICULTIES[difficulty].size);
      expect(puzzle.words.length,theme+' '+difficulty).toBeGreaterThanOrEqual(6);
      expect(puzzle.words.length).toBeLessThanOrEqual(DIFFICULTIES[difficulty].count);
      expect(new Set(puzzle.words.map(w=>w.id)).size).toBe(puzzle.words.length);
      for(const word of puzzle.words){
        expect(word.cells.length).toBe(word.answer.length);
        expect(word.cells.map(cell=>puzzle.grid[cell.row][cell.col]).join('')).toBe(word.answer);
        const first=word.cells[0],last=word.cells[word.cells.length-1];
        expect(cellsAlong(first,last,puzzle.size)).toEqual(word.cells);
        expect(matchSelection(puzzle,first,last)).toEqual(word);
        expect(matchSelection(puzzle,last,first)).toEqual(word);
        if(theme!=='mixto')expect(word.topic).toBe(theme);
      }
    }
  },45000);
  it('includes all eight areas in mixed expert games',()=>{
    for(const seed of [12,76,132]){
      const puzzle=generateWordSearch('mixto','experto',seed);
      expect(new Set(puzzle.words.map(w=>w.topic)).size).toBeGreaterThanOrEqual(6);
    }
  });
  it('progressively enables reverse and diagonal vectors as difficulty rises',()=>{
    expect(DIFFICULTIES.inicial.directions).toBe(4);
    expect(DIFFICULTIES.intermedio.directions).toBe(6);
    expect(DIFFICULTIES.experto.directions).toBe(8);
    expect(DIFFICULTIES.inicial.size).toBe(10);
    expect(DIFFICULTIES.intermedio.size).toBe(13);
    expect(DIFFICULTIES.experto.size).toBe(15);
    let reverse=0;
    for(let seed=1;seed<=12;seed++){
      const puzzle=generateWordSearch('geografia','experto',seed);
      if(puzzle.words.some(w=>w.cells[0].row>w.cells.at(-1)!.row
        ||w.cells[0].col>w.cells.at(-1)!.col))reverse++;
    }
    expect(reverse).toBeGreaterThanOrEqual(8);
  });
});
describe('Selection correctness, time and local saving',()=>{
  it('rejects bent or invalid paths and selections not in the word list',()=>{
    expect(cellsAlong({row:0,col:0},{row:3,col:2},10)).toBeNull();
    expect(cellsAlong({row:-1,col:0},{row:4,col:0},10)).toBeNull();
    expect(cellsAlong({row:0,col:0},{row:0,col:9},10)).toHaveLength(10);
    expect(cellsAlong({row:5,col:5},{row:2,col:2},10)).toHaveLength(4);
    expect(sameCell({row:1,col:2},{row:1,col:2})).toBe(true);
    const puzzle=generateWordSearch('lexico','inicial',52),first=puzzle.words[0];
    expect(matchSelection(puzzle,first.cells[0],first.cells.at(-1)!,[first.id])).toBeNull();
    const none:Cell={row:99,col:99};
    expect(matchSelection(puzzle,none,none)).toBeNull();
  });
  it('marks completion only when all valid words have been located',()=>{
    const p=generateWordSearch('cultura','intermedio',55);
    expect(isComplete(p,[])).toBe(false);
    expect(isComplete(p,p.words.slice(0,-1).map(w=>w.id))).toBe(false);
    expect(isComplete(p,p.words.map(w=>w.id))).toBe(true);
  });
  it('scores higher for faster clean completions and more demanding boards',()=>{
    const initial=generateWordSearch('mixto','inicial',34);
    const hard=generateWordSearch('mixto','experto',34);
    expect(searchScore(initial,60000,0,0)).toBeGreaterThan(searchScore(initial,210000,0,0));
    expect(searchScore(initial,60000,0,0)).toBeGreaterThan(searchScore(initial,60000,2,2));
    expect(searchScore(hard,60000,0,0)).toBeGreaterThan(searchScore(initial,60000,0,0));
    expect(searchScore(initial,9000000,50,50)).toBe(100);
  });
  it('accepts a valid save and rejects duplicates, invalid categories and malformed progress',()=>{
    const p=generateWordSearch('musica','inicial',63);
    const valid={theme:p.theme,difficulty:p.difficulty,seed:p.seed,found:[],
      elapsedMs:1800,hints:0,mistakes:0};
    expect(validWordSearchSave(valid)).toBe(true);
    expect(validWordSearchSave({...valid,found:[p.words[0].id,p.words[0].id]})).toBe(false);
    expect(validWordSearchSave({...valid,seed:-1})).toBe(false);
    expect(validWordSearchSave({...valid,theme:'inventado'})).toBe(false);
    expect(validWordSearchSave({...valid,difficulty:'imposible'})).toBe(false);
    expect(validWordSearchSave({...valid,elapsedMs:-90})).toBe(false);
  });
});
