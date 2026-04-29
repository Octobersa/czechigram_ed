"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Layout from "@/app/components/Layout";
import PostList from "@/app/components/PostList";
import { useAuth } from "@/app/context/AuthContext";
import {NewPostButton} from "@/app/components/NewPostButton";
import {useBugStatus} from "@/app/context/BugStatusContext";

export default function ProfilePage({ isOwnProfile = false }) {
  const { token, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const student = params.student as string; 
  
  // For other profiles, use ID from params
  const userIdFromParams = isOwnProfile ? null : (params.userId as string);
  
  const [userId, setUserId] = useState(userIdFromParams);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const { getBugStatus: getContextBugStatus } = useBugStatus();
  const isAddPostButtonBugFixed = getContextBugStatus("POST_CANNOT_BE_ADDED_ON_PROFILE_PAGE") ?? false;

  // First fetch: Get user ID for own profile
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push(`/${student}/login`);
      return;
    }

    // Skip this effect for other users' profiles
    if (!isOwnProfile || userId) return;

    const fetchUserId = async () => {
      setIsLoading(true);
      try {
        const meRes = await fetch(`/${student}/api/protected/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!meRes.ok) {
          const errorData = await meRes.json();
          throw new Error(errorData.message || "Failed to fetch user ID");
        }

        const meData = await meRes.json();
        setUserId(meData.id);
      } catch (err: unknown) {
        console.error("Error fetching user ID:", err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Something went wrong. Please try again.");
        }
        setIsLoading(false);
      }
    };

    if (token) {
      fetchUserId();
    }
  }, [student, token, router, authLoading, isAuthenticated, isOwnProfile, userId]);

  // Second fetch: Get user data once we have the userId
  useEffect(() => {
    if (authLoading || !token || !userId) return;

    const fetchUserData = async () => {
      setIsLoading(true);
      setError("");

      try {
        const userRes = await fetch(`/${student}/api/protected/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!userRes.ok) {
          const errorData = await userRes.json();
          throw new Error(errorData.message || "Failed to fetch user data");
        }

        const userData = await userRes.json();
        setUsername(userData.name);
        setBio(userData.bio || "");
      } catch (err: unknown) {
        console.error("Error fetching user data:", err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Something went wrong. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [student, token, userId, authLoading]);

  const handleEditBio = () => {
    setNewBio(bio);
    setIsEditingBio(true);
  };

  const handleCancelEdit = () => {
    setIsEditingBio(false);
  };

  const handleSaveBio = async () => {
    if (!userId || !token) return;
    
    setSaveLoading(true);
    try {
      const response = await fetch(`/${student}/api/protected/me/bio`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bio: newBio })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update bio");
      }

      setBio(newBio);
      setIsEditingBio(false);
    } catch (err: unknown) {
      console.error("Error updating bio:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update bio. Please try again.");
      }
    } finally {
      setSaveLoading(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return <Layout><div data-test-id="profile-auth-loading">Načítání...</div></Layout>;
  }

  if (isLoading) {
    return <Layout><div data-test-id="profile-data-loading">Načítání uživatelských dat...</div></Layout>;
  }

  if (error) {
    return (
      <Layout>
        <p className="text-red-500" data-test-id="profile-error">{error}</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-4">
        
        <div className="bg-white shadow-md rounded-lg p-4 mb-4 mt-2">
        {username && (
          <h1 className="text-2xl font-bold mb-4 text-black" data-test-id="profile-username">
            {username}
          </h1>
        )}
        <hr />  
          {isEditingBio ? (
            <div className="mt-4">
              <textarea
                value={newBio}
                onChange={(e) => setNewBio(e.target.value)}
                className="w-full border rounded p-2 text-black"
                rows={4}
                placeholder="Napište něco o sobě..."
                data-test-id="profile-bio-input"
              />
              <div className="mt-2">
                <button 
                  onClick={handleSaveBio} 
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded mr-2"
                  disabled={saveLoading}
                  data-test-id="profile-bio-save"
                >
                  {saveLoading ? "Ukládám..." : "Uložit"}
                </button>
                <button 
                  onClick={handleCancelEdit} 
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded"
                  disabled={saveLoading}
                  data-test-id="profile-bio-cancel"
                >
                  Zrušit
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center mt-4">
              <p className="text-gray-700 flex-grow" data-test-id="profile-bio">
                {bio ? bio : <em>Uživatel je tajemný jak hrad v Karpatech!</em>}
              </p>
              {isOwnProfile && (
                <button onClick={handleEditBio} className="text-blue-500 hover:text-blue-700 ml-2" data-test-id="profile-bio-edit">
                  ✏️ Upravit
                </button>
              )}
            </div>
          )}
        </div>
        {isOwnProfile && isAddPostButtonBugFixed && (<NewPostButton onClick={() => router.push(`/${student}/newpost`)} />)}

        {userId && <PostList userId={userId} />}
      </div>
    </Layout>
  );
}
