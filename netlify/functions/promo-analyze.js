exports.handler=async(event)=>{
if(event.httpMethod!=='POST')return {statusCode:405,body:'Method not allowed'};
const json=(code,data)=>({statusCode:code,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'},body:JSON.stringify(data)});
try{
const token=(event.headers.authorization||event.headers.Authorization||'').replace(/^Bearer\s+/i,'');if(!token)return json(401,{error:'관리자 로그인이 필요합니다.'});
const user=await fetch('https://gaygechqnvehajmsnvfb.supabase.co/auth/v1/user',{headers:{apikey:'sb_publishable_OFGuCgOffh-ofXnDu80eAA_9Z1wQclO',Authorization:'Bearer '+token}});
if(!user.ok)return json(401,{error:'로그인 인증이 만료되었습니다.'});
const profile=await user.json();if(profile.email!=='dstech3866@gmail.com')return json(403,{error:'관리자만 분석할 수 있습니다.'});
const {text='',image=''}=JSON.parse(event.body||'{}');
if(typeof text!=='string'||text.length>6000||typeof image!=='string'||image.length>1900000||(!text.trim()&&!image))return json(400,{error:'분석할 이미지 또는 문구를 입력하세요.'});
if(image&&!/^data:image\/(jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(image))return json(400,{error:'이미지 형식이 올바르지 않습니다.'});
const key=(process.env.OPENAI_API_KEY||'').trim();if(!key)return json(503,{error:'Netlify 서버 함수에 OPENAI_API_KEY가 전달되지 않았습니다. Netlify 환경 변수의 Functions 범위와 Production 값을 확인하고, 환경 변수 저장 후 새 배포가 완료되었는지 확인하세요.',code:'OPENAI_KEY_NOT_AVAILABLE'});
const prompt='한국어 자동차 렌트/리스 홍보물에서 실제 확인 가능한 사실만 추출해 JSON으로 응답하세요. 사진이나 텍스트에 없는 정보는 절대 추정하지 말고 빈 문자열로 두세요. 복수 차종이나 가격이 있으면 하나로 합치지 말고 warnings에 반드시 적으세요. 가격은 보증금, 월 렌트료, 수수료를 혼동하지 마세요. 필드: models(이미지나 원문에 실제로 명시된 차종 이름 배열. 중복 없이 최대 12개. 브랜드나 임의 추정 차종 금지),title(짧은 배너 제목),subtitle(차종 연식 기간),benefit(확인된 가장 중요한 혜택),note(유의사항),extra(기타 상세정보),model(한 차종이 명확할 때만),category(명확히 신차렌트/newcars, 중고렌트/cars, 신차리스/newlease, 중고리스/usedlease 중 하나일 때만),warnings(문자열 배열). 이미지의 글자가 불명확하면 warnings에 적으세요.';
const content=[{type:'text',text:prompt+'\n\n홍보 문구:\n'+text}];if(image)content.push({type:'image_url',image_url:{url:image,detail:'high'}});
const response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_PROMO_MODEL||'gpt-4.1-mini',temperature:0,response_format:{type:'json_object'},messages:[{role:'user',content}]})});
const data=await response.json();if(!response.ok)return json(502,{error:'AI 분석 서비스 오류: '+(data.error?.message||response.status)});
const raw=JSON.parse(data.choices?.[0]?.message?.content||'{}');const fields=['title','subtitle','benefit','note','extra','model','category'];const out={};for(const f of fields)out[f]=typeof raw[f]==='string'?raw[f].slice(0,f==='extra'?500:250):'';if(!['newcars','cars','newlease','usedlease'].includes(out.category))out.category='';out.models=Array.isArray(raw.models)?[...new Set(raw.models.filter(x=>typeof x==='string').map(x=>x.trim()).filter(x=>x.length>0&&x.length<=30))].slice(0,12):[];out.warnings=Array.isArray(raw.warnings)?raw.warnings.map(x=>String(x).slice(0,180)).slice(0,8):[];return json(200,out);
}catch(e){return json(500,{error:'분석 실패: '+e.message})}
};