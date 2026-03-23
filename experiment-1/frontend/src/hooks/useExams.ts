import { useCallback, useEffect, useState } from "react";

import { listExams } from "../api/exams";
import type { Exam } from "../types";

export function useExams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await listExams({ page: p, limit: 20 });
      setExams(result.data);
      setTotal(result.total);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [page, load]);

  const onPageChange = useCallback(
    (p: number) => {
      setPage(p);
      load(p);
    },
    [load],
  );

  const refresh = useCallback(() => load(page), [load, page]);

  return { exams, total, page, loading, error, onPageChange, refresh };
}
