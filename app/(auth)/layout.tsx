import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-elimu-700 to-elimu-500 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl text-elimu-800">ElimuConnect</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>
      <footer className="text-center text-xs text-gray-400 py-4">
        © {new Date().getFullYear()} ElimuConnect — Connecting Learners to Excellence
      </footer>
    </div>
  )
}
