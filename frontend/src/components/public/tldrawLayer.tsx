import { useEffect, useRef, useCallback } from 'react'
import getStroke from 'perfect-freehand'

interface Point { x: number; y: number; pressure: number }
interface BBox { minX: number; minY: number; maxX: number; maxY: number }
interface Stroke { id: string; points: Point[]; color: string; size: number; bbox: BBox; path?: Path2D; calligraphy: boolean }
interface TrailPoint { x: number; y: number; t: number }

interface TldrawLayerProps {
    onReady: (handle: { clearAll: () => void }) => void
    onToolChange?: (tool: 'draw' | 'eraser') => void
    isDark: boolean; color: string; size: string; tool: 'draw' | 'eraser'; calligraphy: boolean; isDrawing: boolean
}

const COLOR_MAP: Record<string, string> = {
    red: '#ef4444', orange: '#f97316', yellow: '#eab308', green: '#22c55e',
    blue: '#3b82f6', violet: '#a855f7', black: '#000000', white: '#ffffff',
}
const SIZE_MAP: Record<string, number> = { s: 3, m: 4, l: 6, xl: 8 }
const ERASER_RADIUS = 20
const TRAIL_LIFETIME_MS = 120
const TRAIL_FADE_MS = 200

function uid() { return Math.random().toString(36).slice(2) }

function getStrokeOptions(size: number, calligraphy: boolean) {
    if (calligraphy) {
        return {
            size: size * 1.5,
            thinning: 0.7,
            smoothing: 0.5,
            streamline: 0.5,
            simulatePressure: true,
            start: { taper: size * 3, cap: true },
            end: { taper: size * 3, cap: true }
        }
    }
    
    return {
        size, 
        thinning: 0, 
        smoothing: 0.5, 
        streamline: 0.5,
        simulatePressure: false,
        start: { taper: 0, cap: true }, 
        end: { taper: 0, cap: true }
    }
}

function getSvgPathFromPoints(pts: number[][]): string {
    if (pts.length === 0) return ''
    let d = `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)} Q`
    for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]
        d += ` ${x0.toFixed(1)},${y0.toFixed(1)} ${((x0 + x1) / 2).toFixed(1)},${((y0 + y1) / 2).toFixed(1)}`
    }
    return d + ' Z'
}

function updateStrokePath(stroke: Stroke) {
    if (stroke.path) return stroke.path

    const pts = getStroke(
        stroke.points.map(p => [p.x, p.y, stroke.calligraphy ? p.pressure : 0.5]), 
        getStrokeOptions(stroke.size, stroke.calligraphy)
    )
    stroke.path = new Path2D(getSvgPathFromPoints(pts))
    return stroke.path
}

function strokeHitsEraser(stroke: Stroke, cx: number, cy: number, r: number): boolean {
    const b = stroke.bbox
    if (cx + r < b.minX || cx - r > b.maxX || cy + r < b.minY || cy - r > b.maxY) return false
    const r2 = r * r
    return stroke.points.some(p => (p.x - cx) ** 2 + (p.y - cy) ** 2 <= r2)
}

