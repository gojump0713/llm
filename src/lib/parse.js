import * as XLSX from 'xlsx';
import { toMonth } from './format.js';

// =========================================================================
// 나라장터 "특정품목 조달내역" 엑셀 파싱 & 정제
//  - 헤더는 보통 3행이지만, 헤더명으로 자동 탐지해 형식이 같은 어떤 파일이든 처리.
//  - 데이터는 헤더 다음 행부터.
// =========================================================================

// 화면에서 쓰는 표준 필드 <- 엑셀 헤더명 매핑(헤더명 기반이라 컬럼 순서가 바뀌어도 안전)
const COLUMN_MAP = {
  date: '계약(납품요구)일자',
  contractNo: '계약(납품요구)번호',
  lineSeq: '물품순번',
  org: '수요기관',
  gov: '소관구분',
  sigungu: '수요기관소재시군구',
  itemRaw: '품목명',
  company: '업체명',
  ctype: '계약시점 기업구분',
  region: '계약시점 업체소재시도',
  contractName: '계약(납품요구)명',
  method: '계약방법',
  unitPrice: '계약납품단가',
  qty: '계약납품수량',
  amount: '공급금액',
};

const PLACEHOLDER = '인공지능(AI)소프트웨어'; // 품목명이 이 값뿐이면 의미정보 없음 → 계약명으로 보완

/** base64 문자열 -> Uint8Array (내장 샘플 디코딩용) */
export function base64ToBytes(b64) {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/**
 * 워크북 바이트(ArrayBuffer/Uint8Array)를 표준 레코드 배열로 정제.
 * @returns {{records: object[], meta: {from: string, to: string, dropped: number}}}
 */
export function parseWorkbook(input) {
  const wb = XLSX.read(input, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });

  // 1) 헤더 행 탐지: 날짜 컬럼명을 포함한 첫 행
  const headerRowIdx = rows.findIndex(
    (r) => Array.isArray(r) && r.includes(COLUMN_MAP.date)
  );
  if (headerRowIdx === -1) {
    throw new Error('헤더를 찾을 수 없습니다. 나라장터 "특정품목 조달내역" 형식의 엑셀인지 확인하세요.');
  }
  const header = rows[headerRowIdx];
  const idx = {};
  for (const [key, name] of Object.entries(COLUMN_MAP)) idx[key] = header.indexOf(name);

  // 2) 데이터 정제
  const records = [];
  let dropped = 0;
  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const rawDate = row[idx.date];
    const rawAmount = row[idx.amount];
    // 규칙 4) 빈 금액/날짜 제외
    if (rawDate == null || rawAmount == null || rawAmount === '') {
      if (rawDate != null || rawAmount != null) dropped++;
      continue;
    }
    const date = String(rawDate).trim();
    const amount = Number(rawAmount) || 0;
    if (!date || amount <= 0) {
      dropped++;
      continue;
    }

    const contractName = clean(row[idx.contractName]);
    const itemRaw = clean(row[idx.itemRaw]);
    const parsed = parseItemName(itemRaw, contractName, clean(row[idx.company]));

    records.push({
      id: r,
      date,
      month: toMonth(date),
      contractNo: clean(row[idx.contractNo]),
      lineSeq: clean(row[idx.lineSeq]),
      org: clean(row[idx.org]) || '(미상)',
      gov: clean(row[idx.gov]) || '(미분류)',
      sigungu: clean(row[idx.sigungu]),
      company: clean(row[idx.company]) || '(미상)',
      ctype: clean(row[idx.ctype]) || '(미분류)',
      region: clean(row[idx.region]) || '(미상)',
      contractName,
      method: clean(row[idx.method]) || '(미분류)',
      unitPrice: Number(row[idx.unitPrice]) || 0,
      qty: Number(row[idx.qty]) || 0,
      amount,
      // 품목명 분해 결과
      productName: parsed.product,
      productDesc: parsed.desc,
    });
  }

  if (!records.length) throw new Error('유효한 데이터 행이 없습니다.');

  const dates = records.map((d) => d.date).sort();
  return {
    records,
    meta: { from: dates[0], to: dates[dates.length - 1], dropped },
  };
}

function clean(v) {
  if (v == null) return '';
  return String(v).trim();
}

/**
 * 규칙 3) 품목명[S] = "인공지능(AI)소프트웨어, 업체명, 제품명, 설명" 콤마 구조 분해.
 * 값이 placeholder 뿐이면 제품명을 계약명으로 보완.
 */
export function parseItemName(itemRaw, contractName, company) {
  const parts = (itemRaw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // [0]=품목분류(placeholder), [1]=업체명, [2]=제품명, [3...]=설명
  if (parts.length <= 1) {
    return { product: contractName || PLACEHOLDER, desc: contractName || '' };
  }
  const rest = parts.slice(1).filter((p) => p !== company); // 업체명 중복 제거
  const product = rest[0] || contractName || PLACEHOLDER;
  const desc = rest.slice(1).join(', ') || contractName || '';
  return { product, desc };
}
