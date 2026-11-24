// The local gallery serves published JSON without a session.
async function readLocalGalleryJson(url) {
  const response = await fetch(url, {cache: 'no-store'});
  if (response.status === 404) return null;
  const body = await response.json().catch(() => undefined);
  const code = String(body?.code ?? body?.error ?? '').toLowerCase();
  const missingObject = ['nosuchkey', 'not_found', 'object not found'].includes(code);
  if (response.status === 400 && (String(body?.statusCode) === '404' || missingObject)) {
    return null;
  }
  if (!response.ok) {
    const detail = body?.message || body?.error;
    throw Error('HTTP ' + response.status + (typeof detail === 'string' ? ' · ' + detail : ''));
  }
  if (body === undefined || body === null || typeof body !== 'object') {
    throw Error('저장된 JSON 형식이 올바르지 않습니다.');
  }
  return body;
}
