'use client'

import { useState } from 'react'
import {
  Instagram, MapPin, Mail, CheckCircle2, ExternalLink,
  BarChart2, Bell, Globe, ChevronRight, Save
} from 'lucide-react'

type Tab = 'redes' | 'mapas' | 'email'

// ── Tipos ─────────────────────────────────────────────────────
type RedesState = {
  instagram: string
  facebook: string
  tiktok: string
  autoPublish: boolean
}

type MapasState = {
  nombre: string
  direccion: string
  telefono: string
  sitioWeb: string
  googleMapsUrl: string
  wazeUrl: string
  horaApertura: string
  horaCierre: string
}

type EmailState = {
  emailSoporte: string
  plantillaConfirmacion: boolean
  plantillaAlertaStock: boolean
  plantillaVencimientoApartado: boolean
  plantillaOrdenProduccion: boolean
}

type SaveStatus = 'idle' | 'saving' | 'saved'

// ── Componente ────────────────────────────────────────────────
export default function MarketingPage() {
  const [tab, setTab] = useState<Tab>('redes')

  const [redes, setRedes] = useState<RedesState>({
    instagram: '@lacasadelpez',
    facebook: 'La Casa del Pez',
    tiktok: '',
    autoPublish: true,
  })

  const [mapas, setMapas] = useState<MapasState>({
    nombre: 'La Casa del Pez',
    direccion: 'San José, Costa Rica',
    telefono: '+506 2222-3333',
    sitioWeb: 'https://lacasadelpez.cr',
    googleMapsUrl: '',
    wazeUrl: '',
    horaApertura: '08:00',
    horaCierre: '18:00',
  })

  const [emailCfg, setEmailCfg] = useState<EmailState>({
    emailSoporte: 'soporte@lacasadelpez.cr',
    plantillaConfirmacion: true,
    plantillaAlertaStock: true,
    plantillaVencimientoApartado: true,
    plantillaOrdenProduccion: false,
  })

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  const handleSave = () => {
    setSaveStatus('saving')
    setTimeout(() => {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2200)
    }, 800)
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'redes',  label: 'Redes sociales', icon: <BarChart2 className="h-4 w-4" /> },
    { key: 'mapas',  label: 'Mapas y ubicación', icon: <MapPin className="h-4 w-4" /> },
    { key: 'email',  label: 'Alertas por email', icon: <Mail className="h-4 w-4" /> },
  ]

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-500">Administración</p>
            <h1 className="text-2xl font-bold text-slate-800">Marketing Digital</h1>
            <p className="text-sm text-slate-500 mt-1">
              Configura redes sociales, visibilidad en mapas y alertas automáticas por email.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="flex items-center gap-2 rounded-lg bg-[#006f95] px-4 py-2 text-sm font-medium text-white hover:bg-[#005f80] disabled:opacity-60 transition-colors"
          >
            {saveStatus === 'saving' ? (
              <>Guardando…</>
            ) : saveStatus === 'saved' ? (
              <><CheckCircle2 className="h-4 w-4" /> Guardado</>
            ) : (
              <><Save className="h-4 w-4" /> Guardar cambios</>
            )}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border bg-white p-1 shadow-sm">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-[#006f95] text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── REDES SOCIALES (#60) ── */}
        {tab === 'redes' && (
          <div className="space-y-4">
            <div className="rounded-xl border bg-white p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b pb-4">
                <Instagram className="h-5 w-5 text-pink-500" />
                <h2 className="font-semibold text-slate-800">Cuentas conectadas</h2>
              </div>

              {/* Instagram */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Instagram
                </label>
                <div className="flex gap-2">
                  <input
                    value={redes.instagram}
                    onChange={e => setRedes(r => ({ ...r, instagram: e.target.value }))}
                    placeholder="@usuario"
                    className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006f95]"
                  />
                  {redes.instagram && (
                    <a
                      href={`https://instagram.com/${redes.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-md border px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Facebook */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Facebook
                </label>
                <input
                  value={redes.facebook}
                  onChange={e => setRedes(r => ({ ...r, facebook: e.target.value }))}
                  placeholder="Nombre de página"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006f95]"
                />
              </div>

              {/* TikTok */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  TikTok <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  value={redes.tiktok}
                  onChange={e => setRedes(r => ({ ...r, tiktok: e.target.value }))}
                  placeholder="@usuario"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006f95]"
                />
              </div>
            </div>

            {/* Estadísticas (UI estática - #60) */}
            <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
              <h2 className="font-semibold text-slate-800 border-b pb-3">
                Estadísticas de redes sociales
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Seguidores Instagram', value: '1,240' },
                  { label: 'Alcance semanal', value: '4,820' },
                  { label: 'Interacciones', value: '312' },
                ].map(stat => (
                  <div key={stat.label} className="rounded-lg bg-slate-50 p-4 text-center">
                    <p className="text-2xl font-bold text-[#006f95]">{stat.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <BarChart2 className="h-3.5 w-3.5" />
                Datos de ejemplo. Conecta tu cuenta para ver estadísticas reales.
              </p>
            </div>

            {/* Publicación automática */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">Publicación automática</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Publicar en redes cuando se agregue un nuevo producto al catálogo.
                  </p>
                </div>
                <button
                  onClick={() => setRedes(r => ({ ...r, autoPublish: !r.autoPublish }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    redes.autoPublish ? 'bg-[#006f95]' : 'bg-slate-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    redes.autoPublish ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MAPAS Y UBICACIÓN (#61 Google Maps + #62 Waze) ── */}
        {tab === 'mapas' && (
          <div className="space-y-4">
            <div className="rounded-xl border bg-white p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b pb-4">
                <Globe className="h-5 w-5 text-[#006f95]" />
                <h2 className="font-semibold text-slate-800">Información de la tienda</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del negocio</label>
                  <input value={mapas.nombre} onChange={e => setMapas(m => ({ ...m, nombre: e.target.value }))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006f95]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                  <input value={mapas.telefono} onChange={e => setMapas(m => ({ ...m, telefono: e.target.value }))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006f95]" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dirección exacta</label>
                  <input value={mapas.direccion} onChange={e => setMapas(m => ({ ...m, direccion: e.target.value }))}
                    placeholder="Ej: 100m norte del Parque Central, San José"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006f95]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sitio web</label>
                  <input value={mapas.sitioWeb} onChange={e => setMapas(m => ({ ...m, sitioWeb: e.target.value }))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006f95]" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Apertura</label>
                    <input type="time" value={mapas.horaApertura} onChange={e => setMapas(m => ({ ...m, horaApertura: e.target.value }))}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006f95]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cierre</label>
                    <input type="time" value={mapas.horaCierre} onChange={e => setMapas(m => ({ ...m, horaCierre: e.target.value }))}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006f95]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Links de mapas */}
            <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
              <h2 className="font-semibold text-slate-800 border-b pb-3">Links en plataformas de mapas</h2>

              {/* Google Maps */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1">
                  <MapPin className="h-4 w-4 text-red-500" /> Google Maps — URL del perfil
                </label>
                <div className="flex gap-2">
                  <input
                    value={mapas.googleMapsUrl}
                    onChange={e => setMapas(m => ({ ...m, googleMapsUrl: e.target.value }))}
                    placeholder="https://maps.google.com/?q=..."
                    className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006f95]"
                  />
                  {mapas.googleMapsUrl && (
                    <a href={mapas.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-md border px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Registra tu negocio en <a href="https://business.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Business Profile</a> y pega el link aquí.
                </p>
              </div>

              {/* Waze */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1">
                  <MapPin className="h-4 w-4 text-sky-500" /> Waze — URL del negocio
                </label>
                <div className="flex gap-2">
                  <input
                    value={mapas.wazeUrl}
                    onChange={e => setMapas(m => ({ ...m, wazeUrl: e.target.value }))}
                    placeholder="https://waze.com/ul?..."
                    className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006f95]"
                  />
                  {mapas.wazeUrl && (
                    <a href={mapas.wazeUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-md border px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Registra en <a href="https://www.waze.com/en/business" target="_blank" rel="noopener noreferrer" className="underline">Waze for Business</a> y pega el link aquí.
                </p>
              </div>
            </div>

            {/* Vista previa de la tarjeta de ubicación */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-800 border-b pb-3 mb-4">Vista previa en el sitio web</h2>
              <div className="rounded-lg bg-slate-50 border p-4 space-y-2">
                <p className="font-semibold text-slate-800">{mapas.nombre || 'La Casa del Pez'}</p>
                <p className="text-sm text-slate-500 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {mapas.direccion || 'Dirección no configurada'}
                </p>
                <p className="text-sm text-slate-500">📞 {mapas.telefono}</p>
                <p className="text-sm text-slate-500">🕐 {mapas.horaApertura} – {mapas.horaCierre}</p>
                <div className="flex gap-2 pt-2">
                  {mapas.googleMapsUrl ? (
                    <a href={mapas.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-md bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100">
                      <MapPin className="h-3.5 w-3.5" /> Google Maps <ChevronRight className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="rounded-md bg-slate-100 px-3 py-1.5 text-xs text-slate-400">Google Maps no configurado</span>
                  )}
                  {mapas.wazeUrl ? (
                    <a href={mapas.wazeUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-md bg-sky-50 border border-sky-200 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100">
                      <MapPin className="h-3.5 w-3.5" /> Waze <ChevronRight className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="rounded-md bg-slate-100 px-3 py-1.5 text-xs text-slate-400">Waze no configurado</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ALERTAS POR EMAIL (#67) ── */}
        {tab === 'email' && (
          <div className="space-y-4">
            <div className="rounded-xl border bg-white p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b pb-4">
                <Mail className="h-5 w-5 text-[#006f95]" />
                <h2 className="font-semibold text-slate-800">Configuración de email</h2>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email de soporte / remitente
                </label>
                <input
                  type="email"
                  value={emailCfg.emailSoporte}
                  onChange={e => setEmailCfg(c => ({ ...c, emailSoporte: e.target.value }))}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006f95]"
                />
              </div>
            </div>

            {/* Plantillas / alertas */}
            <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
              <h2 className="font-semibold text-slate-800 border-b pb-3">Plantillas automáticas</h2>
              <p className="text-sm text-slate-500">
                Activa los emails que el sistema enviará automáticamente según los eventos del negocio.
              </p>

              {[
                {
                  key: 'plantillaConfirmacion' as keyof EmailState,
                  icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
                  title: 'Confirmación de compra',
                  desc: 'Se envía al cliente al completar una venta online o en POS.',
                },
                {
                  key: 'plantillaAlertaStock' as keyof EmailState,
                  icon: <Bell className="h-4 w-4 text-amber-500" />,
                  title: 'Alerta de stock bajo',
                  desc: 'Notifica al administrador cuando una especie baja del mínimo.',
                },
                {
                  key: 'plantillaVencimientoApartado' as keyof EmailState,
                  icon: <Bell className="h-4 w-4 text-orange-500" />,
                  title: 'Vencimiento de apartado',
                  desc: 'Alerta automática 24h antes de que venza un apartado.',
                },
                {
                  key: 'plantillaOrdenProduccion' as keyof EmailState,
                  icon: <Mail className="h-4 w-4 text-[#006f95]" />,
                  title: 'Cambio de estado en orden de producción',
                  desc: 'Notifica al cliente cuando su pecera avanza de etapa.',
                },
              ].map(item => (
                <div key={item.key} className="flex items-start justify-between gap-4 rounded-lg border p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{item.icon}</div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEmailCfg(c => ({ ...c, [item.key]: !c[item.key] }))}
                    className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                      emailCfg[item.key] ? 'bg-[#006f95]' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                      emailCfg[item.key] ? 'translate-x-4' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              ))}
            </div>

            {/* Info */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
              <p className="font-medium mb-1">📌 Nota de integración</p>
              <p className="text-xs leading-relaxed">
                Para activar el envío real de emails, configura las variables de entorno
                <code className="mx-1 rounded bg-blue-100 px-1 py-0.5 font-mono">RESEND_API_KEY</code>
                o el proveedor SMTP de tu preferencia en el servidor.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
