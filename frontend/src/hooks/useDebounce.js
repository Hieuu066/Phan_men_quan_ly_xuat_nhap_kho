import { useState, useEffect } from "react";

/**
 * Trì hoãn cập nhật giá trị — dùng cho ô tìm kiếm.
 * Chờ người dùng dừng gõ delay ms mới thực hiện tìm kiếm.
 */
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
