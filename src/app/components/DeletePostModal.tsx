interface DeletePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeletePostModal: React.FC<DeletePostModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[999]" data-test-id="delete-post-modal">
      <div className="bg-white p-4 rounded-lg shadow-lg text-black">
        <p className="text-lg font-semibold">Opravdu chcete smazat příspěvek?</p>
        <div className="flex justify-end mt-4 space-x-2">
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-pink-500 rounded-lg hover:bg-pink-600"
            data-test-id="delete-post-confirm"
          >
            ano
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
            data-test-id="delete-post-cancel"
          >
            ne
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeletePostModal;
