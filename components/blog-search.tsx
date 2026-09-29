"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function BlogSearch({ query }: { query: string }) {
  const [value, setValue] = useState(query);
  const router = useRouter();
  useEffect(() => { setValue(query); }, [query]);
  useEffect(() => {
    if (value === query) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ search: value, page: "1" });
      router.replace(`/blog?${params}`, { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
  }, [value, query, router]);
  return <input type="search" aria-label="Search blogs by title" placeholder="Search blogs by title..." className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300" value={value} onChange={event => setValue(event.target.value)} />;
}
