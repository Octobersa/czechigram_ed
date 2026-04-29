"use client";

import {useState} from "react";
import {Bugs} from "@/app/lib/bugs";
import {useBugStatus} from "@/app/context/BugStatusContext";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export default function ReportModal({ isOpen, onClose, onConfirm }: ReportModalProps) {
  const [reason, setReason] = useState("");
  const { getBugStatus: getContextBugStatus } = useBugStatus();
  const isDescriptionOptional = getContextBugStatus(Bugs.REPORT_DESCRIPTION_NOT_OPTIONAL.id) ?? true;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(reason);
    setReason("");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-test-id="report-modal">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-black">Nahlásit příspěvek</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="reason" className="block text-gray-700 mb-2">
              Důvod nahlášení: (nepovinné)
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border rounded p-2 text-black"
              rows={4}
              placeholder="Zadejte důvod nahlášení..."
              required={!isDescriptionOptional}
              data-test-id="report-reason-input"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              data-test-id="report-modal-cancel"
            >
              Zrušit
            </button>
            <button
              type="submit"
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              data-test-id="report-modal-submit"
            >
              Nahlásit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
