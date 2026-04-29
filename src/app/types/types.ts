export interface Photo {
    id: number;
    userId: string;
    createdAt: Date;
    likesCount: number;
    userLiked: boolean;
    userReported: boolean;
    imageUrl: string;
    username: string;
    description: string | null;
  }
  