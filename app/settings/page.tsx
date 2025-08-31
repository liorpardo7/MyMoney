import { SettingsContent } from '@/components/settings/settings-content'

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your vault, API keys, and application preferences
        </p>
      </div>
      
      <SettingsContent />
    </div>
  )
}