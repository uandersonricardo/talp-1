import { useCallback, useEffect, useRef, useState } from "react";

import { listExams } from "../api/exams";
import type { Exam } from "../types";

export function useExams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (p: number, s: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await listExams({ page: p, search: s, limit: 20 });
      setExams(result.data);
      setTotal(result.total);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page, search);
  }, [page, load]); // eslint-disable-line

  const onSearch = useCallback(
    (s: string) => {
      setSearch(s);
      setPage(1);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => load(1, s), 300);
    },
    [load],
  );

  const onPageChange = useCallback(
    (p: number) => {
      setPage(p);
      load(p, search);
    },
    [load, search],
  );

  const refresh = useCallback(() => load(page, search), [load, page, search]);

  return { exams, total, page, search, loading, error, onSearch, onPageChange, refresh };
}
