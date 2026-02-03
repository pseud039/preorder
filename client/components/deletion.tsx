"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { fetchWithAuth } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
    
    // function deleteAllCookies() {
    //   const cookies = document.cookie.split(";");

    //   for (let i = 0; i < cookies.length; i++) {
    //     const cookie = cookies[i];
    //     const name = cookie.split("=")[0].trim();
    //     document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
    //   }
    // }

    setIsDeleting(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/client/delete-account`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      if (response.ok) {
        toast.success("Account deleted successfully.");
        localStorage.clear();
        sessionStorage.clear();
        // deleteAllCookies();
        setIsDeleting(false);
        router.push("/");
        // router.push('/goodbye');
      } else {
        const errorData = await response.json();
        toast.error(
          `Error: ${errorData.message || "Failed to delete account"}`,
        );
        setIsDeleting(false);
      }
      // if(response.status === 401) {
      //   toast.error('Session expired. Please log in again.');
      //   setIsDeleting(false);
      // }
      //   router.push('/login');
    } catch (error) {
      console.error("Account deletion error:", error);
      toast.error("Session expired. Please log in again.");
      setIsDeleting(false);
      router.push("/login");
    }
  };

  const handleLogout = () => {
    // Implement logout logic or redirect
    router.push("/logout");
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative overflow-hidden font-[inter] bg-gray-50 flex items-center justify-center p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Delete Account
        </h1>

        <div className="mb-6 space-y-2 text-gray-600">
          <p className="text-sm">
            Once you delete your account, we will not be able to restore it
            back.
          </p>
          <p className="text-sm">
            It may take up to 4 weeks for your data to be completely deleted
            from our servers.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setShowConfirmDialog(true)}
            className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors font-medium"
          >
            Delete Account
          </button>

          <button
            onClick={handleLogout}
            className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
          >
            Logout
          </button>
        </div>

        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">
                Are you sure you want to delete your account?
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="border-2 border-orange-200 bg-orange-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="text-sm text-orange-800">
                    <p className="font-semibold mb-1">
                      Warning: This action is irreversible
                    </p>
                    <p>
                      Your account and all associated data will be permanently
                      deleted and cannot be recovered.
                    </p>
                  </div>
                </div>
              </div>

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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="DELETE"
                  disabled={isDeleting}
                  autoComplete="off"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAccountDeletion}
                  disabled={isDeleting || confirmText !== "DELETE"}
                  className="flex-1 bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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
                    "Confirm Deletion"
                  )}
                </button>

                <button
                  onClick={() => {
                    setShowConfirmDialog(false);
                    setConfirmText("");
                  }}
                  disabled={isDeleting}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