function TldrawLayer({ onReady, onToolChange, isDark, color, size, tool, calligraphy, isDrawing }: TldrawLayerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
    const strokesRef = useRef<Stroke[]>([])
    const activeStrokeRef = useRef<Stroke | null>(null)
    const historyRef = useRef<Stroke[][]>([])
    const undoneRef = useRef<Stroke[][]>([])
    const trailRef = useRef<TrailPoint[]>([])
    const markedIdsRef = useRef<Set<string>>(new Set())
    const rafRef = useRef<number | null>(null)
    const isPointerDownRef = useRef(false)
    const lastPosRef = useRef({ x: 0, y: 0 })
    const activeToolRef = useRef<'draw' | 'eraser'>('draw')

    const state = useRef({ color, size, tool, isDark, isDrawing, calligraphy })
    useEffect(() => {
        state.current = { color, size, tool, isDark, isDrawing, calligraphy }
        activeToolRef.current = tool
    }, [color, size, tool, isDark, isDrawing, calligraphy])

    const render = useCallback(() => {
        const canvas = canvasRef.current; const ctx = ctxRef.current
        if (!canvas || !ctx) return false
        const dpr = window.devicePixelRatio || 1
        const w = canvas.width / dpr, h = canvas.height / dpr
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, w, h)

        strokesRef.current.forEach(s => {
            ctx.globalAlpha = markedIdsRef.current.has(s.id) ? 0.2 : 1
            ctx.fillStyle = s.color; ctx.fill(updateStrokePath(s))
        })

        if (activeStrokeRef.current) {
            ctx.globalAlpha = 1
            ctx.fillStyle = activeStrokeRef.current.color; ctx.fill(updateStrokePath(activeStrokeRef.current))
        }

        const now = performance.now(); let needsMore = false

        if (activeToolRef.current === 'eraser') {
            needsMore = true
        }

        if (trailRef.current.length > 0) {
            trailRef.current = trailRef.current.filter(p => p.t > now - TRAIL_LIFETIME_MS)
            if (trailRef.current.length > 1) {
                const pts = getStroke(
                    trailRef.current.map((p, i) => [p.x, p.y, state.current.calligraphy ? i / trailRef.current.length : 0.5]),
                    { size: 8, thinning: state.current.calligraphy ? 0.7 : 0, start: { taper: 10, cap: true } }
                )
                const fade = Math.max(0, 1 - (now - trailRef.current[trailRef.current.length - 1].t) / TRAIL_FADE_MS)
                if (fade > 0) {
                    ctx.globalAlpha = 0.4 * fade; ctx.fillStyle = state.current.isDark ? '#fff' : '#9f9f9f'
                    ctx.fill(new Path2D(getSvgPathFromPoints(pts))); needsMore = true
                }
            }
        }
        return needsMore || isPointerDownRef.current
    }, [])

    const loopRef = useRef<(() => void) | null>(null)
    
    const loop = useCallback(function loop() { 
        if (loopRef.current?.()) rafRef.current = requestAnimationFrame(loop); 
        else rafRef.current = null 
    }, [])

    useEffect(() => {
        loopRef.current = () => render()
    }, [render])

    const startLoop = useCallback(() => { if (rafRef.current === null) rafRef.current = requestAnimationFrame(loop) }, [loop])

    const setupCanvas = useCallback(() => {
        const canvas = canvasRef.current; if (!canvas) return
        const dpr = window.devicePixelRatio || 1
        canvas.width = window.innerWidth * dpr; canvas.height = window.innerHeight * dpr
        canvas.style.width = `${window.innerWidth}px`; canvas.style.height = `${window.innerHeight}px`
        ctxRef.current = canvas.getContext('2d', { alpha: true }); render()
    }, [render])

    useEffect(() => { setupCanvas(); window.addEventListener('resize', setupCanvas); return () => window.removeEventListener('resize', setupCanvas) }, [setupCanvas])

    const undo = useCallback(() => {
        if (historyRef.current.length === 0) return
        undoneRef.current.push([...strokesRef.current]); strokesRef.current = historyRef.current.pop()!; render()
    }, [render])

    const redo = useCallback(() => {
        if (undoneRef.current.length === 0) return
        historyRef.current.push([...strokesRef.current]); strokesRef.current = undoneRef.current.pop()!; render()
    }, [render])

    const onPointerDown = useCallback((e: PointerEvent) => {
        if (!state.current.isDrawing) return
        const isRightClick = e.button === 2
        if (e.button !== 0 && !isRightClick) return

        isPointerDownRef.current = true;
        const rect = canvasRef.current!.getBoundingClientRect()
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        lastPosRef.current = { x, y }

        activeToolRef.current = isRightClick ? 'eraser' : state.current.tool
        onToolChange?.(activeToolRef.current)

        if (activeToolRef.current === 'draw') {
            activeStrokeRef.current = { 
                id: uid(), 
                points: [{ x, y, pressure: e.pressure || 0.5 }], 
                color: COLOR_MAP[state.current.color] || state.current.color, 
                size: SIZE_MAP[state.current.size] || 4, 
                bbox: { minX: x, minY: y, maxX: x, maxY: y },
                calligraphy: state.current.calligraphy
            }
        } else {
            trailRef.current = [{ x, y, t: performance.now() }]; markedIdsRef.current.clear()
        }
        startLoop()
    }, [startLoop, onToolChange])

    const onPointerMove = useCallback((e: PointerEvent) => {
        const rect = canvasRef.current!.getBoundingClientRect()
        const x = e.clientX - rect.left, y = e.clientY - rect.top; lastPosRef.current = { x, y }

        if (!isPointerDownRef.current) {
            if (activeToolRef.current === 'eraser') startLoop();
            return
        }

        if (activeToolRef.current === 'draw' && activeStrokeRef.current) {
            activeStrokeRef.current.points.push({ x, y, pressure: e.pressure || 0.5 }); activeStrokeRef.current.path = undefined
            const b = activeStrokeRef.current.bbox; b.minX = Math.min(b.minX, x); b.minY = Math.min(b.minY, y); b.maxX = Math.max(b.maxX, x); b.maxY = Math.max(b.maxY, y)
        } else if (activeToolRef.current === 'eraser') {
            trailRef.current.push({ x, y, t: performance.now() })
            strokesRef.current.forEach(s => { if (!markedIdsRef.current.has(s.id) && strokeHitsEraser(s, x, y, ERASER_RADIUS)) markedIdsRef.current.add(s.id) })
        }
        startLoop()
    }, [startLoop])

    const onPointerUp = useCallback(() => {
        if (!isPointerDownRef.current) return
        isPointerDownRef.current = false

        if (activeToolRef.current === 'draw' && activeStrokeRef.current) {
            historyRef.current.push([...strokesRef.current]); if (historyRef.current.length > 50) historyRef.current.shift(); undoneRef.current = []
            strokesRef.current.push(activeStrokeRef.current); activeStrokeRef.current = null
        } else if (activeToolRef.current === 'eraser') {
            if (markedIdsRef.current.size > 0) {
                historyRef.current.push([...strokesRef.current]); undoneRef.current = []
                strokesRef.current = strokesRef.current.filter(s => !markedIdsRef.current.has(s.id))
            }
            markedIdsRef.current.clear()
        }
        activeToolRef.current = state.current.tool
        onToolChange?.(activeToolRef.current)
        startLoop()
    }, [startLoop, onToolChange])

    useEffect(() => {
        const c = canvasRef.current; if (!c) return
        const preventDefault = (e: MouseEvent) => e.preventDefault()

        c.addEventListener('pointerdown', onPointerDown)
        c.addEventListener('contextmenu', preventDefault)
        window.addEventListener('pointermove', onPointerMove)
        window.addEventListener('pointerup', onPointerUp)

        return () => {
            c.removeEventListener('pointerdown', onPointerDown)
            c.removeEventListener('contextmenu', preventDefault)
            window.removeEventListener('pointermove', onPointerMove)
            window.removeEventListener('pointerup', onPointerUp)
        }
    }, [onPointerDown, onPointerMove, onPointerUp])

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (!state.current.isDrawing) return
            const ctrl = e.ctrlKey || e.metaKey
            if (ctrl && e.code === 'KeyZ') { e.preventDefault(); if (e.shiftKey) redo(); else undo() }
            if (ctrl && e.code === 'KeyY') { e.preventDefault(); redo() }
        }
        window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown)
    }, [undo, redo])

    useEffect(() => {
        onReady({ clearAll: () => { historyRef.current.push([...strokesRef.current]); strokesRef.current = []; activeStrokeRef.current = null; markedIdsRef.current.clear(); render() } })
    }, [onReady, render])

    return <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, touchAction: 'none', cursor: 'crosshair'}} />
}

export default TldrawLayer