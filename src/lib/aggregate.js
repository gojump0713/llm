import { toMonth } from './format.js';

// =========================================================================
// 집계 & 필터 셀렉터 — 정제된 레코드 배열을 입력받아 화면용 지표를 산출.
// 전역 필터(크로스필터링)는 applyFilters 한 곳을 거치고, 각 차트는
// 그 결과(filtered)를 다시 그룹핑한다.
// =========================================================================

/** 빈 필터 기본값 */
export const EMPTY_FILTERS = {
  dateFrom: null, // 'YYYYMMDD'
  dateTo: null,
  gov: null, // 소관구분
  ctype: null, // 기업구분
  method: null, // 계약방법
  company: null, // 차트 클릭으로 선택한 기업
  org: null, // 차트 클릭으로 선택한 수요기관
  search: '', // 자유 검색어
};

/** 전역 필터를 레코드에 적용 */
export function applyFilters(records, f) {
  const q = (f.search || '').trim().toLowerCase();
  return records.filter((d) => {
    if (f.dateFrom && d.date < f.dateFrom) return false;
    if (f.dateTo && d.date > f.dateTo) return false;
    if (f.gov && d.gov !== f.gov) return false;
    if (f.ctype && d.ctype !== f.ctype) return false;
    if (f.method && d.method !== f.method) return false;
    if (f.company && d.company !== f.company) return false;
    if (f.org && d.org !== f.org) return false;
    if (q) {
      const hay = `${d.company} ${d.org} ${d.contractName} ${d.productName} ${d.productDesc} ${d.region}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/** 고유 계약 건수(계약번호 기준) */
export function uniqueContracts(records) {
  const s = new Set();
  for (const d of records) s.add(d.contractNo || d.id);
  return s.size;
}

/**
 * KPI 묶음.
 * @param countByContract true면 계약번호 고유 기준, false면 라인 기준 건수.
 */
export function computeKpis(records, countByContract = true) {
  const companies = new Set();
  let total = 0;
  let unitSum = 0;
  let unitCnt = 0;
  for (const d of records) {
    companies.add(d.company);
    total += d.amount;
    if (d.unitPrice > 0) {
      unitSum += d.unitPrice;
      unitCnt += 1;
    }
  }
  const count = countByContract ? uniqueContracts(records) : records.length;
  return {
    companyCount: companies.size,
    totalAmount: total,
    contractCount: count,
    avgUnitPrice: unitCnt ? unitSum / unitCnt : 0,
  };
}

/** 직전 기간(동일 길이) 대비 KPI — 증감 표시용 */
export function computePrevKpis(allRecords, filters, countByContract) {
  if (!filters.dateFrom || !filters.dateTo) return null;
  const from = filters.dateFrom;
  const to = filters.dateTo;
  const dFrom = parseYmd(from);
  const dTo = parseYmd(to);
  if (!dFrom || !dTo) return null;
  const spanDays = Math.round((dTo - dFrom) / 86400000) + 1;
  const prevTo = new Date(dFrom.getTime() - 86400000);
  const prevFrom = new Date(prevTo.getTime() - (spanDays - 1) * 86400000);
  const prevFilters = {
    ...filters,
    dateFrom: fmtYmd(prevFrom),
    dateTo: fmtYmd(prevTo),
  };
  const prev = applyFilters(allRecords, prevFilters);
  if (!prev.length) return null;
  return computeKpis(prev, countByContract);
}

/** 기업 랭킹 — 금액/건수 기준 */
export function rankCompanies(records, by = 'amount', topN = 15, countByContract = true) {
  return rankBy(records, 'company', by, countByContract)
    .slice(0, topN);
}

/** 수요기관 랭킹 */
export function rankOrgs(records, by = 'amount', topN = 10, countByContract = true) {
  return rankBy(records, 'org', by, countByContract).slice(0, topN);
}

function rankBy(records, key, by, countByContract) {
  const map = new Map();
  for (const d of records) {
    const k = d[key];
    let e = map.get(k);
    if (!e) {
      e = { name: k, amount: 0, count: 0, _contracts: new Set(), region: d.region, ctype: d.ctype };
      map.set(k, e);
    }
    e.amount += d.amount;
    e._contracts.add(d.contractNo || d.id);
    e.count = countByContract ? e._contracts.size : e.count + 1;
  }
  const arr = [...map.values()].map((e) => {
    if (!countByContract) e.count = e.count; // 라인 기준은 위에서 누적됨
    delete e._contracts;
    return e;
  });
  arr.sort((a, b) => (by === 'amount' ? b.amount - a.amount : b.count - a.count));
  return arr;
}

/** 월별 추이 — 금액(막대) + 건수(라인) */
export function monthlyTrend(records, countByContract = true) {
  const map = new Map();
  for (const d of records) {
    const m = d.month;
    if (!m) continue;
    let e = map.get(m);
    if (!e) {
      e = { month: m, amount: 0, count: 0, _contracts: new Set() };
      map.set(m, e);
    }
    e.amount += d.amount;
    e._contracts.add(d.contractNo || d.id);
  }
  const arr = [...map.values()]
    .map((e) => {
      e.count = countByContract ? e._contracts.size : 0;
      if (!countByContract) e.count = undefined;
      delete e._contracts;
      return e;
    })
    .sort((a, b) => a.month.localeCompare(b.month));

  // 라인 기준 건수 보정
  if (!countByContract) {
    const cnt = new Map();
    for (const d of records) cnt.set(d.month, (cnt.get(d.month) || 0) + 1);
    for (const e of arr) e.count = cnt.get(e.month) || 0;
  }
  return arr;
}

/** 비중(도넛/트리맵) — dimension: 'gov' | 'ctype' | 'method' */
export function shareByDimension(records, dimension = 'gov', by = 'amount') {
  const map = new Map();
  for (const d of records) {
    const k = d[dimension];
    let e = map.get(k);
    if (!e) {
      e = { name: k, amount: 0, count: 0 };
      map.set(k, e);
    }
    e.amount += d.amount;
    e.count += 1;
  }
  const arr = [...map.values()];
  arr.sort((a, b) => (by === 'amount' ? b.amount - a.amount : b.count - a.count));
  return arr;
}

/**
 * 제품 소개 카드 데이터 — 업체+제품 단위로 집계.
 */
export function productCards(records, countByContract = true) {
  const map = new Map();
  for (const d of records) {
    const key = `${d.company}||${d.productName}`;
    let e = map.get(key);
    if (!e) {
      e = {
        key,
        company: d.company,
        product: d.productName,
        desc: d.productDesc,
        ctype: d.ctype,
        region: d.region,
        amount: 0,
        count: 0,
        _contracts: new Set(),
        _orgs: new Map(),
      };
      map.set(key, e);
    }
    e.amount += d.amount;
    e._contracts.add(d.contractNo || d.id);
    if (d.productDesc && d.productDesc.length > (e.desc?.length || 0)) e.desc = d.productDesc;
    e._orgs.set(d.org, (e._orgs.get(d.org) || 0) + d.amount);
  }
  return [...map.values()]
    .map((e) => {
      e.count = countByContract ? e._contracts.size : recordsCountFor(records, e.key);
      const topOrg = [...e._orgs.entries()].sort((a, b) => b[1] - a[1])[0];
      e.topOrg = topOrg ? topOrg[0] : '';
      delete e._contracts;
      delete e._orgs;
      return e;
    })
    .sort((a, b) => b.amount - a.amount);
}

function recordsCountFor(records, key) {
  let n = 0;
  for (const d of records) if (`${d.company}||${d.productName}` === key) n++;
  return n;
}

/** 드릴다운: 특정 수요기관의 계약 목록 */
export function orgDrilldown(records, orgName) {
  return records
    .filter((d) => d.org === orgName)
    .sort((a, b) => b.amount - a.amount)
    .map((d) => ({
      contractName: d.contractName || d.productName,
      company: d.company,
      amount: d.amount,
      date: d.date,
      method: d.method,
    }));
}

/** 고유 선택지(필터 드롭다운용) — 빈도순 */
export function distinctValues(records, key) {
  const map = new Map();
  for (const d of records) map.set(d[key], (map.get(d[key]) || 0) + 1);
  return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v);
}

// --- 날짜 헬퍼 ---
function parseYmd(s) {
  s = String(s);
  if (s.length !== 8) return null;
  return new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8));
}
function fmtYmd(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}
