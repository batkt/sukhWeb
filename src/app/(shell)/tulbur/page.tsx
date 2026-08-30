"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function TulburPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    router.replace(`/tulbur/guilgeeTuukh${query ? `?${query}` : ""}`);
  }, [router, searchParams]);

  return null;
}
