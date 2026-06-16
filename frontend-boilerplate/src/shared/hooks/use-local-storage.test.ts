import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './use-local-storage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns the initial value when nothing is stored', () => {
    const { result } = renderHook(() => useLocalStorage('key', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });

  it('persists updates to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(window.localStorage.getItem('key')).toBe('"updated"');
  });

  it('reads an existing value from localStorage on mount', () => {
    window.localStorage.setItem('preset', JSON.stringify('from-storage'));

    const { result } = renderHook(() => useLocalStorage('preset', 'fallback'));

    expect(result.current[0]).toBe('from-storage');
  });

  it('falls back to the initial value when stored JSON is invalid', () => {
    window.localStorage.setItem('broken', 'not-json{');

    const { result } = renderHook(() => useLocalStorage('broken', 42));

    expect(result.current[0]).toBe(42);
  });
});
