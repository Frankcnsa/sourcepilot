import { Suspense } from "react"
import ConfirmContent from "./ConfirmContent"

// 禁用静态生成
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function ConfirmPage() {
  return (
    <Suspense fallback={
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
          <div className="py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4F6DF5] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <ConfirmContent />
    </Suspense>
  )
}