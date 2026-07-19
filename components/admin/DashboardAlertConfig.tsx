'use client'

// RF: Como administrador quiero configurar qué alertas veo en el dashboard

import { useEffect, useState } from 'react'
import { Settings2, RotateCcw, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/actions/button'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/overlays/dialog'
import { Switch } from '@/components/ui/forms/switch'
import {
  type AlertConfig,
  DEFAULT_ALERT_CONFIGS,
  loadAlertConfig,
  saveAlertConfig,
} from '@/lib/dashboard-alerts-config'

interface Props {
  onConfigChange?: (configs: AlertConfig[]) => void
}

export function DashboardAlertConfig({ onConfigChange }: Props) {
  const [open, setOpen] = useState(false)
  const [configs, setConfigs] = useState<AlertConfig[]>(DEFAULT_ALERT_CONFIGS)
  const [saved, setSaved] = useState(false)

  // Cargar configuración guardada al abrir
  useEffect(() => {
    if (open) {
      setConfigs(loadAlertConfig())
      setSaved(false)
    }
  }, [open])

  function toggle(key: string) {
    setConfigs(prev => prev.map(c => c.key === key ? { ...c, enabled: !c.enabled } : c))
  }

  function handleReset() {
    setConfigs(DEFAULT_ALERT_CONFIGS)
  }

  function handleSave() {
    saveAlertConfig(configs)
    onConfigChange?.(configs)
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      setOpen(false)
    }, 1000)
  }

  const enabledCount = configs.filter(c => c.enabled).length

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Configurar alertas
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium">
            {enabledCount}/{configs.length}
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar alertas del dashboard</DialogTitle>
          <DialogDescription>
            Elegí qué alertas querés ver en el panel de resumen. Los cambios se guardan localmente.
          </DialogDescription>
        </DialogHeader>

        <div className="divide-y divide-border">
          {configs.map((cfg) => (
            <div key={cfg.key} className="flex items-start gap-4 py-3">
              <Switch
                checked={cfg.enabled}
                onCheckedChange={() => toggle(cfg.key)}
                id={`alert-${cfg.key}`}
                className="mt-0.5 shrink-0"
              />
              <label
                htmlFor={`alert-${cfg.key}`}
                className="flex-1 cursor-pointer"
              >
                <p className="text-sm font-medium text-foreground">{cfg.label}</p>
                <p className="text-xs text-muted-foreground">{cfg.description}</p>
              </label>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-3.5 w-3.5" />
            Restablecer
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="gap-2">
              {saved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Guardado
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
