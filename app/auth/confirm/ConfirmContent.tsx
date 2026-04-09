"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export default function ConfirmContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const token_hash = searchParams.get("token")

    if (!token_hash) {
      setStatus("error")
      setMessage("Invalid confirmation link")
      return
    }

    const verifyEmail = async () => {
      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'signup',
        })

        if (error) {
          setStatus("error")
          setMessage(error.message)
        } else {
          setStatus("success")
          setMessage("Your email has been verified successfully!")
          
          setTimeout(() => {
            router.push("/login?verified=true")
          }, 3000)
        }
      } catch {
        setStatus("error")
        setMessage("Failed to verify email. Please try again.")
      }
    }

    verifyEmail()
  }, [searchParams, router])

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
          <h1 className="text-2xl font-bold text-gray-900">Email Verification</h1>
        </div>

        {status === "loading" && (
          <div className="py-8">
            <Loader2 size={48} className="animate-spin text-[#4F6DF5] mx-auto mb-4" />
            <p className="text-gray-600">Verifying your email...</p>
          </div>
        )}

        {status === "success" && (
          <div className="py-8">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <p className="text-gray-800 font-medium mb-2">{message}</p>
            <p className="text-sm text-gray-500 mb-4">Redirecting to login page in 3 seconds...</p>
            <Link
              href="/login?verified=true"
              className="text-[#4F6DF5] hover:underline font-medium"
            >
              Go to Login →
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="py-8">
            <XCircle size={48} className="text-red-500 mx-auto mb-4" />
            <p className="text-gray-800 font-medium mb-2">{message}</p>
            <Link
              href="/register"
              className="text-[#4F6DF5] hover:underline font-medium"
            >
              Back to Registration →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}