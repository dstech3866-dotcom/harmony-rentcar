/* Harmony Rentcar: customer-facing configurable banners and deposit notice. */
(()=>{'use strict';
const URL='https://gaygechqnvehajmsnvfb.supabase.co/storage/v1/object/public/gallery/inventory/site-content.json';
const fields=['intro','due','example','payment','fee','alert','percent','penalty','final'];
function setText(sel,value){if(typeof value!=='string')return;const el=document.querySelector(sel);if(el)el.textContent=value}
function applyBanner(link,data){if(!link||!data||typeof data!=='object')return;
if(data.visible===false){link.style.setProperty('display','none','important');return}
if(typeof data.title==='string'){let text=link.querySelector('[data-h-banner-label]');if(!text){text=document.createElement('span');text.dataset.hBannerLabel='1';link.replaceChildren(text)}text.textContent=data.title}
const safeColor=x=>/^#[0-9a-fA-F]{6}$/.test(x||'')?x:null;
if(safeColor(data.background)){link.style.setProperty('background',data.background,'important');link.style.setProperty('background-image','none','important')}
if(safeColor(data.color))link.style.setProperty('color',data.color,'important');
if(safeColor(data.borderColor))link.style.setProperty('border-color',data.borderColor,'important');
if(Number.isFinite(+data.fontSize))link.style.setProperty('font-size',Math.max(12,Math.min(34,+data.fontSize))+'px','important');
if(Number.isFinite(+data.height))link.style.setProperty('min-height',Math.max(32,Math.min(180,+data.height))+'px','important');
if(Number.isFinite(+data.radius))link.style.setProperty('border-radius',Math.max(0,Math.min(35,+data.radius))+'px','important');
}
function apply(config){
if(!config||typeof config!=='object')return;
const links=[...document.querySelectorAll('a[href*="age23/"],a[href*="deposit-installment/"]')].filter(a=>!a.closest('#admin'));
applyBanner(links.find(a=>a.getAttribute('href').includes('age23/')),config.age23);
applyBanner(links.find(a=>a.getAttribute('href').includes('deposit-installment/')),config.deposit);
const w=document.querySelector('.deposit-warning');if(w&&config.notice){const n=config.notice;
const map={intro:'.deposit-warning-intro strong',due:'.deposit-warning-payment>p:first-child strong',payment:'.deposit-warning-payment>p:not(:first-child) strong',fee:'.deposit-warning-fee',alert:'.deposit-warning-alert',percent:'.deposit-warning-percent',penalty:'.deposit-warning-danger span',final:'.deposit-warning-final'};
for(const k of Object.keys(map))setText(map[k],n[k]);
if(typeof n.example==='string'){const el=w.querySelector('.deposit-warning-example');if(el)el.textContent=n.example}
if(n.visible===false)w.style.display='none';
}
}
fetch(URL+'?v='+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():null).then(apply).catch(()=>{});
})();