import React, { createContext, useContext, useMemo, useReducer, useCallback } from 'react';
import { EMPTY_FILTERS, applyFilters } from '../lib/aggregate.js';

// =========================================================================
// 전역 대시보드 상태 — 필터(크로스필터링), 토글, 데이터셋, 테마.
// 모든 차트/카드/KPI 는 useDashboard() 로 같은 filtered 결과를 본다.
// =========================================================================

const DashboardContext = createContext(null);

const initialState = {
  records: [], // 정제된 전체 레코드
  meta: null, // { from, to, dropped, fileName }
  filters: { ...EMPTY_FILTERS },
  countByContract: true, // KPI/건수: 계약번호 고유(true) ↔ 라인(false)
  theme: 'dark',
  loading: true,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_DATA':
      return {
        ...state,
        records: action.records,
        meta: action.meta,
        // 새 데이터 로드 시 필터 초기화(기간은 데이터 범위로 세팅)
        filters: {
          ...EMPTY_FILTERS,
          dateFrom: action.meta.from,
          dateTo: action.meta.to,
        },
        loading: false,
        error: null,
      };
    case 'LOADING':
      return { ...state, loading: true, error: null };
    case 'ERROR':
      return { ...state, loading: false, error: action.error };
    case 'SET_FILTER':
      return { ...state, filters: { ...state.filters, [action.key]: action.value } };
    case 'TOGGLE_FILTER': {
      // 같은 값 재클릭이면 해제(토글)
      const curr = state.filters[action.key];
      const next = curr === action.value ? null : action.value;
      return { ...state, filters: { ...state.filters, [action.key]: next } };
    }
    case 'CLEAR_FILTER':
      return { ...state, filters: { ...state.filters, [action.key]: EMPTY_FILTERS[action.key] } };
    case 'RESET_FILTERS':
      return {
        ...state,
        filters: {
          ...EMPTY_FILTERS,
          dateFrom: state.meta?.from || null,
          dateTo: state.meta?.to || null,
        },
      };
    case 'SET_COUNT_MODE':
      return { ...state, countByContract: action.value };
    case 'SET_THEME':
      return { ...state, theme: action.value };
    default:
      return state;
  }
}

export function DashboardProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // 필터 적용된 레코드 — 무거운 계산이라 메모이즈
  const filtered = useMemo(
    () => applyFilters(state.records, state.filters),
    [state.records, state.filters]
  );

  const setFilter = useCallback((key, value) => dispatch({ type: 'SET_FILTER', key, value }), []);
  const toggleFilter = useCallback(
    (key, value) => dispatch({ type: 'TOGGLE_FILTER', key, value }),
    []
  );
  const clearFilter = useCallback((key) => dispatch({ type: 'CLEAR_FILTER', key }), []);
  const resetFilters = useCallback(() => dispatch({ type: 'RESET_FILTERS' }), []);

  const value = useMemo(
    () => ({ ...state, filtered, dispatch, setFilter, toggleFilter, clearFilter, resetFilters }),
    [state, filtered, setFilter, toggleFilter, clearFilter, resetFilters]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
}
