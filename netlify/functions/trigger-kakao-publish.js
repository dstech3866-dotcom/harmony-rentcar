// Server-side, authenticated GitHub Actions dispatch for a published Kakao image.
// Configure KAKAO_GITHUB_TOKEN in Netlify environment (fine-grained token:
// Actions read/write for dstech3866-dotcom/harmony-rentcar).
const SUPABASE = 'https://gaygechqnvehajmsnvfb.supabase.co';
const ANON_KEY = 'sb_publishable_OFGuCgOffh-ofXnDu80eAA_9Z1wQclO';
const REPO = 'dstech3866-dotcom/harmony-rentcar';
const WORKFLOW = 'kakao-daily.yml';
const json = (status, data) => ({statusCode:status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'},body:JSON.stringify(data)});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405,{error:'POST only'});
  const authorization = event.headers.authorization || event.headers.Authorization || '';
  if (!/^Bearer [A-Za-z0-9._~-]+$/.test(authorization)) return json(401,{error:'관리자 로그인이 필요합니다.'});
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400,{error:'잘못된 요청입니다.'}); }
  if (!/^inventory\/kakao-preview\/[0-9]+\.jpg$/.test(body.imagePath || '')) return json(400,{error:'이미지 경로가 올바르지 않습니다.'});
  try {
    const auth = await fetch(SUPABASE+'/auth/v1/user', {headers:{apikey:ANON_KEY,Authorization:authorization}});
    if (!auth.ok) return json(401,{error:'관리자 인증이 만료되었습니다.'});
    const user = await auth.json();
    if (!user.id) return json(401,{error:'로그인이 필요합니다.'});
    const metaResponse = await fetch(SUPABASE+'/storage/v1/object/public/gallery/inventory/kakao-preview.json?verify='+Date.now(),{headers:{'cache-control':'no-cache'}});
    if (!metaResponse.ok) return json(409,{error:'게시된 이미지 설정을 확인할 수 없습니다.'});
    const meta = await metaResponse.json();
    if (meta.image !== body.imagePath) return json(409,{error:'게시된 이미지가 변경되었습니다. 다시 게시해 주세요.'});
    const token = process.env.KAKAO_GITHUB_TOKEN;
    if (!token) return json(503,{error:'Netlify 환경변수 KAKAO_GITHUB_TOKEN 설정이 필요합니다.'});
    const dispatch = await fetch('https://api.github.com/repos/'+REPO+'/actions/workflows/'+WORKFLOW+'/dispatches',{
      method:'POST',
      headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'harmony-kakao-publisher','content-type':'application/json'},
      body:JSON.stringify({ref:'main'})
    });
    if (dispatch.status !== 204) return json(502,{error:'GitHub 자동 생성 요청 실패 (HTTP '+dispatch.status+'). 토큰의 Actions 권한을 확인해 주세요.'});
    return json(202,{ok:true,message:'GitHub 이미지 생성 요청 완료. Netlify 배포 후 카카오톡에 반영됩니다.'});
  } catch (e) {
    return json(502,{error:'자동 생성 연결 오류: '+(e?.message || 'unknown')});
  }
};
