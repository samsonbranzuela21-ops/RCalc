import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateColumnTies as calculate, rectilinearBars, DEFAULT_RECTILINEAR_INPUT as rect, DEFAULT_CIRCULAR_INPUT as circle, DEFAULT_SPIRAL_INPUT as spiral} from '../lib/column-ties-check.ts';
const status = (result,id) => result.checks.find(check=>check.id===id)?.status;
const close = (actual,expected) => assert.ok(Math.abs(actual-expected)<1e-9, `${actual} != ${expected}`);
test('rectilinear example: dimensions control spacing and corner supports suffice',()=>{
  const result=calculate({...rect,closedTie:true});
  assert.equal(result.adequate,true); assert.equal(result.grossArea,122500);
  assert.deepEqual(result.spacingLimits.map(x=>x.value),[400,480,350]);
  assert.equal(result.maximumSpacing,350); assert.equal(result.clearSpacing,190);
  close(result.minimumClear,80/3); assert.equal(result.barCount,8);
  for(const bar of result.supportChecks.filter(x=>!x.supported)) {close(bar.clearPrevious,87.5);close(bar.clearNext,87.5);}
});
test('unconfirmed drawing details cannot pass',()=>{
  for(const input of [rect,circle,spiral]) {const result=calculate(input);assert.equal(result.adequate,false);assert.equal(result.incomplete,true);}
});
test('tie size thresholds follow supplied ranges without interpolation',()=>{
  assert.equal(calculate({...rect,longitudinalDiameter:32}).minimumDiameter,10);
  assert.equal(status(calculate({...rect,longitudinalDiameter:36}),'diameter'),'FAIL');
  assert.equal(status(calculate({...rect,longitudinalDiameter:36,transverseDiameter:12}),'diameter'),'PASS');
  assert.throws(()=>calculate({...rect,longitudinalDiameter:34}),/not defined/);
});
test('each tie spacing control and upper boundary',()=>{
  assert.equal(calculate({...rect,longitudinalDiameter:16}).maximumSpacing,256);
  assert.equal(calculate({...rect,b:500,h:500,transverseDiameter:6}).maximumSpacing,288);
  assert.equal(status(calculate({...rect,spacing:350}),'spacing'),'PASS');
  assert.equal(status(calculate({...rect,spacing:350.01}),'spacing'),'FAIL');
  assert.equal(status(calculate({...rect,spacing:10+80/3}),'clear'),'PASS');
  assert.equal(status(calculate({...rect,spacing:36.66}),'clear'),'FAIL');
});
test('150 mm is clear distance in both directions, inclusive',()=>{
  const boundary=calculate({...rect,b:475,h:475,closedTie:true});
  assert.equal(boundary.adequate,true);
  assert.equal(status(calculate({...rect,b:475.01,h:475}),'distance'),'FAIL');
  assert.match(calculate({...rect,b:475.01,h:475}).checks.find(x=>x.id==='distance').summary,/B2/);
});
test('corner, alternate-bar and angle checks fail independently',()=>{
  assert.equal(status(calculate({...rect,supportedBars:['B3','B5','B7']}),'corners'),'FAIL');
  const input={...rect,barsAcross:4,supportedBars:[]};
  const bars=rectilinearBars(input);
  assert.equal(status(calculate({...input,supportedBars:bars.filter(x=>x.corner).map(x=>x.id)}),'alternate'),'FAIL');
  assert.equal(status(calculate({...input,supportedBars:bars.map(x=>x.id)}),'alternate'),'PASS');
  assert.equal(status(calculate({...rect,includedAngle:135}),'angle'),'PASS');
  assert.equal(status(calculate({...rect,includedAngle:135.1}),'angle'),'FAIL');
  assert.equal(status(calculate({...rect,supportedBars:[]}),'distance'),'FAIL');
});
test('circular ties use lap, hooks and stagger confirmations without rectilinear checks',()=>{
  const input={...circle,lapCompliant:true,standardHooks:true,staggeredLaps:true};
  const result=calculate(input);assert.equal(result.adequate,true);
  close(result.grossArea,Math.PI*450**2/4);assert.equal(status(result,'distance'),undefined);
  for(const [key,id] of [['lapCompliant','lap'],['standardHooks','hooks'],['staggeredLaps','stagger']]) assert.equal(status(calculate({...input,[key]:false}),id),'FAIL');
  assert.equal(status(calculate({...input,diameter:150,cover:10,barCount:40}),'enclosed'),'FAIL');
});
test('spiral ratio uses outside core and spiral steel strength',()=>{
  const result=calculate({...spiral,continuousDeformed:true});
  assert.equal(result.adequate,true); close(result.coreArea,Math.PI*370**2/4);
  close(result.requiredSpiralRatio,.45*((450/370)**2-1)*28/420);
  close(result.providedSpiralRatio,Math.PI*100/(370*50));
  close(result.requiredSpiralArea,result.requiredSpiralRatio*370*50/4);
  assert.equal(result.cover,40);
  close(calculate({...spiral,spiralFy:210}).requiredSpiralRatio,2*result.requiredSpiralRatio);
});
test('spiral clear boundaries and ratio must all pass',()=>{
  assert.equal(status(calculate({...spiral,aggregateSize:18.75,spacing:35}),'clear'),'PASS');
  assert.equal(status(calculate({...spiral,spacing:35}),'clear'),'FAIL');
  const upper=calculate({...spiral,spacing:85});
  assert.equal(status(upper,'clear'),'PASS');assert.equal(status(upper,'ratio'),'FAIL');
  assert.equal(status(calculate({...spiral,spacing:85.01}),'clear'),'FAIL');
  assert.equal(status(calculate({...spiral,aggregateSize:60}),'clear'),'FAIL');
  assert.equal(status(calculate({...spiral,transverseDiameter:9}),'diameter'),'FAIL');
});
test('spiral anchorage and splice checks remain separate',()=>{
  assert.equal(status(calculate({...spiral,topExtraTurns:1.49}),'top-turns'),'FAIL');
  assert.equal(status(calculate({...spiral,bottomExtraTurns:1.49}),'bottom-turns'),'FAIL');
  for(const spliceType of ['mechanical','welded']) {
    assert.equal(status(calculate({...spiral,spliceType}),'splice'),'INCOMPLETE');
    assert.equal(status(calculate({...spiral,spliceType,spliceCompliant:true}),'splice'),'PASS');
    assert.equal(status(calculate({...spiral,spliceType,spliceCompliant:false}),'splice'),'FAIL');
  }
});
test('invalid geometry and numbers are rejected',()=>{
  for(const value of [NaN,Infinity,0,-1]) assert.throws(()=>calculate({...rect,spacing:value}));
  assert.throws(()=>calculate({...rect,spacing:10}),/clear gap/);
  assert.throws(()=>calculate({...rect,b:50}),/overlap/);
  assert.throws(()=>calculate({...rect,barsAcross:2.5}),/whole number/);
  assert.throws(()=>calculate({...rect,supportedBars:['B999']}),/does not match/);
  assert.throws(()=>calculate({...spiral,coreDiameter:450}),/less than/);
});
test('each mode supplies all 15 solution steps and valid check references',()=>{
  for(const input of [rect,circle,spiral]) {
    const result=calculate(input);assert.equal(result.steps.length,15);
    for(const step of result.steps) for(const id of step.checkIds) assert.ok(result.checks.some(check=>check.id===id));
    for(const check of result.checks) assert.match(check.reference,/425\.7\./);
  }
});
