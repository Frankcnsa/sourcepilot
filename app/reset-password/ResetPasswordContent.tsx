"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2, CheckCircle, XCircle } from "lucide-react"

export default function ResetPasswordContent() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // 从 URL 获取 token
  const token = searchParams.get("token")

  useEffect(() => {
    if (!token) {
      setError("Invalid or expired reset link")
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    if (!token) {
      setError("Invalid or expired reset link")
      setLoading(false)
      return
    }

    try {
      // 先验证 recovery token
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery',
      })

      if (verifyError) {
        setError(verifyError.message)
        setLoading(false)
        return
      }

      // 验证成功后更新密码
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccess(true)
        // 3秒后跳转到登录页
        setTimeout(() => {
          router.push("/login?reset=success")
        }, 3000)
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // 没有 token 时显示错误
  if (!token && error) {
    return (
      <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 relative">
              <img
                src="/sourcepilot-icon.png"
                alt="SourcePilot"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          </div>
          <div className="py-8">
            <XCircle size={48} className="text-red-500 mx-auto mb-4" />
            <p className="text-gray-800 font-medium mb-2">{error}</p>
            <Link
              href="/forgot-password"
              className="text-[#4F6DF5] hover:underline font-medium"
            >
              Request new link →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 重置成功
  if (success) {
    return (
      <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 relative">
              <img
                src="/sourcepilot-icon.png"
                alt="SourcePilot"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Password Reset</h1>
          </div>
          <div className="py-8">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <p className="text-gray-800 font-medium mb-2">Password reset successfully!</p>
            <p className="text-sm text-gray-500 mb-4">Redirecting to login page in 3 seconds...</p>
            <Link
              href="/login"
              className="text-[#4F6DF5] hover:underline font-medium"
            >
              Go to Login →
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
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your new password
          </p>
        </div>

        {/* Reset Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F6DF5] focus:border-transparent transition-all text-base pr-12"
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F6DF5] focus:border-transparent transition-all text-base"
                placeholder="Confirm your new password"
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
                  Resetting...
                </>
              ) : (
                "Reset Password"
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