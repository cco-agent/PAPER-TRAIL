#!/usr/bin/env node
const fs = require('fs');
const els = {};
function mkEl(id){ const el={ id, _inner:'', _text:'', _cls:'', get innerHTML(){return this._inner;}, set innerHTML(v){this._inner=String(v);}, get textContent(){return this._text;}, set textContent(v){this._text=String(v);}, get className(){return this._cls;}, set className(v){this._cls=String(v);}, disabled:false, style:{}, onclick:null, appendChild(){}, prepend(c){ this._inner = c.innerHTML + this._inner; }, value:'' }; el._cl={ add(c){ el._cls = el._cls.split(/\s+/).filter(x=>x&&x!==c).concat(c).join(' '); }, remove(c){ el._cls = el._cls.split(/\s+/).filter(x=>x&&x!==c).join(' '); }, contains(c){ return el._cls.split(/\s+/).includes(c); } }; el.classList = el._cl; return el; }
global.document = { getElementById: id => (els[id] = els[id] || mkEl(id)), createElement: () => mkEl('_dyn_'+Math.random()) };
global.window = global;
global.__PT_TEST__ = true; // D6: autoDemo runs synchronously in test env (no setTimeout pacing)
const html = fs.readFileSync(__dirname + '/index.html','utf8');
const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
eval(code);
const out = [];
const t = (name, cond) => out.push((cond ? 'PASS' : 'FAIL') + ' ' + name);
// 1) initial state
els.btnDeal.onclick();
t('deal enables reveal btn', els.btnReveal.disabled === false);
t('deal disables deal btn', els.btnDeal.disabled === true);
t('player hand rendered (POWER)', els.cA0.innerHTML.includes('POWER') && els.cA1.innerHTML.includes('POWER') && els.cA2.innerHTML.includes('POWER'));
t('house hand face-down FHE hidden', ['cB0','cB1','cB2'].every(i => els[i].className.includes('face-down')));
const dealtHands = els.cA0.innerHTML + els.cA1.innerHTML + els.cA2.innerHTML;
// 2) reveal showdown (draw-aware: equal-power lanes award nobody, so sum = 3 minus draws)
const cntPush = str => (str.match(/push, the needle holds/g) || []).length;
const drawsBefore = cntPush(els.log.innerHTML);
els.btnReveal.onclick();
t('reveal re-enables deal btn', els.btnDeal.disabled === false);
t('house cards now shown', ['cB0','cB1','cB2'].every(i => els[i].innerHTML.includes('POWER')));
const s = parseInt(els.scoreA.textContent) + parseInt(els.scoreB.textContent);
const draws = cntPush(els.log.innerHTML) - drawsBefore;
t('scores sum to 3 lanes minus draws', s === 3 - draws);
t('gauge moved (fillA width set)', els.fillA.style.width !== '' || els.fillB.style.width !== '');
t('round resolved logged', els.log.innerHTML.includes('ROUND RESOLVED'));
// 3) shredder
const fed0 = parseInt(els.fed.textContent);
els.btnFeed.onclick();
t('shredder increments fed counter', parseInt(els.fed.textContent) === fed0 + 1);
t('shredder line logged', els.log.innerHTML.includes('SHREDDER'));
// 4) mode switch + live bind validation
els.ctAddr = els.ctAddr || mkEl('ctAddr');
els.modeLive.onclick();
t('live panel shows', els.livePanel.className.includes('show'));
els.ctAddr.value = 'nothex'; els.connectBtn.onclick();
t('bad address rejected', els.log.innerHTML.includes('typo'));
els.ctAddr.value = '0x' + 'ab'.repeat(20); els.connectBtn.onclick();
t('valid address binds', els.log.innerHTML.includes('LIVE bind'));
// 5) new match resets
els.btnNew.onclick();
t('new match resets scoreA', els.scoreA.textContent === '0');
t('new match disables reveal', els.btnReveal.disabled === true);
// 6) D4 shredder fuel economy: 3 feeds stuff the shredder, arming +1 POWER
const pt = global.__pt;
t('debug handle exposes state', !!pt && !!pt.state && pt.MAX_FUEL === 3 && pt.VOL_SWING === 85);
t('new match resets fuel to 0/3', els.fuel.textContent === '0/3');
els.btnFeed.onclick();
t('first feed charges fuel 1/3', els.fuel.textContent === '1/3');
els.btnFeed.onclick(); els.btnFeed.onclick();
t('third feed stuffs shredder', els.log.innerHTML.includes('SHREDDER STUFFED') && els.boostBadge.textContent.includes('BOOST'));
t('fuel resets after stuffing', els.fuel.textContent === '0/3');
// 7) D4 boost consumed on reveal: 3 clean wins, effective +1 shown, gauge +30 (no swing)
pt.state.handA = [{n:'Alpha',p:5,v:50,t:'x'},{n:'Beta',p:5,v:50,t:'x'},{n:'Gamma',p:5,v:50,t:'x'}];
pt.state.handB = [{n:'One',p:1,v:10,t:'x'},{n:'Two',p:1,v:10,t:'x'},{n:'Three',p:1,v:10,t:'x'}];
pt.state.dealt = true; pt.state.revealed = false; pt.state.resolved = false; pt.state.gauge = 0; pt.state.scoreA = 0; pt.state.scoreB = 0;
els.btnReveal.onclick();
t('boost adds +1 effective power (log)', els.log.innerHTML.includes('+1'));
t('boost consumed after reveal', els.boostBadge.textContent === '');
t('gauge +30 on 3 clean wins', pt.state.gauge === 30);
// 8) D4 volatility swing: v>=85 winner doubles gauge push (20+10+10 = 40)
els.btnNew.onclick();
pt.state.handA = [{n:'Offshore Motive',p:9,v:92,t:'scandal'},{n:'Beta',p:5,v:50,t:'x'},{n:'Gamma',p:5,v:50,t:'x'}];
pt.state.handB = [{n:'One',p:1,v:10,t:'x'},{n:'Two',p:1,v:10,t:'x'},{n:'Three',p:1,v:10,t:'x'}];
pt.state.dealt = true; pt.state.revealed = false; pt.state.resolved = false; pt.state.gauge = 0; pt.state.scoreA = 0; pt.state.scoreB = 0;
els.btnReveal.onclick();
t('volatility swing logged', els.log.innerHTML.includes('VOLATILITY SWING'));
t('swing doubles gauge push (+40)', pt.state.gauge === 40);
// 9) D5 procedural SFX: module present, sounds registered, safe no-op without audio
const sfx = pt.sfx;
t('D5 sfx module exposed', !!sfx && Array.isArray(sfx.names) && sfx.names.length >= 5 && sfx.names.indexOf('shredder') >= 0 && sfx.names.indexOf('swing') >= 0);
t('D5 sfx play() no-ops without audio (no throw)', (() => { try { sfx.play('shredder'); sfx.play('swing'); sfx.play('win'); sfx.play('lose'); sfx.play('deal'); sfx.play('reveal'); return true; } catch (e) { return false; } })());
t('D5 sfx muted flag flips', (() => { sfx.muted = true; const m = sfx.muted; sfx.muted = false; return m === true; })());
t('D5 sfx play() muted is silent no-op', (() => { sfx.muted = true; try { sfx.play('swing'); return true; } catch (e) { return false; } finally { sfx.muted = false; } })());
// 10) D6 auto-demo: one click plays a full round (deal -> 3x feed -> reveal) synchronously in test env
els.btnNew.onclick();
els.btnAuto.onclick();
t('D6 auto demo deals + reveals a round', pt.state.dealt === true && pt.state.revealed === true);
t('D6 auto demo fed the shredder 3x', els.fed.textContent === '3');
t('D6 auto demo consumed boost at reveal', els.boostBadge.textContent === '');
t('D6 auto demo ends resolved (deal re-enabled)', els.btnReveal.disabled === true && els.btnDeal.disabled === false);
t('D6 auto demo logs completion', els.log.innerHTML.includes('AUTO DEMO'));
t('D6 auto demo state.auto cleared', pt.state.auto === false);
// 11) D6 match-result banner
els.btnReveal.onclick();
t('D6 banner shows winner after resolve', els.banner.className.includes('show') && els.banner.textContent.length > 0);
els.btnNew.onclick();
t('D6 banner hides on new match', els.banner.className === 'banner');
els.btnDeal.onclick();
t('D6 banner hides on deal', els.banner.className === 'banner');

console.log(out.join('\n'));
const fails = out.filter(l => l.startsWith('FAIL')).length;
console.log('TOTAL: ' + out.length + ' checks, ' + fails + ' FAIL');
process.exit(fails ? 1 : 0);
