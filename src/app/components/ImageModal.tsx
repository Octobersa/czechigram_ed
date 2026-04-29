// ImageModal.tsx
"use client";

import Image from "next/image";

interface ImageModalProps {
  src: string;
  onClose: () => void;
}

const ImageModal = ({ src, onClose }: ImageModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center" data-test-id="image-modal">
      <div className="relative w-[90vw] h-[90vh]">
        <Image
          src={src}
          alt="Enlarged Image"
          fill
          className="object-contain rounded-lg"
          priority
        />
      </div>
      <button
        onClick={onClose}
        className="absolute top-2 right-2 z-10 bg-gray-800 text-white rounded-full p-2 hover:bg-gray-700"
        aria-label="Close modal"
        data-test-id="image-modal-close"
      >
        X
      </button>
    </div>
  );
};

export default ImageModal;
