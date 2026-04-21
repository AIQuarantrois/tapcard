'use client'

import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'

interface Props {
  onClose: () => void
  onResult: (handle: string) => void
  gradCss: string
}

export default function QRScanner({ onClose, onResult, gradCss }: Props) {
  const videoRef   = useRef<HTMLVideoElement>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const streamRef  = useRef<MediaStream | null>(null)
  const rafRef     = useRef<number>(0)
  const [error, setError]     = useState('')
  const [scanned, setScanned] = useState(false)
  const [found, setFound]     = useState('')

  useEffect(() => {
    let active = true

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        if (!active) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          tick()
        }
      } catch {
        setError("Caméra inaccessible. Autorise l'accès dans les réglages.")
      }
    }

    function tick() {
      const video  = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.readyState < 2) { rafRef.current = requestAnimationFrame(tick); return }

      canvas.width  = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(video, 0, 0)
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })

      if (code?.data) {
        /* Accept only tapcard.io URLs or bare handles */
        const url = code.data.trim()
        const match = url.match(/(?:tapcard\.io\/)([a-z0-9-]+)$/i)
          ?? url.match(/^([a-z0-9-]{2,40})$/i)
        if (match?.[1]) {
          setScanned(true)
          setFound(match[1])
          return // stop scanning
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    start()
    return () => {
      active = false
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const handleOpen = () => {
    onResult(found)
    onClose()
  }

  return (
    <div className="fi" style={{ position:'fixed', inset:0, zIndex:300, background:'#000',
      display:'flex', flexDirection:'column' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'52px 20px 16px', background:'rgba(0,0,0,.7)', backdropFilter:'blur(10px)' }}>
        <div style={{ fontSize:17, fontWeight:600, color:'#fff', fontFamily:'var(--font-ot),system-ui,sans-serif' }}>
          Scanner une carte
        </div>
        <button onClick={onClose} style={{ width:34, height:34, borderRadius:10,
          background:'rgba(255,255,255,.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Camera feed */}
      <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
        <video ref={videoRef} playsInline muted
          style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
        <canvas ref={canvasRef} style={{ display:'none' }}/>

        {/* Viewfinder */}
        {!scanned && !error && (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
            <div style={{ width:220, height:220, position:'relative' }}>
              {/* Scanline */}
              <div className="scan" style={{ background:`linear-gradient(transparent, ${gradCss.replace('linear-gradient(140deg,','').split(',')[0]}55, transparent)` }}/>
              {/* Corners */}
              {[['top','left'],['top','right'],['bottom','left'],['bottom','right']].map(([v,h]) => (
                <div key={`${v}${h}`} style={{
                  position:'absolute', [v]:0, [h]:0,
                  width:28, height:28,
                  borderTop:    v==='top'    ? '3px solid #fff' : 'none',
                  borderBottom: v==='bottom' ? '3px solid #fff' : 'none',
                  borderLeft:   h==='left'   ? '3px solid #fff' : 'none',
                  borderRight:  h==='right'  ? '3px solid #fff' : 'none',
                  borderRadius: `${v==='top'&&h==='left'?6:0}px ${v==='top'&&h==='right'?6:0}px ${v==='bottom'&&h==='right'?6:0}px ${v==='bottom'&&h==='left'?6:0}px`,
                }}/>
              ))}
            </div>
          </div>
        )}

        {/* Hint */}
        {!scanned && !error && (
          <div style={{ position:'absolute', bottom:40, left:0, right:0, textAlign:'center',
            color:'rgba(255,255,255,.65)', fontSize:13, fontFamily:'var(--font-ot),system-ui,sans-serif' }}>
            Pointe la caméra vers un QR code TapCard
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', padding:32, textAlign:'center' }}>
            <div style={{ fontSize:36, marginBottom:16 }}>📷</div>
            <div style={{ color:'rgba(255,255,255,.85)', fontSize:15, lineHeight:1.7 }}>{error}</div>
          </div>
        )}

        {/* Success overlay */}
        {scanned && (
          <div className="fi" style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.7)',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, padding:32 }}>
            <div style={{ width:64, height:64, borderRadius:'50%', background:gradCss,
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ color:'#fff', fontSize:17, fontWeight:600, marginBottom:4 }}>
                tapcard.io/{found}
              </div>
              <div style={{ color:'rgba(255,255,255,.55)', fontSize:13 }}>Carte détectée</div>
            </div>
            <button onClick={handleOpen} style={{ padding:'14px 32px', borderRadius:14,
              background:gradCss, color:'#fff', fontSize:15, fontWeight:600,
              fontFamily:'var(--font-ot),system-ui,sans-serif', border:'none', cursor:'pointer' }}>
              Voir cette carte →
            </button>
            <button onClick={onClose} style={{ color:'rgba(255,255,255,.45)', fontSize:13,
              background:'none', border:'none', cursor:'pointer' }}>
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
