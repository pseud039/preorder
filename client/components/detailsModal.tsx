import React, { useState } from "react";
import { X, User, Phone, Loader2 } from "lucide-react";
import { fetchWithAuth } from "@/lib/auth";

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: { name: string; phone: string }) => void;
}

export default function UserDetailsModal({
  isOpen,
  onClose,
  onSuccess,
}: UserDetailsModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!phone.trim() || phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError("Please enter a valid Indian phone number");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");

      const response = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/client/details`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ name, phone }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update details");
      }

      onSuccess({ name: name.trim(), phone: phone.trim() });
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "Failed to save details");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal - Bottom Sheet */}
      <div className="fixed bottom-0 pb-20 left-0 right-0 bg-white rounded-t-3xl z-50 max-w-md mx-auto shadow-2xl animate-slide-up">
        {/* Handle Bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            Enter Your Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            We need these details to process your order
          </p>

          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full pl-11 pr-4 py-3 border text-gray-700  border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Phone Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <div className="absolute left-11 top-1/2 -translate-y-1/2 text-gray-600 font-medium">
                +91
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length <= 10) setPhone(val);
                }}
                placeholder="Enter your phone number"
                className="w-full pl-20 pr-4 py-3 border  text-gray-700 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                disabled={loading}
                maxLength={10}
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              We&apos;ll send an OTP to verify your number{" "}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              "Continue to Verification"
            )}
          </button>
        </form>
      </div>
    </>
  );
}
