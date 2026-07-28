import { useState, useEffect } from 'react';

/**
 * Toggle dark mode thủ công — theo HD 02/HD-CFIT.CSE702051, Điều 8.
 * Ghi nhớ lựa chọn vào localStorage; nếu người dùng chưa chọn gì thì
 * để mặc định theo prefers-color-scheme (không ép class nào cả).
 */
export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return JSON.parse(saved);
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.classList.toggle('light', !dark);
    localStorage.setItem('darkMode', JSON.stringify(dark));
  }, [dark]);

  return [dark, () => setDark((d) => !d)];
}
