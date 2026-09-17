const fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,f);
const {test}=require('node:test'),assert=require('node:assert/strict');
const {labs,atoms,molecules,concentration,litmus,separationResult}=require('../lib/education/chemistry.ts');
test('mass concentration uses the solution mass, including dilution and zero solute',()=>{
 assert.equal(concentration(10,90),10);assert.ok(Math.abs(concentration(10,100)-9.090909)<.00001);assert.equal(concentration(0,100),0);assert.ok(concentration(10,200)<concentration(10,100));
});
test('both litmus strips correctly identify acids, bases and neutral samples',()=>{
 assert.deepEqual([0,1].map(s=>litmus(0,s)),['red','red']);assert.deepEqual([0,1].map(s=>litmus(1,s)),['blue','blue']);assert.deepEqual([0,1].map(s=>litmus(2,s)),['blue','red']);
});
test('separation does not falsely filter dissolved salt or magnetise sand',()=>{
 assert.equal(separationResult(1,0).works,false);assert.equal(separationResult(1,0).collected,'Salt water');assert.equal(separationResult(0,0).residue,'Sand');assert.equal(separationResult(1,1).residue,'Salt');assert.equal(separationResult(2,2).collected,'Iron filings');assert.equal(separationResult(0,2).works,false);
});
test('selected neutral atom shells match atomic numbers and capacities',()=>{
 for(const a of atoms){assert.equal(a.shells.reduce((s,n)=>s+n,0),a.protons);assert.ok(a.shells[0]<=2);assert.ok(a.shells.slice(1).every(n=>n<=8));assert.ok(a.neutrons>=0)}
});
test('molecular formula models and classroom masses agree',()=>{
 const masses={H:1,C:12,O:16};assert.deepEqual(molecules.map(m=>m.mass),[18,32,44]);for(const m of molecules)assert.equal(m.atoms.reduce((sum,a)=>sum+masses[a.el],0),m.mass);
});
test('every supported grade has labs and every quiz has one valid answer',()=>{
 assert.equal(new Set(labs.map(l=>l.id)).size,labs.length);for(const grade of [6,7,8,9])assert.ok(labs.some(l=>l.grades.includes(grade)));for(const l of labs){assert.ok(l.quiz.answer>=0&&l.quiz.answer<l.quiz.options.length);assert.ok(l.quiz.explanation.length>20);assert.ok(l.limitation.length>20)}
});
