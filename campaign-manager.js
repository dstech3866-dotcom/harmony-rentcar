// V2.5.14 - 이미지 전용 Storage 버킷에서도 저장 가능한 PNG 기반 프로모션 기록. 기존 자료 유지.
const SUPABASE_BASE_URL='https://gaygechqnvehajmsnvfb.supabase.co';
const KEY='sb_publishable_OFGuCgOffh-ofXnDu80eAA_9Z1wQclO';
const BUCKET='gallery', PREFIX='harmony-campaign-', RECORD_PREFIX='harmony-campaign-record-';
const $=id=>document.getElementById(id);
const dirs={used:'/cars/',new:'/newcars/',newlease:'/newlease/',usedlease:'/usedlease/',used612:'/used612/'};
let client=null,records=[],editingId=null;
async function getClient(){if(client)return client;const mod=await import('https://esm.sh/@supabase/supabase-js@2');client=window.__harmonySharedClient?window.__harmonySharedClient(mod,SUPABASE_BASE_URL,KEY):mod.createClient(SUPABASE_BASE_URL,KEY);return client}
async function authorized(){const c=await getClient();const {data,error}=await c.auth.getSession();if(error)throw error;if(!data.session)throw Error('관리자 로그인이 필요합니다.');return c}
function todayKST(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function active(p){const t=todayKST();return p.enabled!==false&&!p.deleted&&(!p.start||t>=p.start)&&(!p.end||t<=p.end)}
function imageUrl(path){return SUPABASE_BASE_URL+'/storage/v1/object/public/'+BUCKET+'/'+path.split('/').map(encodeURIComponent).join('/')}
function linkFor(p){const base=dirs[p.kind]||dirs.used;const q=new URLSearchParams();if(p.model)q.set('promo',p.model);if(p.year)q.set('year',p.year);return base+(q.toString()?'?'+q.toString():'')}
function status(msg){if($('campaignStatus'))$('campaignStatus').textContent=msg}
function stamp(){return new Date().toISOString().replace(/[-:.TZ]/g,'')+'-'+crypto.randomUUID().slice(0,8)}
async function listObjects(){
 // Use the Supabase SDK so it sends a valid visitor or signed-in access token.
 // A publishable API key is not itself a JWT and must not be used as a Bearer token.
 const c=await getClient();let all=[];
 for(let offset=0;offset<10000;offset+=1000){
  const {data,error}=await c.storage.from(BUCKET).list('',{limit:1000,offset,sortBy:{column:'name',order:'desc'}});
  if(error)throw Error('프로모션 목록 접근 거부: '+error.message+' (gallery SELECT/LIST 권한 확인)');
  const page=data||[];
  all.push(...page.filter(x=>x.name?.startsWith(PREFIX)&&(x.name.endsWith('.json')||(x.name.startsWith(RECORD_PREFIX)&&x.name.endsWith('.png')))));
  if(page.length<1000)break;
 }
 return all;
}
// 기록은 PNG 픽셀에 UTF-8 JSON을 보관합니다. gallery 버킷이 JSON MIME을 금지해도 동작합니다.
async function encodeRecord(record){
 const bytes=new TextEncoder().encode(JSON.stringify(record));if(bytes.length>500000)throw Error('프로모션 내용이 너무 깁니다.');
 const width=256,height=Math.ceil((bytes.length+4)/(width*4));const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});const data=ctx.createImageData(width,height);const n=bytes.length;
 data.data[0]=(n>>>24)&255;data.data[1]=(n>>>16)&255;data.data[2]=(n>>>8)&255;data.data[3]=255;
 // RGBA alpha must be opaque to prevent browser premultiplication from destroying bytes.
 // Encode 3 bytes per pixel instead, with a 4-byte length header in RGB channels.
 const payload=new Uint8Array(4+n);new DataView(payload.buffer).setUint32(0,n,false);payload.set(bytes,4);
 const h=Math.ceil(payload.length/(width*3));canvas.height=h;const d=ctx.createImageData(width,h);
 for(let i=0;i<payload.length;i++){const pixel=Math.floor(i/3);d.data[pixel*4+i%3]=payload[i]}
 for(let i=0;i<width*h;i++)d.data[i*4+3]=255;
 ctx.putImageData(d,0,0);
 return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PNG 생성 실패')),'image/png'));
}
async function decodeRecord(blob){const bitmap=await createImageBitmap(blob);try{const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(bitmap,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
 const read=(i)=>pixels[Math.floor(i/3)*4+i%3];const len=(read(0)*16777216+read(1)*65536+read(2)*256+read(3))>>>0;if(!len||len>500000||len+4>canvas.width*canvas.height*3)throw Error('기록 형식 오류');const arr=new Uint8Array(len);for(let i=0;i<len;i++)arr[i]=read(i+4);return JSON.parse(new TextDecoder().decode(arr))}finally{bitmap.close()}}
async function fetchRecords(){
 const objects=await listObjects();const c=await getClient();
 const responses=await Promise.all(objects.map(async x=>{
  try{
   const {data,error}=await c.storage.from(BUCKET).download(x.name);
   if(error)throw error;
   return x.name.endsWith('.png')?await decodeRecord(data):JSON.parse(await data.text());
  }catch(e){return {__readError:x.name+': '+e.message}}
 }));
 const failures=responses.filter(x=>x?.__readError);
 if(failures.length)throw Error('프로모션 파일 '+failures.length+'건 읽기 실패. '+failures[0].__readError);
 const map=new Map();
 for(const p of responses.filter(x=>x&&x.type==='campaign'&&x.id).sort((a,b)=>String(a.updatedAt||'').localeCompare(String(b.updatedAt||''))))map.set(p.id,p);
 return [...map.values()].filter(x=>!x.deleted).sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
}
const KIND_NAMES={used:'중고렌트',new:'신차렌트',newlease:'신차리스',usedlease:'중고리스',used612:'6·12개월'};
function parseButtons(text){const kindMap={'중고렌트':'used','신차렌트':'new','신차리스':'newlease','중고리스':'usedlease','6·12개월':'used612','6·12개월렌트':'used612'};return text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map((line,i)=>{const parts=line.split('|').map(x=>x.trim());if(parts.length<3||!parts[0]||!parts[2])throw Error((i+1)+'번째 버튼: 버튼명 | 상품 | 차종 순서로 입력하세요.');const kind=kindMap[parts[1]]|| (dirs[parts[1]]?parts[1]:null);if(!kind)throw Error((i+1)+'번째 버튼: 상품을 신차렌트/중고렌트/신차리스/중고리스/6·12개월 중에서 선택하세요.');return {label:parts[0],kind,model:parts[2],year:parts[3]||'',note:parts.slice(4).join(' | ')}})}
function buttonsText(p){return (p.buttons||[]).map(b=>[b.label,KIND_NAMES[b.kind]||b.kind,b.model,b.year||'',b.note||''].join(' | ')).join('\n')}
function button(text,action,secondary=true){const b=document.createElement('button');b.type='button';b.className='btn'+(secondary?' secondary':'');b.textContent=text;b.onclick=action;return b}
// The original Black Friday banner is the canonical view: it already includes all six
// vehicle links and is controlled by the dedicated Black Friday admin buttons.
// Do not render a second, legacy record-only card (which may have zero buttons).
function isBlackFridayCampaign(p){return /블랙프라이데이|black\s*friday/i.test(p.title||'')}
function render(items){const area=$('campaignDisplay');if(!area)return;area.replaceChildren();for(const p of items.filter(p=>active(p)&&!isBlackFridayCampaign(p))){
 const card=document.createElement('article');card.className='campaign-card';
 if(p.imagePath){const img=document.createElement('img');img.alt=p.title||'프로모션 이미지';img.loading='lazy';
  // Storage objects may have been removed or renamed. Keep the published Black Friday campaign visible.
  const isBlackFriday=/블랙프라이데이|black\s*friday/i.test(p.title||'');
  const fallback='/black-friday-promo.png';
  if(isBlackFriday){img.onerror=()=>{if(!img.src.endsWith(fallback)){img.onerror=null;img.src=fallback;}};}
  img.src=imageUrl(p.imagePath);if(!p.buttons?.length){const a=document.createElement('a');a.href=linkFor(p);a.append(img);card.append(a)}else{card.append(img)}}
 const info=document.createElement('div');info.className='campaign-info';const h=document.createElement('h3');h.textContent=p.title||'프로모션';info.append(h);if(p.description){const desc=document.createElement('p');desc.textContent=p.description;info.append(desc)}
 if(p.buttons?.length){const grid=document.createElement('div');grid.className='campaign-car-links';for(const b of p.buttons){const box=document.createElement('div');box.className='campaign-car-box';const heading=document.createElement('strong');heading.textContent=(b.model||b.label.replace(' 보기',''))+(b.year?' '+b.year+'년형':'');box.append(heading);if(b.note){const note=document.createElement('p');note.className='campaign-car-note';note.textContent=b.note;box.append(note)}const a=document.createElement('a');a.href=linkFor(b);a.textContent=b.label+' →';box.append(a);grid.append(box)}info.append(grid)}else{const a=document.createElement('a');a.className='btn';a.href=linkFor(p);a.textContent=(p.model||'해당')+' 가격표 보기 →';info.append(a)}card.append(info);area.append(card)
 }area.hidden=!area.children.length;
 const list=$('campaignAdminList');if(!list)return;list.replaceChildren();if(!items.length){const empty=document.createElement('p');empty.textContent='통합 관리자에 등록된 프로모션이 없습니다. 아래 입력란에서 새로 등록하세요.';list.append(empty)}
 for(const p of items){const item=document.createElement('div');item.className='campaign-admin-item';const title=document.createElement('strong');title.textContent=p.title;item.append(title);const state=document.createElement('span');state.textContent=(p.enabled===false?'숨김':active(p)?'게시 중':'게시기간 외')+' · '+(p.start||'시작일 없음')+' ~ '+(p.end||'종료일 없음')+' · 차량 버튼 '+(p.buttons?.length||0)+'개'+(isBlackFridayCampaign(p)?' · 홈페이지 블랙프라이데이 전용 관리 버튼 사용':'');item.append(state);if(!isBlackFridayCampaign(p)){item.append(button('수정',()=>edit(p)));item.append(button(p.enabled===false?'다시 표시':'숨기기',()=>toggle(p,p.enabled===false)));item.append(button('삭제',()=>remove(p)))}else{const help=document.createElement('span');help.textContent='블랙프라이데이 표시·숨기기는 위의 전용 관리 메뉴에서 변경하세요.';item.append(help)}list.append(item)}
}
async function reload(){
 try{records=await fetchRecords();render(records);status('등록된 통합 프로모션 '+records.length+'건 · 변경 사항은 고객 홈페이지에도 반영됩니다.');return true}
 catch(e){status('목록 조회 실패: '+e.message);return false}
}
async function write(p){
 const c=await authorized();const name=RECORD_PREFIX+stamp()+'.png';const blob=await encodeRecord(p);
 const {error}=await c.storage.from(BUCKET).upload(name,blob,{contentType:'image/png',upsert:false});
 if(error)throw Error('프로모션 저장 실패: '+error.message+' (gallery INSERT 권한 또는 용량 확인)');
 // Verify the newly created file by its exact path, independent of LIST permission.
 const {data:check,error:readError}=await c.storage.from(BUCKET).download(name);
 if(readError)throw Error('파일 저장은 완료됐지만 저장 파일을 읽을 수 없습니다: '+readError.message+' · 파일명: '+name);
 let saved;try{saved=await decodeRecord(check)}catch(e){throw Error('파일 저장은 완료됐지만 기록 검증에 실패했습니다: '+e.message)}
 if(saved.id!==p.id||saved.updatedAt!==p.updatedAt)throw Error('저장된 프로모션 내용이 일치하지 않습니다. 파일명: '+name);
 const visible=await reload();
 if(!visible)throw Error('저장은 완료됐지만 프로모션 목록 조회가 차단됐습니다. gallery의 SELECT/LIST 정책을 확인하세요. 저장 파일: '+name);
 if(!p.deleted&&!records.some(x=>x.id===p.id&&x.updatedAt===p.updatedAt))throw Error('저장은 완료됐지만 목록에서 찾을 수 없습니다. gallery의 SELECT/LIST 정책 또는 목록 갱신을 확인하세요. 저장 파일: '+name);
 return name;
}
async function toggle(p,enabled){try{status('상태 변경 중…');await write({...p,enabled,updatedAt:new Date().toISOString()});status('프로모션 '+(enabled?'표시':'숨김')+' 저장 완료.')}catch(e){status('상태 변경 실패: '+e.message)}}
async function remove(p){if(!confirm('이 프로모션을 목록에서 삭제할까요? 기존 차량 가격표에는 영향이 없습니다.'))return;try{status('삭제 중…');await write({...p,deleted:true,enabled:false,updatedAt:new Date().toISOString()});status('프로모션 삭제 완료.')}catch(e){status('삭제 실패: '+e.message)}}
function edit(p){editingId=p.id;$('campaignTitle').value=p.title||'';$('campaignDescription').value=p.description||'';$('campaignKind').value=p.kind||'used';$('campaignModel').value=p.model||'';$('campaignYear').value=p.year||'';$('campaignButtons').value=buttonsText(p);$('campaignStart').value=p.start||'';$('campaignEnd').value=p.end||'';$('campaignImage').value='';$('campaignSave').textContent='프로모션 수정 저장';status('수정 중: '+p.title+' · 이미지를 변경하지 않으면 기존 이미지가 유지됩니다.');$('campaignTitle').scrollIntoView({behavior:'smooth',block:'center'})}
function reset(){editingId=null;for(const id of ['campaignTitle','campaignDescription','campaignModel','campaignYear','campaignStart','campaignEnd','campaignImage','campaignButtons'])$(id).value='';$('campaignKind').value='used';$('campaignSave').textContent='새 프로모션 등록'}
const QUICK_MODELS=['아반떼','쏘나타','그랜저','팰리세이드','GV70','GV80'];
function autoButtons(filename){
 const lower=filename.toLowerCase();
 if(/블랙|black|friday|프라이데이/.test(lower))return QUICK_MODELS.map(model=>({label:model+' 차량 보기',kind:'used',model,year:'',note:''}));
 const models=['아반떼','쏘나타','그랜저','팰리세이드','GV70','GV80','레이','모닝','K3','K5','K8','K9','셀토스','스포티지','쏘렌토','카니발','투싼','싼타페','코나','스타리아','포터'];
 const found=models.filter(model=>lower.includes(model.toLowerCase()));
 if(found.length)return found.map(model=>({label:model+' 차량 보기',kind:'used',model,year:'',note:''}));
 return [{label:'중고렌트 가격표 보기',kind:'used',model:'',year:'',note:''},{label:'신차렌트 가격표 보기',kind:'new',model:'',year:'',note:''}];
}
function quickTitle(name){const base=name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').trim();return /블랙|black|friday|프라이데이/i.test(base)?'블랙프라이데이 중고렌트 특별 프로모션':(base||'새 특별 프로모션')}
const quickFile=$('campaignQuickImage'),quickSave=$('campaignQuickSave'),quickStatus=$('campaignQuickStatus');
if(quickSave)quickSave.onclick=async()=>{
 const file=quickFile?.files?.[0];if(!file){quickStatus.textContent='먼저 홍보 이미지를 선택하세요.';return}
 quickSave.disabled=true;
 try{
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024)throw Error('5MB 이하 JPG·PNG·WebP 이미지를 선택하세요.');
  const c=await authorized();quickStatus.textContent='이미지 업로드 중…';
  const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
  const path=PREFIX+stamp()+'.'+ext;
  const uploadFile=await window.harmonyColorize(file);const {error}=await c.storage.from(BUCKET).upload(path,uploadFile,{contentType:uploadFile.type,upsert:false});
  if(error)throw Error('이미지 업로드 실패: '+error.message);
  quickStatus.textContent='아반떼형 홍보 화면과 차량 버튼 자동 생성 중…';
  const title=quickTitle(file.name),buttons=autoButtons(file.name);
  await write({type:'campaign',id:stamp(),title,description:'※ 실제 차량 재고 및 행사 적용 여부는 상담 시 확인해 주세요.',kind:'used',model:'',year:'',start:'',end:'',buttons,enabled:true,imagePath:path,updatedAt:new Date().toISOString()});
  quickFile.value='';quickStatus.textContent='등록 완료! 홈페이지 맨 위에 '+buttons.length+'개 클릭 버튼과 함께 게시했습니다. 새로고침해서 확인하세요.';
 }catch(e){quickStatus.textContent='등록 실패: '+e.message}finally{quickSave.disabled=false}
};
$('campaignSave').onclick=async()=>{const btn=$('campaignSave');btn.disabled=true;try{const file=$('campaignImage').files[0],title=$('campaignTitle').value.trim(),model=$('campaignModel').value.trim(),kind=$('campaignKind').value,year=$('campaignYear').value.trim(),start=$('campaignStart').value,end=$('campaignEnd').value;const old=records.find(x=>x.id===editingId);
 if(!title)throw Error('프로모션 제목을 입력하세요.');if(!file&&!old)throw Error('홍보 이미지를 선택하세요.');if(file&&(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024))throw Error('5MB 이하 JPG·PNG·WebP 이미지만 가능합니다.');if(start&&end&&start>end)throw Error('종료일이 시작일보다 빠릅니다.');
 const buttons=parseButtons($('campaignButtons').value);const c=await authorized();let imagePath=old?.imagePath||'';if(file){status('이미지 업로드 중…');const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';imagePath=PREFIX+stamp()+'.'+ext;const uploadFile=await window.harmonyColorize(file);const {error}=await c.storage.from(BUCKET).upload(imagePath,uploadFile,{contentType:uploadFile.type,upsert:false});if(error)throw Error('이미지 업로드 실패: '+error.message)}
 status('프로모션 정보 저장 중…');await write({type:'campaign',id:old?.id||stamp(),title,description:$('campaignDescription').value.trim(),kind,model,year,start,end,buttons,enabled:old?old.enabled!==false:true,imagePath,updatedAt:new Date().toISOString()});reset();status('프로모션 저장 완료. 고객 홈페이지를 새로고침해 확인하세요.');
 }catch(e){status('등록/수정 실패: '+e.message)}finally{btn.disabled=false}};
$('campaignCancelEdit')?.addEventListener('click',()=>{reset();status('수정을 취소했습니다.')});
async function syncAuth(){const panel=$('campaignManager');if(!panel)return;try{const c=await getClient();const {data}=await c.auth.getSession();const ok=!!data?.session;panel.style.display=ok?'block':'none';if(ok)await reload()}catch(e){panel.style.display='none'}}
getClient().then(c=>{c.auth.onAuthStateChange(()=>setTimeout(syncAuth,0));syncAuth()}).catch(e=>status('관리 기능 초기화 실패: '+e.message));reload();
