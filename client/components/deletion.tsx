"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { fetchWithAuth } from "@/lib/auth";

export default function DeletionComponent() {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleAccountDeletion = async () => {
    // Require typing "DELETE" to confirm
    if (confirmText !== "DELETE") {
      toast.error('Please type "DELETE" to confirm account deletion.');
      return;
    }
    function deleteAllCookies() {
    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const name = cookie.split("=")[0].trim();
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
    }
}   

    setIsDeleting(true);

    try {
      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/client/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Account deleted successfully.');
        // Clear any local storage/session data
        localStorage.clear();
        sessionStorage.clear()
        deleteAllCookies();
        setIsDeleting(false);
        // Redirect to homepage or goodbye page
        router.push('/');

        // router.push('/goodbye');
      } else {
        const errorData = await response.json();
        toast.error(`Error: ${errorData.message || 'Failed to delete account'}`);
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Account deletion error:', error);
      toast.error('An unexpected error occurred. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleLogout = () => {
    // Implement logout logic or redirect
    router.push('/logout');
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative overflow-hidden font-[inter] bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 mx-auto text-center">
          Account Deletion
        </h1>

        {!showConfirmDialog ? (
          <div className="space-y-4">
            <button
              onClick={() => setShowConfirmDialog(true)}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              Delete Account
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="confirm-text"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Type <span className="font-bold">DELETE</span> to confirm
              </label>
              <input
                id="confirm-text"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="DELETE"
                disabled={isDeleting}
                autoComplete="off"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAccountDeletion}
                disabled={isDeleting || confirmText !== "DELETE"}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Deleting...
                  </span>
                ) : (
                  'Confirm Deletion'
                )}
              </button>
              
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setConfirmText("");
                }}
                disabled={isDeleting}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}