"use client";
import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  LogOut,
  Edit2,
  Check,
  X,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { getInitials } from "@/utils/text.utils";

interface UserData {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
}

export default function Account() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const getTruncatedEmail = (email: string): string => {
    const [localPart, domain] = email.split("@");

    if (!domain || localPart.length <= 10) return email;

    return `${localPart.slice(0, 2)}..${localPart.slice(-2)}@${domain}`;
  };

  const fetchUserDetails = async () => {
    try {
      const response = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/client/details`,
      );
      const data = await response.json();

      if (data.success) {
        setUser(data.data);
        setFormData({
          name: data.data.name || "",
          phone: data.data.phone || "",
        });
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user details:", error);
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      const response = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/client/details`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        },
      );

      const data = await response.json();

      if (data.success) {
        // Merge the response data with existing user data to preserve all fields
        setUser((prevUser) => ({
          ...prevUser,
          ...data.data,
          // Explicitly preserve verification statuses if not in response
          emailVerified:
            data.data.emailVerified ?? prevUser?.emailVerified ?? false,
          phoneVerified:
            data.data.phoneVerified ?? prevUser?.phoneVerified ?? false,
        }));
        setEditMode(false);
        toast.success("Profile updated successfully");
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/client/logout`);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.clear();
      router.push("/login");
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto relative overflow-hidden font-[inter] bg-gray-50">
      {/* Background Decorations */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/50 rounded-full blur-3xl opacity-30 -mr-32 -mt-32"></div>
      <div className="absolute top-40 left-0 w-64 h-64 bg-primary/30 rounded-full blur-3xl opacity-30 -ml-32"></div>

      <div className="relative z-10 px-6 pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Account</h1>
          <p className="text-gray-600">Manage your profile and preferences</p>
        </div>

        {/* <div className="bg-white rounded-3xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-linear-to-br from-orange-400 to-primary rounded-full flex items-center justify-center shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {user?.name || "User"}
                </h2>
                <p className="text-sm text-gray-500">Customer Account</p>
              </div>
            </div>
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Edit2 className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl">
              <User className="w-5 h-5 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <label className="text-xs text-gray-500 font-medium block mb-1">
                  Full Name
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Enter your name"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">
                    {user?.name || "Not set"}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl">
              <Mail className="w-5 h-5 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <label className="text-xs text-gray-500 font-medium block mb-1">
                  Email Address
                </label>
                <div className="flex items-center justify-between">
                  <p className="text-gray-900 font-medium">
                    {user?.email ? getTruncatedEmail(user.email) : ""}
                  </p>
                  {user?.emailVerified ? (
                    <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      <Check className="w-3 h-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                      <X className="w-3 h-3" />
                      Not Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl">
              <Phone className="w-5 h-5 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <label className="text-xs text-gray-500 font-medium block mb-1">
                  Phone Number
                </label>
                {editMode ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900 font-medium">
                      {user?.phone || "Not set"}
                    </p>
                    {user?.phoneVerified ? (
                      <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        <Check className="w-3 h-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                        <X className="w-3 h-3" />
                        Not Verified
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {editMode && (
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setEditMode(false);
                  setFormData({
                    name: user?.name || "",
                    phone: user?.phone || "",
                  });
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-2xl font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProfile}
                disabled={updating}
                className="flex-1 bg-primary text-white px-6 py-3 rounded-2xl font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {updating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div> */}

        <Link href="/profile">
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:bg-primary/10 cursor-pointer transition-colors duration-100">
            <div className="flex gap-4 items-center">
              {/* <div className="size-12 bg-linear-to-br from-orange-400/60 to-primary/60 rounded-full flex items-center justify-center shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div> */}
              <div className="flex size-12 items-center justify-center bg-linear-to-br from-orange-300 to-primary text-2xl font-bold text-white rounded-full shadow-lg">
                {getInitials(user?.name || "U")}
              </div>
              <div className="grow">
                <p className="">{user?.name}</p>
                <p className="text-gray-700 text-sm">
                  {getTruncatedEmail(user?.email || "")}
                </p>
              </div>

              <ChevronRight className="text-gray-400" />
            </div>
          </div>
        </Link>

        {/* Quick Actions */}
        <div className="space-y-3">
          {/* Notifications */}
          {/* <button
            onClick={() => router.push('/notifications')}
            className="w-full bg-white rounded-2xl shadow-md p-4 flex items-center justify-between hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Notifications</p>
                <p className="text-xs text-gray-500">Manage your alerts</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button> */}

          {/* Orders */}
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Orders
            </p>
            <div className="divide-y divide-gray-100">
              <Link
                href="/order-history"
                className="flex items-center justify-between py-3 text-sm text-gray-700 transition-colors hover:text-primary"
              >
                <span>My Orders</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Security - Change Password
          <button
            onClick={() => toast.info('Change password feature coming soon')}
            className="w-full bg-white rounded-2xl shadow-md p-4 flex items-center justify-between hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Security</p>
                <p className="text-xs text-gray-500">Change password</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button> */}
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Legal
          </p>
          <div className="divide-y divide-gray-100">
            <Link
              href="/privacy-policy"
              className="flex items-center justify-between py-3 text-sm text-gray-700 transition-colors hover:text-primary"
            >
              <span>Privacy Policy</span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
            <Link
              href="/terms-and-conditions"
              className="flex items-center justify-between py-3 text-sm text-gray-700 transition-colors hover:text-primary"
            >
              <span>Terms & Conditions</span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
            <Link
              href="/return-policy"
              className="flex items-center justify-between py-3 text-sm text-gray-700 transition-colors hover:text-primary"
            >
              <span>Return Policy</span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex justify-between items-center">
          <div>
            <h4 className="font-medium">Delete Account?</h4>
            <p className="text-sm text-gray-700">
              You can deactivate your account.
            </p>
          </div>
          <Button asChild>
            <Link href="/account-deletion">Delete</Link>
          </Button>
        </div>

        <button
          onClick={handleLogout}
          className="w-full mt-8 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-center gap-3 hover:bg-red-100 transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5 text-red-600" />
          <span className="font-semibold text-red-600">Logout</span>
        </button>
      </div>
    </div>
  );
}
