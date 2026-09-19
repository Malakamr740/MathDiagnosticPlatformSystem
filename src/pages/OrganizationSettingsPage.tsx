import React from 'react'
import AdminLayout from '../components/AdminLayout'
import { Save } from 'lucide-react'

export const OrganizationSettingsPage: React.FC = () => {
  return (
    <AdminLayout
      title="Organization & System Settings"
      subtitle="Configure school metadata, diagnostic grading scales, and report branding"
    >
      <div className="max-w-2xl bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700">Institution Name</label>
          <input
            type="text"
            defaultValue="Mathematics Department & Diagnostic Center"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700">Default Mastery Cutoff (%)</label>
          <input
            type="number"
            defaultValue={75}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}

export default OrganizationSettingsPage
