import { useState } from 'react'
import QRCode from 'react-qr-code'
import { X, Printer, ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import type { Asset } from '../types'
import { useStore } from '../store'

// ─── Label layout definitions ─────────────────────────────────────────────────

export type LabelLayout = 'A' | 'B' | 'C' | 'D'

interface LayoutDef {
  id: LabelLayout
  name: string
  dimensions: string
  format: string
  description: string
  pageSize: string      // CSS @page size
  labelW: string        // tailwind width for preview
  labelH: string        // tailwind height for preview
  qrSize: number        // px
}

const LAYOUTS: LayoutDef[] = [
  {
    id: 'A',
    name: 'Lille label',
    dimensions: '62 × 29 mm',
    format: 'Brother DK-11209',
    description: 'Lille adresselabel — kode + QR',
    pageSize: '62mm 29mm',
    labelW: 'w-[186px]',
    labelH: 'h-[87px]',
    qrSize: 60,
  },
  {
    id: 'B',
    name: 'Kvadratisk label',
    dimensions: '62 × 62 mm',
    format: 'Brother DK-11241',
    description: 'Kvadratisk label — navn, kode + QR',
    pageSize: '62mm 62mm',
    labelW: 'w-[186px]',
    labelH: 'h-[186px]',
    qrSize: 80,
  },
  {
    id: 'C',
    name: 'Standard label',
    dimensions: '101 × 51 mm',
    format: 'Zebra / Dymo 4"×2"',
    description: 'Standard EU-label — navn, kode, beskrivelse + QR',
    pageSize: '101.6mm 50.8mm',
    labelW: 'w-[304px]',
    labelH: 'h-[152px]',
    qrSize: 90,
  },
  {
    id: 'D',
    name: 'A4 gitter',
    dimensions: 'A4 — 4 × 8 labels',
    format: 'Standard A4-ark',
    description: '32 labels per ark — bulk print',
    pageSize: 'A4',
    labelW: 'w-[158px]',
    labelH: 'h-[88px]',
    qrSize: 56,
  },
]

// ─── Individual label renderers ───────────────────────────────────────────────

interface LabelProps { asset: Asset; logo?: string; showLogo: boolean }

function LabelA({ asset }: LabelProps) {
  const qr = `MAINTAINIQ:${asset.id}`
  return (
    <div className="flex items-center gap-2 w-full h-full p-1.5 bg-white border border-gray-300 rounded">
      <QRCode value={qr} size={52} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-gray-900 truncate leading-tight">{asset.code}</p>
        <p className="text-[9px] text-gray-500 truncate">{asset.name}</p>
      </div>
    </div>
  )
}

function LabelB({ asset, logo, showLogo }: LabelProps) {
  const qr = `MAINTAINIQ:${asset.id}`
  return (
    <div className="flex flex-col items-center justify-center gap-1 w-full h-full p-2 bg-white border border-gray-300 rounded">
      <QRCode value={qr} size={showLogo && logo ? 64 : 80} />
      <p className="text-[11px] font-bold text-gray-900 text-center leading-tight mt-1">{asset.code}</p>
      <p className="text-[9px] text-gray-500 text-center truncate w-full px-1">{asset.name}</p>
      {showLogo && logo && (
        <img src={logo} alt="" className="h-4 object-contain mt-0.5 opacity-70" />
      )}
    </div>
  )
}

function LabelC({ asset, logo, showLogo }: LabelProps) {
  const qr = `MAINTAINIQ:${asset.id}`
  return (
    <div className="flex items-center gap-3 w-full h-full px-3 py-2 bg-white border border-gray-300 rounded">
      <QRCode value={qr} size={90} />
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-start justify-between gap-1">
          <p className="text-[14px] font-bold text-gray-900 truncate">{asset.code}</p>
          {showLogo && logo && (
            <img src={logo} alt="" className="h-5 object-contain shrink-0 opacity-70" />
          )}
        </div>
        <p className="text-[11px] font-medium text-gray-700 truncate">{asset.name}</p>
        {asset.description && (
          <p className="text-[9px] text-gray-400 line-clamp-2">{asset.description}</p>
        )}
        {asset.brand && (
          <p className="text-[9px] text-gray-500">{asset.brand} {asset.model}</p>
        )}
      </div>
    </div>
  )
}

function LabelD({ asset }: LabelProps) {
  const qr = `MAINTAINIQ:${asset.id}`
  return (
    <div className="flex items-center gap-1.5 w-full h-full px-1.5 py-1 bg-white border border-gray-300 rounded">
      <QRCode value={qr} size={52} />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-gray-900 truncate">{asset.code}</p>
        <p className="text-[8px] text-gray-500 truncate">{asset.name}</p>
      </div>
    </div>
  )
}

const LABEL_RENDERERS: Record<LabelLayout, React.ComponentType<LabelProps>> = {
  A: LabelA,
  B: LabelB,
  C: LabelC,
  D: LabelD,
}

// ─── Print logic ──────────────────────────────────────────────────────────────

function buildPrintHtml(assets: Asset[], layout: LabelLayout, logo?: string, showLogo?: boolean): string {
  const lDef = LAYOUTS.find(l => l.id === layout)!

  const renderQRSvg = (assetId: string, size: number) => {
    // We generate a simple placeholder — react-qr-code renders in browser, not in print window
    // We'll encode the value as text instead for the print version
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="white" stroke="#ccc" stroke-width="1"/>
      <text x="${size / 2}" y="${size / 2 - 4}" text-anchor="middle" font-size="5" fill="#666">MAINTAINIQ</text>
      <text x="${size / 2}" y="${size / 2 + 6}" text-anchor="middle" font-size="4" fill="#999">${assetId}</text>
    </svg>`
  }

  const labelStyle = layout === 'D'
    ? 'display:inline-flex;align-items:center;gap:6px;width:46mm;height:22mm;padding:3mm;border:0.5px solid #ccc;box-sizing:border-box;page-break-inside:avoid;'
    : 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;padding:3mm;box-sizing:border-box;'

  const labelHtml = (asset: Asset) => {
    const qrSize = lDef.qrSize
    if (layout === 'A') {
      return `<div style="${labelStyle}">
        ${renderQRSvg(asset.id, qrSize)}
        <div style="flex:1;min-width:0;margin-left:4px;">
          <p style="font-size:11px;font-weight:700;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${asset.code}</p>
          <p style="font-size:8px;color:#666;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${asset.name}</p>
        </div>
      </div>`
    }
    if (layout === 'B') {
      const logoHtml = showLogo && logo
        ? `<img src="${logo}" alt="" style="height:14px;object-fit:contain;opacity:0.7;margin-top:2px;" />`
        : ''
      return `<div style="${labelStyle};flex-direction:column;align-items:center;">
        ${renderQRSvg(asset.id, showLogo && logo ? 64 : qrSize)}
        <p style="font-size:11px;font-weight:700;margin:3px 0 0;text-align:center;">${asset.code}</p>
        <p style="font-size:8px;color:#666;margin:1px 0 0;text-align:center;">${asset.name}</p>
        ${logoHtml}
      </div>`
    }
    if (layout === 'C') {
      const logoHtml = showLogo && logo
        ? `<img src="${logo}" alt="" style="height:18px;object-fit:contain;opacity:0.7;float:right;margin-left:4px;" />`
        : ''
      return `<div style="${labelStyle};gap:8px;">
        ${renderQRSvg(asset.id, qrSize)}
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;">
            <p style="font-size:13px;font-weight:700;margin:0;">${asset.code}</p>
            ${logoHtml}
          </div>
          <p style="font-size:10px;font-weight:600;margin:2px 0 0;color:#333;">${asset.name}</p>
          ${asset.description ? `<p style="font-size:8px;color:#666;margin:2px 0 0;">${asset.description.substring(0, 60)}</p>` : ''}
          ${asset.brand ? `<p style="font-size:8px;color:#888;margin:1px 0 0;">${asset.brand}${asset.model ? ' ' + asset.model : ''}</p>` : ''}
        </div>
      </div>`
    }
    // D - grid
    return `<div style="${labelStyle}gap:5px;">
      ${renderQRSvg(asset.id, 52)}
      <div style="flex:1;min-width:0;">
        <p style="font-size:9px;font-weight:700;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${asset.code}</p>
        <p style="font-size:7px;color:#666;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${asset.name}</p>
      </div>
    </div>`
  }

  const pageCSS = layout === 'D'
    ? `@page { size: A4; margin: 8mm; } body { display: flex; flex-wrap: wrap; gap: 2mm; align-content: flex-start; }`
    : `@page { size: ${lDef.pageSize}; margin: 2mm; } body { margin: 0; } .label { width: 100vw; height: 100vh; } @media print { .page-break { page-break-after: always; } }`

  const labelsHtml = layout === 'D'
    ? assets.map(a => labelHtml(a)).join('\n')
    : assets.map((a, i) =>
        `<div class="label">${labelHtml(a)}</div>${i < assets.length - 1 ? '<div class="page-break"></div>' : ''}`
      ).join('\n')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>QR Labels — MaintainIQ</title>
  <style>
    * { box-sizing: border-box; font-family: Arial, sans-serif; }
    ${pageCSS}
  </style>
</head>
<body>
  ${labelsHtml}
</body>
</html>`
}

function openPrintWindow(assets: Asset[], layout: LabelLayout, logo?: string, showLogo?: boolean) {
  const html = buildPrintHtml(assets, layout, logo, showLogo)
  const win = window.open('', '_blank', 'width=800,height=600')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.onload = () => {
    win.focus()
    win.print()
  }
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function QRPrintModal({
  assets,
  onClose,
}: {
  assets: Asset[]
  onClose: () => void
}) {
  const companySettings = useStore(s => s.companySettings)
  const [layout, setLayout] = useState<LabelLayout>('C')
  const activeLayout = LAYOUTS.find(l => l.id === layout)!
  const LabelRenderer = LABEL_RENDERERS[layout]

  const showLogo = companySettings.logoOnQR && !!companySettings.logo
  const logo = companySettings.logo

  // Preview: show max 4
  const previewAssets = assets.slice(0, 4)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Print QR-labels</h2>
            <p className="text-xs text-gray-500 mt-0.5">{assets.length} enhed{assets.length !== 1 ? 'er' : ''} valgt</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Layout selector */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Vælg labelstørrelse</p>
            <div className="grid grid-cols-2 gap-2">
              {LAYOUTS.map(l => (
                <button
                  key={l.id}
                  onClick={() => setLayout(l.id)}
                  className={clsx(
                    'text-left p-3 rounded-lg border transition-colors',
                    layout === l.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{l.name}</span>
                    <span className={clsx(
                      'text-[10px] px-1.5 py-0.5 rounded font-bold',
                      layout === l.id ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                    )}>
                      {l.id}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{l.dimensions}</p>
                  <p className="text-[11px] text-gray-400">{l.format}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Forhåndsvisning
              <span className="ml-2 font-normal normal-case text-gray-400">({activeLayout.dimensions} — {activeLayout.format})</span>
            </p>
            <div className={clsx(
              'flex flex-wrap gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-4',
              layout === 'D' && 'grid grid-cols-2'
            )}>
              {previewAssets.map(asset => (
                <div
                  key={asset.id}
                  className={clsx(
                    'bg-white border border-gray-200 rounded overflow-hidden flex',
                    layout === 'A' && 'w-[186px] h-[87px]',
                    layout === 'B' && 'w-[148px] h-[148px]',
                    layout === 'C' && 'w-[280px] h-[140px]',
                    layout === 'D' && 'w-full h-[80px]',
                  )}
                >
                  <LabelRenderer asset={asset} logo={logo} showLogo={showLogo} />
                </div>
              ))}
              {assets.length > 4 && (
                <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs text-gray-400">
                  +{assets.length - 4}
                </div>
              )}
            </div>
          </div>

          {/* Asset list */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Enheder der printes ({assets.length})</p>
            <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-800">
              {assets.map(a => (
                <div key={a.id} className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{a.name}</span>
                  <span className="text-xs text-gray-400 font-mono">{a.code}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
          <p className="text-xs text-gray-400">
            Printer åbner i nyt vindue. Vælg labelprinter og deaktivér sidehoved/sidefod.
          </p>
          <button
            onClick={() => openPrintWindow(assets, layout, logo, showLogo)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <Printer size={15} />
            Print {assets.length} label{assets.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
