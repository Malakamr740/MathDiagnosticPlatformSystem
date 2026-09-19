import React, { useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import GlobalFloatingNavbar from './GlobalFloatingNavbar'
import { ChevronLeft, ArrowLeft, Home } from 'lucide-react'

interface AdminLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
  actions?: ReactNode
  showBackButton?: boolean
  backButtonPath?: string
}

export default function AdminLayout({
  children,
  title,
  subtitle,
  actions,
  showBackButton = true,
  backButtonPath,
}: AdminLayoutProps) {
  const { profile, session, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: '📊' },
    { label: 'Assessments', path: '/admin/assessments', icon: '📝' },
    { label: 'Question Bank', path: '/admin/questions', icon: '📚' },
    { label: 'Taxonomy (Units/Lessons)', path: '/admin/taxonomy', icon: '🏷️' },
    { label: 'Levels & Courses', path: '/admin/levels', icon: '🎯' },
    { label: 'Survey & Action Plans', path: '/admin/survey-action-plans', icon: '✨' },
    { label: 'Settings & Fields', path: '/admin/settings', icon: '⚙️' },
  ]

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(path)
  }

  const canGoBack = window.history.length > 1 && location.pathname !== '/admin'

  const handleBack = () => {
    if (backButtonPath) {
      navigate(backButtonPath)
    } else if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/admin')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans relative">
      {/* Global Persistent Hover-Reveal Navigation across all pages */}
      <GlobalFloatingNavbar />

      {/* Main Content Area (with slight left padding on md screens to accommodate collapsed nav indicator) */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-16 transition-all duration-300">
        {/* Top Header Bar */}
        {(title || actions || showBackButton) && (
          <header className="bg-white/95 backdrop-blur-xs border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sticky top-0 z-30 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              {showBackButton && (
                <button
                  type="button"
                  onClick={handleBack}
                  title="Go Back"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 hover:text-blue-600 transition shadow-2xs shrink-0"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline">Back</span>
                </button>
              )}

              <div className="min-w-0">
                {title && <h1 className="text-xl font-bold text-slate-900 truncate">{title}</h1>}
                {subtitle && <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>}
              </div>
            </div>

            {actions && <div className="flex items-center gap-2.5 flex-wrap shrink-0">{actions}</div>}
          </header>
        )}

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}
