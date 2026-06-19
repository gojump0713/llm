import React, { useEffect } from 'react';
import { DashboardProvider, useDashboard } from './state/store.jsx';
import { parseWorkbook, base64ToBytes } from './lib/parse.js';
import { sampleXlsxBase64 } from './data/sample.js';
import Header from './components/Header.jsx';
import FilterBar from './components/FilterBar.jsx';
import KpiRow from './components/KpiRow.jsx';
import CompanyRanking from './components/CompanyRanking.jsx';
import MonthlyTrend from './components/MonthlyTrend.jsx';
import OrgRanking from './components/OrgRanking.jsx';
import ShareChart from './components/ShareChart.jsx';
import ProductCards from './components/ProductCards.jsx';
import DataTable from './components/DataTable.jsx';

export default function App() {
  return (
    <DashboardProvider>
      <Dashboard />
    </DashboardProvider>
  );
}

function Dashboard() {
  const { theme, loading, error, records, dispatch } = useDashboard();

  // 테마를 <html data-theme> 에 반영
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // 최초 마운트: 내장 샘플 엑셀을 업로드와 동일한 파이프라인으로 로드
  useEffect(() => {
    try {
      const bytes = base64ToBytes(sampleXlsxBase64);
      const { records, meta } = parseWorkbook(bytes);
      dispatch({ type: 'SET_DATA', records, meta: { ...meta, fileName: '조달내역 인공지능(AI)소프트웨어.xlsx' } });
    } catch (err) {
      dispatch({ type: 'ERROR', error: err.message || '샘플 로드 실패' });
    }
  }, [dispatch]);

  return (
    <div className="min-h-full">
      <Header />
      <FilterBar />

      <main className="mx-auto max-w-[1400px] space-y-4 px-4 py-4 sm:px-6">
        {error && (
          <div className="card border-neg/40 p-4 text-sm text-neg" style={{ borderColor: 'var(--neg)' }}>
            ⚠ {error}
          </div>
        )}

        {loading && !records.length ? (
          <LoadingState />
        ) : (
          <>
            {/* 1행 — KPI */}
            <KpiRow />

            {/* 2행 — 공급기업 랭킹 / 월별 추이 */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <CompanyRanking />
              <MonthlyTrend />
            </div>

            {/* 3행 — 수요기관 TOP / 비중 */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <OrgRanking />
              <ShareChart />
            </div>

            {/* 4행 — 제품 소개 카드 */}
            <ProductCards />

            {/* 하단 — 원본 데이터 테이블 */}
            <DataTable />
          </>
        )}

        <footer className="py-6 text-center text-xs text-muted">
          데이터 출처: 나라장터 특정품목 조달내역(인공지능(AI)소프트웨어) · 모든 분석은 브라우저에서 처리되며 외부로 전송되지 않습니다.
        </footer>
      </main>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-muted">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-border"
        style={{ borderTopColor: 'var(--accent)' }}
      />
      <p className="text-sm">데이터를 분석하는 중…</p>
    </div>
  );
}
