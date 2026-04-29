"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Photo } from "@/app/types/types";
import Post from "./Post";
import { useAuth } from "@/app/context/AuthContext";
import { useDebounce } from 'use-debounce';
import { Bugs } from "@/app/lib/bugs";
import { useBugStatus } from "@/app/context/BugStatusContext";
import {toast} from "react-hot-toast";


interface PostListProps {
    userId?: string;
    postsPerPage?: number;
}

interface PaginationData {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function PostList({ userId, postsPerPage = 10 }: PostListProps) {
    const { token } = useAuth();
    const [posts, setPosts] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationData>({
        total: 0,
        page: 1,
        limit: postsPerPage,
        totalPages: 0
    });
    const [hasMore, setHasMore] = useState(true);
    const params = useParams(); 
    const student = params.student as string; 
    const [searchTerm, setSearchTerm] = useState(''); 
    const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

    const { getBugStatus: getContextBugStatus } = useBugStatus();
    const isSearchEnabled = getContextBugStatus(Bugs.POST_SEARCH_NOT_WORKING.id) ?? false;
    const isScrollLoadEnabled = getContextBugStatus(Bugs.SCROLL_LOAD_NOT_WORKING.id) ?? false;


    const observerTarget = useRef<HTMLDivElement>(null);

    const fetchPosts = useCallback(async (page: number, append: boolean = false, currentSearchTerm: string = '') => {
        if (!token) return;
        
        setLoading(true);
        setError(null);

        try {
            let url = `/${student}/api/protected/photos?page=${page}&limit=${pagination.limit}`;
            if (userId) {
                url += `&userId=${userId}`;
            }
            if (currentSearchTerm && isSearchEnabled) {
                url += `&description=${encodeURIComponent(currentSearchTerm)}`;
            }
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            
            if (append) {
                setPosts(prevPosts => [...prevPosts, ...data.photos]);
            } else {
                setPosts(data.photos);
            }
            
            setPagination(data.pagination);
            setHasMore(data.pagination.page < data.pagination.totalPages);
        } catch (error: unknown) {
            console.error("Error fetching posts:", error);
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("An error occurred. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    }, [token, userId, pagination.limit, student, isSearchEnabled]);

    useEffect(() => {
        if (token) {
            setSearchTerm(''); 
            fetchPosts(1, false);
        } else {
            setLoading(false);
            setPosts([]); 
            setHasMore(false);
        }
    }, [token, userId, fetchPosts]);

    useEffect(() => {
        if (token) {
            fetchPosts(1, false, debouncedSearchTerm);
        }
    }, [debouncedSearchTerm, token, fetchPosts]); 


    const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
        const [target] = entries;
        if (isScrollLoadEnabled && target.isIntersecting && hasMore && !loading) {
            fetchPosts(pagination.page + 1, true, debouncedSearchTerm);
        }
    }, [hasMore, loading, pagination.page, fetchPosts, debouncedSearchTerm, isScrollLoadEnabled]);

    useEffect(() => {
        const element = observerTarget.current;
        if (!element || !isScrollLoadEnabled) return;

        const option = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver(handleObserver, option);
        observer.observe(element);

        return () => observer.disconnect();
    }, [handleObserver, isScrollLoadEnabled]);

    const handleDelete = async (photoId: number) => {
        setError(null);
        try {
            const response = await fetch(`/${student}/api/protected/me/photos/${photoId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                setPosts((prevPosts) => prevPosts.filter((post) => post.id !== photoId));
                
                if (posts.length <= pagination.limit && hasMore) {
                    await fetchPosts(pagination.page + 1, true, debouncedSearchTerm);
                }
            } else {
                toast.error("Nepodařilo se smazat fotku");
            }
        } catch (error: unknown) {
            console.error("Error deleting photo:", error);
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("An error occurred. Please try again.");
            }
        }
    };

    return (
        <div data-test-id={userId ? "profile-post-list" : "dashboard-post-list"}>
            {!userId && (
                <div className="mb-4 px-4">
                    <input
                        type="text"
                        placeholder="Hledat v popiscích..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        data-test-id="post-search-input"
                    />
                </div>
            )}
            {posts.map((post) => (
                <Post key={post.id} post={post} onDelete={handleDelete} />
            ))}
            
            {posts.length === 0 && !loading && !error && (
                <div data-test-id="no-posts" className="text-center text-gray-500 my-4">😱😱😱😱Žádné fotky k zobrazení.😱😱😱😱</div>
            )}
            
            <div ref={observerTarget} className="h-10 w-full flex justify-center items-center my-4" data-test-id="posts-scroll-sentinel">
                {loading && <div data-test-id="posts-loading">Načítání dalších fotek...</div>}
            </div>
            
            {error && <div className="text-red-500 text-center my-4" data-test-id="posts-error">Error: {error}</div>}
            
            {!hasMore && posts.length > 0 && (
                <div className="text-center text-gray-500 my-4" data-test-id="wall-end-text">😱😱A tohle je už úplný konec postů. 😱😱</div>
            )}
        </div>
    );
}
