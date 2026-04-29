"use client";

import {useEffect} from "react";
import { useRouter, useParams } from "next/navigation";
import Layout from "@/app/components/Layout";
import PostList from "@/app/components/PostList"; 
import { useAuth } from "@/app/context/AuthContext";
import {NewPostButton} from "@/app/components/NewPostButton";


export default function Dashboard() {
  const { isLoading, isAuthenticated } = useAuth(); 
  const router = useRouter();
  const params = useParams(); 
  const student = params.student as string; 



  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${student}/login`);
    }
  }, [student, isLoading, isAuthenticated, router]); 


  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen" data-test-id="dashboard-loading">
          <p>Načítání...</p>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) { // Simplified check
    return null; // Will be redirected by useEffect
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-4" data-test-id="dashboard-content">
        <NewPostButton onClick={() => router.push(`/${student}/newpost`)}/>

        <PostList/>

      </div>
    </Layout>
  );
}
