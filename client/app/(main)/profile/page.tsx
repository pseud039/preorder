"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { fetchWithAuth } from "@/lib/auth";
import { getInitials } from "@/utils/text.utils";

interface UserProfile {
  name: string | null;
  email: string;
  phone: string | null;
  avatar?: string | null;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setLoadFailed(false);

      const response = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/client/details`,
      );
      const data = await response.json();

      if (data.success && data.data) {
        setUser(data.data);
        setFormData({
          name: data.data.name || "",
          phone: data.data.phone || "",
        });
        return;
      }

      setUser(null);
      setLoadFailed(true);
    } catch (error) {
      console.error("Error fetching user details:", error);
      setUser(null);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const initials = user?.name ? getInitials(user?.name) : "U";

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const nextName = formData.name.trim();
      const nextPhone = formData.phone.trim();

      const response = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/client/details`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: nextName,
            phone: nextPhone,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setUser((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            ...data.data,
            name: nextName || null,
            phone: nextPhone || null,
          };
        });
        setFormData({ name: nextName, phone: nextPhone });
        setEditMode(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setFormData({
      name: user?.name || "",
      phone: user?.phone || "",
    });
  };

  return (
    <div className="max-w-md mx-auto relative overflow-hidden font-[inter] bg-gray-50">
      {/* Background Decorations */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/50 rounded-full blur-3xl opacity-30 -mr-32 -mt-32"></div>
      <div className="absolute top-40 left-0 w-64 h-64 bg-primary/30 rounded-full blur-3xl opacity-30 -ml-32"></div>

      <div className="relative z-10 px-6 pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Manage Account
          </h1>
          <p className="text-gray-600">Manage your profile</p>
        </div>

        <div className="space-y-3">
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            {loading ? (
              <div className="animate-pulse">
                <div className="mb-4 flex flex-col items-center justify-center">
                  <div className="h-24 w-24 rounded-full bg-gray-200" />
                  <div className="mt-3 h-3 w-24 rounded bg-gray-200" />
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="h-3 w-16 rounded bg-gray-200" />
                    <div className="mt-2 h-9 w-full rounded-lg bg-gray-200" />
                  </div>
                  <div>
                    <div className="h-3 w-16 rounded bg-gray-200" />
                    <div className="mt-2 h-5 w-4/5 rounded bg-gray-200" />
                  </div>
                  <div>
                    <div className="h-3 w-24 rounded bg-gray-200" />
                    <div className="mt-2 h-9 w-full rounded-lg bg-gray-200" />
                  </div>
                </div>
              </div>
            ) : loadFailed || !user ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
                <p className="text-sm font-semibold text-amber-900">
                  Profile could not be loaded
                </p>
                <p className="mt-1 text-xs text-amber-800">
                  Please try again. Your network or session may have expired.
                </p>
                <button
                  type="button"
                  onClick={fetchUserDetails}
                  className="mt-3 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white"
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                    Profile
                  </p>
                  {!editMode ? (
                    <button
                      type="button"
                      onClick={() => setEditMode(true)}
                      className="text-xs font-semibold text-primary"
                    >
                      Edit
                    </button>
                  ) : null}
                </div>

                <div className="mb-4 flex flex-col items-center justify-center text-center">
                  <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-orange-100 shadow-md ring-1 ring-primary/20">
                    {user.avatar ? (
                      <Image
                        src={user.avatar}
                        alt="Profile picture"
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-orange-300 to-primary text-2xl font-bold text-white">
                        {getInitials(user.name || "U")}
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-xs font-medium text-gray-500">
                    Profile Picture
                  </p>
                </div>

                <div className="divide-y divide-gray-100">
                  <div className="py-3">
                    <p className="text-xs text-gray-500">Name</p>
                    {editMode ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            name: event.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 focus:border-primary focus:outline-none"
                        placeholder="Enter your name"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900">
                        {user.name || "Not set"}
                      </p>
                    )}
                  </div>

                  <div className="py-3">
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900 break-all">
                      {user.email || "Not set"}
                    </p>
                  </div>

                  <div className="py-3">
                    <p className="text-xs text-gray-500">Phone Number</p>
                    {editMode ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            phone: event.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 focus:border-primary focus:outline-none"
                        placeholder="Enter your phone number"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900">
                        {user.phone || "Not set"}
                      </p>
                    )}
                  </div>
                </div>

                {editMode ? (
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
