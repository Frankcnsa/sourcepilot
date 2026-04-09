"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { Loader2, Mail, CheckCircle } from "lucide-react"

export default function ForgotPasswordContent() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setError(error.message)
      } else {
        setSent(true)
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // 邮件发送成功
  if (sent) {
    return (
      <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 relative">
              <img
                src="/sourcepilot-icon.png"
                alt="SourcePilot"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Check Your Email</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 text-center">
            <div className="py-8">
              <Mail size={48} className="text-[#4F6DF5] mx-auto mb-4" />
              <CheckCircle size={24} className="text-green-500 mx-auto -mt-8 mb-4 relative bg-white rounded-full" />
              <p className="text-gray-800 font-medium mb-2">Reset link sent!</p>
              <p className="text-sm text-gray-600 mb-3">
                We&apos;ve sent a password reset link to<br />
                <strong>{email}</strong>
              </p>
              <p className="text-xs text-gray-500">
                Please check your inbox and click the link to reset your password.
              </p>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-600">Didn&apos;t receive the email?</p>
                <button
                  onClick={() => {
                    setSent(false)
                    setEmail("")
                  }}
                  className="mt-2 text-[#4F6DF5] hover:underline text-sm font-medium"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 relative">
            <img
              src="/sourcepilot-icon.png"
              alt="SourcePilot"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Forgot Password?</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {/* Forgot Password Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F6DF5] focus:border-transparent transition-all text-base"
                placeholder="you@example.com"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#4F6DF5] text-white font-medium rounded-xl hover:bg-[#4353C7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>
        </div>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}