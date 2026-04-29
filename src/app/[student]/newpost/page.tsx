"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Layout from "@/app/components/Layout";
import { useAuth } from "@/app/context/AuthContext";
import {Bugs} from "@/app/lib/bugs";
import {useBugStatus} from "@/app/context/BugStatusContext";

export default function NewPostPage() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams(); 
  const student = params.student as string; 
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { getBugStatus: getContextBugStatus } = useBugStatus();
  const isDescriptionBugFixed = getContextBugStatus(Bugs.POST_DESCRIPTION_NOT_OPTIONAL.id);
  const isFileSizeBugFixed = getContextBugStatus(Bugs.UPLOAD_LIMIT_DOUBLED.id);
  const isSlowUploadBugFixed = getContextBugStatus(Bugs.UPLOAD_IS_TOO_SLOW.id);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const sizeMultiplier = isFileSizeBugFixed ? 1 : 2;
      const maxSizeInBytes = sizeMultiplier * 3 * 1024 * 1024;

      if (file && file.size > maxSizeInBytes) {
        alert("Velikost souboru jsou maximálně 3 MB!");
        event.target.value = "";
        return;
      }
      setFile(event.target.files[0]);
      setError("");
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!file) {
      setError("Prosím vyberte soubor k nahrání.");
      return;
    }

    if (!token) {
      router.push(`/${student}/login`);
      return;
    }

    setLoading(true);
    setError("");

    if (isFileSizeBugFixed && !isSlowUploadBugFixed) {
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("description", description);

    try {
      const res = await fetch(`/${student}/api/protected/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        const errorMessage = errorData?.message || "Nahrání souboru selhalo.";
        throw new Error(errorMessage);
      }

      router.push(`/${student}/profile`);
    } catch (err: unknown) {
      console.error("Upload error:", err);
      if (err instanceof Error) {
        setError(err.message || "Nahrání souboru selhalo. Prosím zkus to znovu!"); 
      } else if (typeof err === 'string') { 
        setError(err); 
      } else {
        setError("Nahrání souboru selhalo. Prosím zkus to znovu!"); 
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-4 p-4">
        <h1 className="text-2xl font-bold text-black">Nový příspěvek</h1>
        {error && <p className="text-red-500" data-test-id="newpost-error">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4" data-test-id="newpost-form">
          <div>
            <label htmlFor="photo" className="block text-gray-700 font-medium mb-1">Fotka (max. 3MB):</label>
            <input
              id="photo"
              type="file"
              onChange={handleFileChange}
              data-test-id="photo-input"
              required
              accept="image/*"
              className="block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-gray-700 font-medium mb-1">
              Popisek: <span className="text-gray-500 text-sm">(nepovinné)</span> 
            </label>
            <input
              type="text"
              id="description"
              data-test-id="description"
              value={description}
              onChange={handleDescriptionChange}
              className="block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="Napište popisek..."
              required={!isDescriptionBugFixed}
            />
          </div>
          <button
            type="submit"
            data-test-id="sumbit-photo-button"
            disabled={loading}
            className={`px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 hover:bg-blue-600 transition duration-300 ${loading ? 'cursor-not-allowed' : ''}`}
          >
            {loading ? "Nahrávání..." : "Nahrát"}
          </button>
        </form>
      </div>
    </Layout>
  );
}
