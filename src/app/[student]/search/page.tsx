"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Layout from "@/app/components/Layout";
import { useAuth } from "@/app/context/AuthContext";
import {useBugStatus} from "@/app/context/BugStatusContext";
import {Bugs} from "@/app/lib/bugs";

export default function SearchPage() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams(); 
  const student = params.student as string; 
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { getBugStatus: getContextBugStatus } = useBugStatus();
  const htmlTagVisibleFixed = getContextBugStatus(Bugs.HTML_CODE_VISIBLE_ON_SEARCH_PAGE.id);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/${student}/api/protected/users/search?query=${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        throw new Error("Search failed");
      }

      const data = await res.json();
      setResults(data);
    } catch {
      setError("Failed to fetch search results.");
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-black">Hledat profil</h1>
        <div className="flex space-x-2 mb-4">
          {!htmlTagVisibleFixed && <p className="text-black">{"<span>Search input</span>"}</p>}
          <input
            type="text"
            placeholder="Zadejte jméno nebo ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border rounded-lg p-2 flex-grow text-black"
            data-test-id="search-user-input"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
            data-test-id="search-user-submit"
          >
            Hledat
          </button>
        </div>
        {loading && <p data-test-id="search-user-loading">Načítání...</p>}
        {error && <p className="text-red-500" data-test-id="search-user-error">{error}</p>}
        <ul className="space-y-2" data-test-id="search-results-list">
          {results.map((user) => (
            <li
              key={user.id}
              onClick={() => router.push(`/${student}/profile/${user.id}`)}
              className="cursor-pointer p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-black"
              data-test-id={user.id}
            >
              {user.name}
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}
