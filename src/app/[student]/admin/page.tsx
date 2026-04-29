"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { toast, Toaster } from "react-hot-toast";

interface Report {
  id: number;
  userId: string;
  photoId: number;
  reason: string;
  status: string;
  createdAt: string;
  user: {
    name: string;
  };
  photo: {
    imageUrl: string;
    description: string;
    userId: string;
    user: {
      name: string;
    };
  };
}

export default function AdminReports() {
  const { token, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams(); 
  const student = params.student as string; 
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'dismissed'>('pending');

  useEffect(() => {
    if (!isLoading) {
      if (!token) {
        router.push(`/${student}/login`);
      } else if (isAdmin === false) {
        router.push(`/${student}/dashboard`);
      }
    }
  }, [student, token, isAdmin, isLoading, router]);

  useEffect(() => {
    const fetchReports = async () => {
      if (isLoading || !token || isAdmin !== true) {
        return;
      }

      setTabLoading(true);
      setError(null);

      try {
        const res = await fetch(`/${student}/api/admin/reports?status=${activeTab}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        setReports(data);
      } catch (err) {
        console.error("Error fetching reports:", err);
        setError("Nepodařilo se načíst nahlášené příspěvky.");
      } finally {
        setTabLoading(false);
        setLoading(false);
      }
    };

    fetchReports();
  }, [student, token, isAdmin, isLoading, activeTab]);

  const handleRejectReport = async (reportId: number) => {
    if (!token) return;
    
    try {
      setTabLoading(true);
      const res = await fetch(`/${student}/api/admin/reports/${reportId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: 'dismissed' }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      setReports(prevReports => prevReports.filter(report => report.id !== reportId));
      
      toast.success('Nahlášení bylo úspěšně zamítnuto.');
    } catch (err) {
      console.error('Error dismissing report:', err);
      toast.error('Nepodařilo se zamítnout nahlášení.');
    } finally {
      setTabLoading(false);
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!token) return;
    
    try {
      setTabLoading(true);
      const res = await fetch(`/${student}/api/admin/photos/${photoId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      setReports(prevReports => prevReports.filter(report => report.photoId !== photoId));
      
      toast.success('Příspěvek byl úspěšně smazán.');
    } catch (err) {
      console.error('Error deleting photo:', err);
      toast.error('Nepodařilo se smazat příspěvek.');
    } finally {
      setTabLoading(false);
    }
  };

  if (isLoading) {
    return <div className="container mx-auto p-4" data-test-id="admin-auth-loading">Ověřování oprávnění...</div>;
  }

  if (!token || isAdmin === false) {
    return <div className="container mx-auto p-4" data-test-id="admin-redirecting">Přesměrování...</div>;
  }

  if (loading && !tabLoading) {
    return <div className="container mx-auto p-4" data-test-id="reports-initial-loading">Načítání nahlášených příspěvků...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" data-test-id="reports-title">Správa nahlášených příspěvků</h1>
        <Link
          href={`/${student}/dashboard`}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          data-test-id="reports-back-to-dashboard"
        >
          Zpět na hlavní panel
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex border-b border-gray-200">
          <button
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-b-2 border-pink-500 text-pink-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('pending')}
            disabled={tabLoading}
            data-test-id="reports-tab-pending"
          >
            Čekající nahlášení
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'dismissed'
                ? 'border-b-2 border-pink-500 text-pink-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('dismissed')}
            disabled={tabLoading}
            data-test-id="reports-tab-dismissed"
          >
            Zamítnutá nahlášení
          </button>
        </div>
      </div>

      {error ? (
        <div className="container mx-auto p-4 text-red-500" data-test-id="reports-error">Chyba: {error}</div>
      ) : (
        <div className="relative min-h-[300px]">
          {tabLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10" data-test-id="reports-tab-loading">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          
          {reports.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-700" data-test-id={`reports-empty-${activeTab}`}>
              <p>
                {activeTab === 'pending'
                  ? 'Žádné čekající nahlášené příspěvky.'
                  : 'Žádné zamítnuté nahlášené příspěvky.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {reports.map((report) => (
                <div key={report.id} className="bg-white rounded-lg shadow-md p-6" data-test-id={`report-card-${report.id}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-700">Nahlášení #{report.id}</h2>
                      <p className="text-gray-700">
                        Nahlásil uživatel: {report.user.name}
                      </p>
                      <p className="text-gray-700">
                        Datum nahlášení: {new Date(report.createdAt).toLocaleString("cs-CZ")}
                      </p>
                      <p className="text-gray-700">
                        Status: {report.status === 'pending' ? 'Čekající' : 'Zamítnuté'}
                      </p>
                    </div>
                    {activeTab === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleRejectReport(report.id)}
                          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                          disabled={tabLoading}
                          data-test-id={`report-dismiss-${report.id}`}
                        >
                          Zamítnout nahlášení
                        </button>
                        <button
                          onClick={() => handleDeletePhoto(report.photoId)}
                          className="bg-pink-700 hover:bg-pink-800 text-white font-bold py-2 px-4 rounded"
                          disabled={tabLoading}
                          data-test-id={`report-delete-photo-${report.photoId}`}
                        >
                          Smazat příspěvek
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <h3 className="font-semibold mb-2 text-gray-700">Důvod nahlášení:</h3>
                    <p className="bg-gray-100 p-3 rounded text-gray-800" data-test-id={`report-reason-${report.id}`}>{report.reason}</p>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2 text-gray-700">Nahlášený příspěvek:</h3>
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="relative w-full md:w-1/3 h-[200px] ">
                        <Image
                          src={report.photo.imageUrl}
                          alt="Nahlášený příspěvek"
                          fill
                          className="object-contain rounded-lg"
                        />
                      </div>
                      <div className="md:w-2/3">
                        <p className="text-gray-700 mb-2">
                          Autor příspěvku: {report.photo.user.name}
                        </p>
                        <p className="text-gray-800">
                          {report.photo.description || "Bez popisku"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <Toaster />
    </div>
  );
}
