// =========================================================================
// 숫자/금액/날짜 포맷 유틸 — 원 단위 값을 화면용으로 가독성 있게.
// =========================================================================

/** 원(₩) 금액을 억/만 단위 한글 표기로. 예) 1_910_000_000 -> "19.1억" */
export function formatKRW(won) {
  const n = Number(won) || 0;
  const abs = Math.abs(n);
  if (abs >= 1e8) {
    const eok = n / 1e8;
    // 100억 이상은 정수, 그 미만은 소수 1자리
    return (abs >= 1e10 ? Math.round(eok) : round1(eok)).toLocaleString('ko-KR') + '억';
  }
  if (abs >= 1e4) {
    const man = Math.round(n / 1e4);
    return man.toLocaleString('ko-KR') + '만';
  }
  return n.toLocaleString('ko-KR');
}

/** 축약 없이 전체 원 단위. 예) "1,910,000,000원" */
export function formatWonFull(won) {
  return (Number(won) || 0).toLocaleString('ko-KR') + '원';
}

/** 정수 천단위 콤마 */
export function formatInt(n) {
  return (Number(n) || 0).toLocaleString('ko-KR');
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

/** YYYYMMDD(숫자/문자) -> "YYYY-MM-DD" */
export function formatDate(yyyymmdd) {
  const s = String(yyyymmdd || '').trim();
  if (s.length !== 8) return s;
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

/** YYYYMMDD -> "YYYY-MM" */
export function toMonth(yyyymmdd) {
  const s = String(yyyymmdd || '').trim();
  if (s.length < 6) return '';
  return `${s.slice(0, 4)}-${s.slice(4, 6)}`;
}

/** "YYYY-MM" -> "YY년 M월" (축약 라벨) */
export function monthLabel(ym) {
  if (!ym || ym.length < 7) return ym;
  const [y, m] = ym.split('-');
  return `${y.slice(2)}.${Number(m)}월`;
}

/** 증감률(%) 부호 포함 텍스트와 방향 */
export function deltaInfo(curr, prev) {
  if (prev == null || prev === 0) {
    return { dir: curr > 0 ? 'up' : 'flat', text: curr > 0 ? '신규' : '–', pct: null };
  }
  const pct = ((curr - prev) / Math.abs(prev)) * 100;
  const dir = pct > 0.05 ? 'up' : pct < -0.05 ? 'down' : 'flat';
  return { dir, pct, text: `${pct >= 0 ? '▲' : '▼'} ${Math.abs(pct).toFixed(1)}%` };
}
