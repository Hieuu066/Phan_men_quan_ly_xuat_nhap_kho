import { useState, useCallback } from "react";

/** Hook quản lý trạng thái async (loading, data, error) cho các API call */
export function useAsync(asyncFn) {
  const [state, setState] = useState({ loading: false, data: null, error: null });

  const run = useCallback(async (...args) => {
    setState({ loading: true, data: null, error: null });
    try {
      const data = await asyncFn(...args);
      setState({ loading: false, data, error: null });
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Loi khong xac dinh.";
      setState({ loading: false, data: null, error: msg });
      throw err;
    }
  }, [asyncFn]);

  return { ...state, run };
}
