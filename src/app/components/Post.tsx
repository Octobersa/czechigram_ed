"use client";

import { Photo } from "@/app/types/types"; 
import { useAuth } from "@/app/context/AuthContext";
import Image from "next/image";
import Link from "next/link";
import DeletePostModal from "@/app/components/DeletePostModal";
import ImageModal from "@/app/components/ImageModal";
import ReportModal from "@/app/components/ReportModal";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useParams } from "next/navigation";
import { useBugStatus } from "@/app/context/BugStatusContext";
import { Bugs } from "@/app/lib/bugs";

interface PostProps {
  post: Photo;
  onDelete: (id: number) => void;
}

export default function Post({ post, onDelete }: PostProps) {
    const { token, userId } = useAuth();
    const [likesCount, setLikesCount] = useState(post.likesCount);
    const [userLiked, setUserLiked] = useState(post.userLiked);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [hasReported, setHasReported] = useState(post.userReported || false);
    const [photoId, setPhotoId] = useState<number | null>(null);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [newDescription, setNewDescription] = useState(post.description || "");
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [modalImageSrc, setModalImageSrc] = useState("");
    const params = useParams(); 
    const student = params.student as string;
    const { getBugStatus: getContextBugStatus } = useBugStatus();
    const canUnlikePost = getContextBugStatus(Bugs.POST_CANNOT_BE_UNLIKED.id) ?? false;
    const showUsernameInsteadOfId = getContextBugStatus(Bugs.USER_ID_INSTEAD_OF_USERNAME.id) ?? false;
    const deleteInsteadReportFixed = getContextBugStatus(Bugs.DELETE_INSTEAD_OF_REPORT.id) ?? false;
  
    const openImageModal = (src: string) => {
      setModalImageSrc(src);
      setIsImageModalOpen(true);
    };
  
    const closeImageModal = () => {
      setIsImageModalOpen(false);
      setModalImageSrc("");
    };


    const openDeleteModal = (id: number) => {
        setPhotoId(id);
        setIsModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsModalOpen(false);
        setPhotoId(null);
    };

    const openReportModal = () => {
      setIsReportModalOpen(true);
  };
  
  const closeReportModal = () => {
      setIsReportModalOpen(false);
  };

    const deletePhoto = async () => {
        if (photoId) {
            onDelete(photoId); // Call the parent's onDelete function
            closeDeleteModal();
        }
    };

    const toggleLike = async () => {
        if (!token) return;
        if (!canUnlikePost && userLiked) {
            toast.error("Nastala neočekávaná chyba.");
            return;
        }

        try {
            const res = await fetch(`/${student}/api/protected/photos/${post.id}/likes`, {
                method: userLiked ? "DELETE" : "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (res.ok) {
                setUserLiked(!userLiked);
                setLikesCount((prev: number) => (userLiked ? prev - 1 : prev + 1));
            } else {
                const errorData = await res.json();
                throw new Error(errorData.message || `Failed to like/unlike: ${res.status}`);
            }
        } catch (error) {
            console.error("Failed to like/unlike post:", error);
        }
    };

    const handleEditDescription = () => {
        setIsEditingDescription(true);
    };

    const handleSaveDescription = async () => {
        if (!token) return;
    
        try {
          const res = await fetch(`/${student}/api/protected/me/photos/${post.id}`, { 
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ description: newDescription }), 
          });
    
          if (res.ok) {
            const updatedPost = await res.json();
            post.description = updatedPost.description; 
            setIsEditingDescription(false);
          } else {
            const errorData = await res.json();
            throw new Error(errorData.error || `Nepovedlo se změnit popisek zkus to prosím znovu: ${res.status}`); 
          }
        } catch (error: unknown) {
          console.error("Failed to update description:", error);
          toast.error("Nepovedlo se změnit popisek zkus to prosím znovu."); 
        }
      };

      const handleCancelEdit = () => {
        setNewDescription(post.description || "");
        setIsEditingDescription(false);
      };

      const handleReport = async (reason: string) => {
        if (!token) return;
        
        try {
            const res = await fetch(`/${student}/api/protected/photos/${post.id}/report`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ reason }),
            });
            
            if (res.ok) {
                toast.success("Příspěvek byl úspěšně nahlášen.");
                setHasReported(true);
                closeReportModal();
            } else {
                const errorData = await res.json();
                throw new Error(errorData.message || `Failed to report: ${res.status}`);
            }
        } catch (error) {
            console.error("Failed to report post:", error);
            toast.error("Nepodařilo se nahlásit příspěvek. Zkuste to prosím znovu.");
        }
    };

    const isOwner = post.userId === userId;

  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-4" data-test-id={`post-${post.id}`}>
        <div className="flex justify-between items-center text-black mb-2">
            <Link href={`/${student}/profile/${post.userId}`} className="text-black" data-test-id={`post-author-${post.id}`}>
                {showUsernameInsteadOfId ? post.username : post.userId}
            </Link>
            <div className="flex space-x-2">
                    {!isOwner && !post.userReported && !hasReported && deleteInsteadReportFixed && (
                        <button
                            className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
                            onClick={openReportModal}
                            data-test-id={`post-report-${post.id}`}
                        >
                            ⚠️ Nahlásit
                        </button>
                    )}
                    {(isOwner || !deleteInsteadReportFixed) && (
                        <button
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                            onClick={() => openDeleteModal(post.id)}
                            data-test-id={`post-delete-${post.id}`}
                        >
                            🗑️ Smazat příspěvek
                        </button>
                    )}
                </div>
        </div>
        <div className="relative w-full h-[300px]">
            <Image
                src={post.imageUrl}
                alt="Post Image"
                fill
                className="object-contain rounded-lg cursor-pointer hover:scale-105 transition"
                onClick={() => openImageModal(post.imageUrl)}
                priority={true}
                data-test-id={`post-image-${post.id}`}
            />
        </div>
        <div className="flex items-center justify-between mt-2">
            <p className="text-gray-500" data-test-id={`post-likes-${post.id}`}>{likesCount} 💙</p>
        </div>
        <div className="flex mt-2">
            <button
                onClick={toggleLike}
                className="flex-1 bg-pink-700 text-white py-2 rounded-r-lg text-sm font-semibold"
                data-test-id={`post-like-toggle-${post.id}`}
            >
                {userLiked ? "Unlike 💙" : "Like 🤍"}
            </button>
        </div>
        <div className="mt-2">
        {isEditingDescription ? (
          <div>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full border rounded p-1 text-black"
              data-test-id={`post-description-edit-${post.id}`}
            />
            <button onClick={handleSaveDescription} className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded mr-2" data-test-id={`post-description-save-${post.id}`}>
              Uložit
            </button>
            <button onClick={handleCancelEdit} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded" data-test-id={`post-description-cancel-${post.id}`}>
              Zrušit
            </button>
          </div>
        ) : (
          <div className="flex items-center">
            <p className="text-gray-700 flex-grow" data-test-id={`post-description-${post.id}`}>
              {post.description ? post.description : <em>Uživatel byl líný vymyslet popisek!</em>}
            </p>
            {isOwner && (
              <button onClick={handleEditDescription} className="text-blue-500 hover:text-blue-700 ml-2" data-test-id={`post-description-open-edit-${post.id}`}>
                ✏️ Upravit
              </button>
            )}
          </div>
        )}
      </div>

      {isImageModalOpen && (
        <ImageModal src={modalImageSrc} onClose={closeImageModal} />
      )}
      <ReportModal 
                isOpen={isReportModalOpen}
                onClose={closeReportModal}
                onConfirm={handleReport}
      />
      <DeletePostModal isOpen={isModalOpen} onClose={closeDeleteModal} onConfirm={deletePhoto} />
    </div>
);
}
