import {describe,it,expect} from 'vitest';
import {COUNTRIES,COUNTRY_OPTIONS,isCountryFilter} from './countries';
import {WORD_BANK,termsFor,topicsFor,normalizeAnswer} from './bank';
import {generateCrossword,validateCrossword,validSave,emptyFill} from './logic';
import {generateWordSearch,validWordSearchSave,DIFFICULTIES} from '../sopa-letras/logic';
describe('Selección geográfica panhispánica',()=>{
  it('offers explicit country choices and preserves original Dominican content',()=>{
    expect(COUNTRIES.length).toBeGreaterThanOrEqual(12);
    expect(COUNTRY_OPTIONS[0].code).toBe('todos');
    expect(isCountryFilter('MX')).toBe(true);
    expect(isCountryFilter('ES')).toBe(true);
    expect(isCountryFilter('inventado')).toBe(false);
    expect(termsFor('DO').length).toBeGreaterThanOrEqual(140);
    expect(WORD_BANK.length).toBeGreaterThan(300);
  });
  it('provides meaningful varied word pools for every selected country',()=>{
    for(const country of COUNTRIES){
      const terms=termsFor(country.code);
      expect(terms.length,country.name).toBeGreaterThanOrEqual(16);
      expect(new Set(terms.map(w=>w.topic)).size,country.name).toBeGreaterThanOrEqual(4);
      expect(terms.every(w=>w.country===country.code),country.name).toBe(true);
      expect(terms.every(w=>w.answer.length>=3&&w.answer.length<=15&&/^[A-ZÑ]+$/.test(w.answer)),country.name).toBe(true);
      expect(terms.every(w=>w.clue.length>20),country.name).toBe(true);
    }
    expect(termsFor('MX').some(w=>w.answer==='MARIACHI')).toBe(true);
    expect(termsFor('AR').some(w=>w.answer==='TANGO')).toBe(true);
    expect(termsFor('DO').some(w=>w.answer==='CHINOLA')).toBe(true);
    expect(termsFor('ES').some(w=>w.answer==='PAELLA')).toBe(true);
  });
  it('filters by country and topic without leaking another country',()=>{
    expect(termsFor('MX','gastronomia').length).toBeGreaterThanOrEqual(5);
    expect(termsFor('ES','gastronomia').every(w=>w.country==='ES'&&w.topic==='gastronomia')).toBe(true);
    expect(topicsFor('DO').length).toBeGreaterThanOrEqual(5);
    expect(topicsFor('MX').every(topic=>termsFor('MX',topic).length>=10)).toBe(true);
    expect(normalizeAnswer('niñez')).toBe('NIÑEZ');
  });
  it('creates a crossable country-only crossword for all options',()=>{
    for(const country of COUNTRIES){
      const puzzle=generateCrossword('mixto',2222,country.code);
      expect(puzzle.country).toBe(country.code);
      expect(puzzle.entries.length,country.code).toBeGreaterThanOrEqual(4);
      expect(puzzle.entries.every(w=>w.country===country.code)).toBe(true);
      expect(validateCrossword(puzzle)).toBe(true);
      expect(generateCrossword('mixto',2222,country.code)).toEqual(puzzle);
    }
  },45000);
  it('creates national word searches in three difficulties, always bound to the selected country',()=>{
    for(const country of COUNTRIES)for(const level of Object.keys(DIFFICULTIES) as (keyof typeof DIFFICULTIES)[]){
      const puzzle=generateWordSearch('mixto',level,9815,country.code);
      expect(puzzle.country).toBe(country.code);
      expect(puzzle.words.length,country.code+' '+level).toBeGreaterThanOrEqual(6);
      expect(puzzle.words.every(w=>w.country===country.code)).toBe(true);
    }
  },45000);
  it('retains country selection in saves and accepts prior saves without country',()=>{
    const crossword=generateCrossword('mixto',88,'PE');
    const saved={theme:'mixto',country:'PE',seed:88,elapsedMs:100,fill:emptyFill(crossword),hints:0};
    expect(validSave(saved)).toBe(true);
    expect(validSave({...saved,country:'OTHER'})).toBe(false);
    expect(validSave({...saved,country:undefined})).toBe(true);
    const letters=generateWordSearch('mixto','inicial',88,'CL');
    const save={theme:'mixto',country:'CL',difficulty:'inicial',seed:88,found:[letters.words[0].id],elapsedMs:100,hints:0,mistakes:0};
    expect(validWordSearchSave(save)).toBe(true);
    expect(validWordSearchSave({...save,country:'OTHER'})).toBe(false);
    expect(validWordSearchSave({...save,country:undefined})).toBe(true);
  });
});
