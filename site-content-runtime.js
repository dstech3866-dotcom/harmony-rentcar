/* Harmony site-content runtime: fail-open to original content if storage unavailable. */
(()=>{'use strict';
const ROOT='https://gaygechqnvehajmsnvfb.supabase.co/storage/v1/object/public/gallery/inventory/site-content.json';
const defaults={"age23": {"visible": true, "title": "만 23세 이상 ~ 만 26세 미만 차량 보기 →", "background": "#d7f0ed", "color": "#075c5c", "borderColor": "#d7f0ed", "fontSize": 17, "height": 48, "radius": 12, "url": "age23/index.html"}, "deposit": {"visible": true, "title": "💰 보증금 분납 가능차량 보기 · 2회 분납 →", "background": "#ffbd36", "color": "#522500", "borderColor": "#e18b00", "fontSize": 23, "height": 74, "radius": 13, "url": "deposit-installment/index.html"}, "ageNotice": {"visible": true, "text": "만 23~25세 전용 안내: 아래 월 렌트료에는 해당 연령대 적용 금액 50,000원이 추가 반영되어 있습니다.", "emphasis": "단, 렌트기간중 만26세가 되어도 렌트료 변경은 없습니다", "background": "#eaf5fc", "color": "#174b72", "emphasisColor": "#c81924", "borderColor": "#b7d5eb", "fontSize": 16}, "notice": {"visible": true, "intro": "보증금 분납은 최대 2회까지 가능합니다.", "due": "최초 차량 인도일을 기준으로 다음 달 같은 날짜가 2회차 납부일입니다.", "example": "예) 최초 차량 인도일 11월 10일 → 2회차 납부일 12월 10일", "payment": "2회차 납부일에는 2회차 보증금 및 렌트료 모두 입금되어야 합니다.", "fee": "※ 보증금 분납 시 수수료는 50%씩 두 번 나누어 지급됩니다.", "alert": "⚠ 미납 시 다음 날 계약 해지", "percent": "중도해지위약금 30%", "penalty": "남은 기간(47개월)의 렌트료를 기준으로 청구합니다. 기간에 관계없이 남은 렌트료의 30%가 적용됩니다.", "final": "반드시 확인하시고 계약을 진행해 주세요."}, "shortRent": {"visible": true, "title": "6·12개월 렌트 별도 확인 →", "background": "#e1ebf6", "color": "#194e7d", "borderColor": "#e1ebf6", "fontSize": 17, "height": 48, "radius": 9, "url": "used612/index.html"}, "custom": [], "bannerOrder": ["shortRent", "age23", "deposit"]};
const isObj=x=>x&&typeof x==='object'&&!Array.isArray(x);
const text=(x,limit=600)=>typeof x==='string'?x.slice(0,limit):'';
const color=x=>/^#[0-9a-f]{6}$/i.test(x||'')?x:null;
const num=(x,min,max,def)=>Number.isFinite(Number(x))?Math.max(min,Math.min(max,Number(x))):def;
function safeUrl(x){if(typeof x!=='string'||!x.trim())return null;try{const u=new URL(x,location.origin);if(!['https:','http:'].includes(u.protocol))return null;if(u.origin!==location.origin)return null;return u.href}catch{return null}}
function banner(key,item){const a=document.createElement('a');a.className='harmony-price-short harmony-managed-banner';a.textContent=text(item.title,150);const href=safeUrl(item.url);if(href)a.href=href;else {a.removeAttribute('href');a.setAttribute('aria-disabled','true')}
a.style.cssText='display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;font-weight:900!important;box-sizing:border-box!important;text-decoration:none!important;';
const bg=color(item.background),fg=color(item.color),bd=color(item.borderColor);
if(bg)a.style.setProperty('background',bg,'important');if(fg)a.style.setProperty('color',fg,'important');if(bd)a.style.setProperty('border-color',bd,'important');
a.style.setProperty('font-size',num(item.fontSize,12,38,17)+'px','important');
a.style.setProperty('min-height',num(item.height,30,140,48)+'px','important');
a.style.setProperty('border-radius',num(item.radius,0,30,12)+'px','important');
a.dataset.bannerKey=key;return a}
function main(cfg){const nav=document.querySelector('.harmony-price-links');if(!nav)return;const parent=nav.parentElement;
const existing=[...parent.children].filter(e=>e.matches('a.harmony-price-short'));if(existing.length<3)return;
const order=Array.isArray(cfg.bannerOrder)?cfg.bannerOrder:defaults.bannerOrder;
const custom=Array.isArray(cfg.custom)?cfg.custom.slice(0,40):[];
const map=new Map(defaults.bannerOrder.map(key=>[key,cfg[key]||defaults[key]]));
const legacyKeys=new Map();
for(const [index,item] of custom.entries()){
 if(!isObj(item))continue;
 const legacy='custom:'+index;
 const key=typeof item.id==='string'&&/^custom-[\w-]+$/.test(item.id)&&!map.has(item.id)?item.id:legacy;
 legacyKeys.set(legacy,key);
 map.set(key,item);
}
const keys=new Set([...order.map(key=>legacyKeys.get(key)||key),...map.keys()]);
const items=[];
for(const key of keys){
 const item=map.get(key);
 if(isObj(item)&&item.visible!==false)items.push(banner(key,item));
}
const anchor=existing[0];for(const a of items)parent.insertBefore(a,anchor);existing.forEach(e=>e.remove());
}
function age(cfg){const n=cfg.ageNotice;if(!isObj(n))return;const candidates=[...document.querySelectorAll('body *')].filter(e=>e.children.length===0&&e.textContent.includes('만 23~25세 전용 안내:'));const el=candidates[0];if(!el)return;const block=el.parentElement;
if(n.visible===false){block.hidden=true;return}
el.textContent=text(n.text,800)+' '+text(n.emphasis,500);
const bg=color(n.background),fg=color(n.color);if(bg)block.style.background=bg;if(fg)block.style.color=fg;
}
function deposit(cfg){const n=cfg.notice;if(!isObj(n))return;const wrap=document.querySelector('.deposit-warning');if(!wrap)return;if(n.visible===false){wrap.hidden=true;return}
const selectors={intro:'.deposit-warning-intro strong',due:'.deposit-warning-payment p:first-child strong',example:'.deposit-warning-example',payment:'.deposit-warning-payment p:nth-of-type(2) strong',fee:'.deposit-warning-fee',alert:'.deposit-warning-alert',percent:'.deposit-warning-percent',penalty:'.deposit-warning-danger span',final:'.deposit-warning-final'};
for(const [k,selector] of Object.entries(selectors)){const el=wrap.querySelector(selector);if(el&&typeof n[k]==='string')el.textContent=text(n[k],900)}
}
async function start(){try{const res=await fetch(ROOT+'?v='+Date.now(),{cache:'no-store'});if(!res.ok)return;const cfg=await res.json();if(!isObj(cfg)||!Array.isArray(cfg.bannerOrder)||!isObj(cfg.age23)||!isObj(cfg.deposit)||!isObj(cfg.shortRent)||!Array.isArray(cfg.custom))return;
const path=location.pathname;if(/\/age23\/(?:index\.html)?$/.test(path))age(cfg);else if(/\/deposit-installment\/(?:index\.html)?$/.test(path))deposit(cfg);else if(/\/(?:index\.html)?$/.test(path))main(cfg);
}catch(e){console.warn('Harmony banner settings unavailable; keeping original content',e)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();