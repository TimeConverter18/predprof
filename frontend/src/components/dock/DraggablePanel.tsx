import {
    useState,
    useRef,
    useEffect,
    useCallback,
    type ReactNode,
} from 'react'
import { GripHorizontal } from 'lucide-react'

type DockedEdge = 'left' | 'right' | 'top' | 'bottom' | null

const PEEK = 10
const DOCK_SNAP = 10
const TAB_SIZE = 28
const TAB_LONG = 56

interface StoredState {
    x: number
    y: number
    docked: DockedEdge
}

function loadState(id: string): StoredState | null {
    try {
        const raw = localStorage.getItem(`draggable-panel-${id}`)
        return raw ? (JSON.parse(raw) as StoredState) : null
    } catch {
        return null
    }
}

function saveState(id: string, s: StoredState): void {
    try {
        localStorage.setItem(`draggable-panel-${id}`, JSON.stringify(s))
    } catch (e) {
        // ignore
    }
}

function snapEdge(x: number, y: number, w: number, h: number): DockedEdge {
    if (x <= DOCK_SNAP) return 'left'
    if (y <= DOCK_SNAP) return 'top'
    if (window.innerWidth - (x + w) <= DOCK_SNAP) return 'right'
    if (window.innerHeight - (y + h) <= DOCK_SNAP) return 'bottom'
    return null
}

function dockedXY(edge: DockedEdge, x: number, y: number, w: number, h: number): { x: number; y: number } {
    switch (edge) {
        case 'left':
            return {x: -(w - PEEK), y: Math.max(0, Math.min(y, window.innerHeight - h))}
        case 'right':
            return {x: window.innerWidth - PEEK, y: Math.max(0, Math.min(y, window.innerHeight - h))}
        case 'top':
            return {x: Math.max(0, Math.min(x, window.innerWidth - w)), y: -(h - PEEK)}
        case 'bottom':
            return {x: Math.max(0, Math.min(x, window.innerWidth - w)), y: window.innerHeight - PEEK}
        default:
            return {x, y}
    }
}

function clamp(cx: number, cy: number, w: number, h: number): { x: number; y: number } {
    return {
        x: Math.max(0, Math.min(cx, window.innerWidth - w)),
        y: Math.max(0, Math.min(cy, window.innerHeight - h)),
    }
}

interface DraggablePanelProps {
    id: string
    children: ReactNode
    isOpen: boolean
    defaultPosition?: { right: number, top: number }
    className?: string
    showHandle?: boolean
    useDocking?: boolean
    hideWhenClosed?: boolean
    disableFilters?: boolean
}

export function DraggablePanel({ id, children, isOpen, defaultPosition = { right: 20, top: 20 }, className = '', showHandle = true, useDocking = true, hideWhenClosed = true, disableFilters = false }: DraggablePanelProps) {
    const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768)

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 768px)')
        const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [])

    const [x, setX] = useState(0)
    const [y, setY] = useState(0)
    const [docked, setDocked] = useState<DockedEdge>(null)
    const [ready, setReady] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [dragStartDocked, setDragStartDocked] = useState<DockedEdge>(null)
    const [pendingDock, setPendingDock] = useState<DockedEdge>(null)

    const panelRef = useRef<HTMLDivElement>(null)
    const initialized = useRef(false)

    const drag = useRef<{
        active: boolean
        offX: number
        offY: number
    }>({active: false, offX: 0, offY: 0})

    const pos = useRef({x: 0, y: 0, docked: null as DockedEdge})

    useEffect(() => {
        if (isDragging) {
            document.body.style.cursor = 'grabbing'
        } else {
            document.body.style.cursor = ''
        }
        return () => {
            document.body.style.cursor = ''
        }
    }, [isDragging])

    const updatePos = useCallback((nx: number, ny: number, nd: DockedEdge) => {
        pos.current = {x: nx, y: ny, docked: nd}
        setX(nx)
        setY(ny)
        setDocked(nd)
    }, [])

    useEffect(() => {
        if (initialized.current) return
        initialized.current = true

        const apply = (sx: number, sy: number, sd: DockedEdge) => {
            const panel = panelRef.current
            if (!panel) return
            const w = panel.offsetWidth
            const h = panel.offsetHeight
            if (sd && useDocking) {
                const dp = dockedXY(sd, sx, sy, w, h)
                updatePos(dp.x, dp.y, sd)
            } else {
                updatePos(sx, sy, null)
            }
            requestAnimationFrame(() => setReady(true))
        }

        const stored = loadState(id)
        if (stored) {
            requestAnimationFrame(() => apply(stored.x, stored.y, stored.docked))
            return
        }
        requestAnimationFrame(() => {
            const panel = panelRef.current
            if (!panel) return
            const nx = Math.max(0, window.innerWidth - panel.offsetWidth - defaultPosition.right)
            const ny = Math.max(0, defaultPosition.top)
            updatePos(nx, ny, null)
            saveState(id, {x: nx, y: ny, docked: null})
            requestAnimationFrame(() => setReady(true))
        })
    }, [updatePos, id, defaultPosition, useDocking])

    useEffect(() => {
        const onResize = () => {
            const panel = panelRef.current
            if (!panel) return
            const w = panel.offsetWidth
            const h = panel.offsetHeight
            const d = pos.current.docked
            if (d && useDocking) {
                const dp = dockedXY(d, pos.current.x, pos.current.y, w, h)
                updatePos(dp.x, dp.y, d)
            } else {
                const c = clamp(pos.current.x, pos.current.y, w, h)
                updatePos(c.x, c.y, null)
            }
        }
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [updatePos, useDocking])

    useEffect(() => {
        const panel = panelRef.current
        if (!panel) return
        const ro = new ResizeObserver(() => {
            if (pos.current.docked && useDocking) return
            const w = panel.offsetWidth
            const h = panel.offsetHeight
            const c = clamp(pos.current.x, pos.current.y, w, h)
            updatePos(c.x, c.y, null)
        })
        ro.observe(panel)
        return () => ro.disconnect()
    }, [updatePos, useDocking])

    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
        const panel = panelRef.current
        if (!panel) return

        e.currentTarget.setPointerCapture(e.pointerId)
        setIsDragging(true)

        const rect = panel.getBoundingClientRect()

        setDragStartDocked(pos.current.docked)
        drag.current = {
            active: true,
            offX: e.clientX - rect.left,
            offY: e.clientY - rect.top,
        }
        e.preventDefault()
    }, [])

    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
        if (!drag.current.active) return
        const panel = panelRef.current
        if (!panel) return

        const w = panel.offsetWidth
        const h = panel.offsetHeight

        const floatX = e.clientX - drag.current.offX
        const floatY = e.clientY - drag.current.offY

        let nx = floatX
        let ny = floatY

        if (useDocking) {
            nx = Math.max(-(w - PEEK), Math.min(floatX, window.innerWidth - PEEK))
            ny = Math.max(-(h - PEEK), Math.min(floatY, window.innerHeight - PEEK))
            
            let preview: DockedEdge = null
            if (floatX < 0) preview = 'left'
            else if (floatY < 0) preview = 'top'
            else if (floatX + w > window.innerWidth) preview = 'right'
            else if (floatY + h > window.innerHeight) preview = 'bottom'
            setPendingDock(preview)
        } else {
            nx = Math.max(0, Math.min(floatX, window.innerWidth - w))
            ny = Math.max(0, Math.min(floatY, window.innerHeight - h))
        }

        updatePos(nx, ny, null)
    }, [updatePos, useDocking])

    const handlePointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
        if (!drag.current.active) return
        const panel = panelRef.current
        if (!panel) return

        drag.current.active = false
        setIsDragging(false)
        setDragStartDocked(null)
        setPendingDock(null)
        e.currentTarget.releasePointerCapture(e.pointerId)

        const w = panel.offsetWidth
        const h = panel.offsetHeight

        let edge: DockedEdge = null
        if (useDocking) {
            edge = snapEdge(pos.current.x, pos.current.y, w, h)
        }

        if (edge) {
            const dp = dockedXY(edge, pos.current.x, pos.current.y, w, h)
            updatePos(dp.x, dp.y, edge)
            saveState(id, {x: dp.x, y: dp.y, docked: edge})
        } else {
            const c = clamp(pos.current.x, pos.current.y, w, h)
            updatePos(c.x, c.y, null)
            saveState(id, {x: c.x, y: c.y, docked: null})
        }
    }, [updatePos, id, useDocking])

    const dragHandlers = {
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerUp,
    }

    const tb = {
            bg: 'bg-zinc-900/80',
            border: 'border-zinc-700/60',
            grip: 'text-zinc-600 hover:text-zinc-400',
        }

    const bgColor = 'rgba(24, 24, 27, 0.95)'
    const borderColor = 'rgba(82, 82, 91, 0.6)'

    const visibleDocked: DockedEdge = useDocking ? (docked ?? dragStartDocked ?? (docked === null && dragStartDocked === null ? pendingDock : null)) : null

    const tabStyle = (): React.CSSProperties => {
        if (!visibleDocked) return {display: 'none'}

        const base: React.CSSProperties = {
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: bgColor,
            cursor: isDragging ? 'grabbing' : 'grab',
            zIndex: 1,
        }

        switch (visibleDocked) {
            case 'left':
                return {
                    ...base,
                    width: TAB_SIZE + 2,
                    height: TAB_LONG,
                    left: '100%',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    marginLeft: -2,
                    borderRadius: '0 10px 10px 0',
                    borderTop: `1px solid ${borderColor}`,
                    borderRight: `1px solid ${borderColor}`,
                    borderBottom: `1px solid ${borderColor}`,
                }
            case 'right':
                return {
                    ...base,
                    width: TAB_SIZE + 2,
                    height: TAB_LONG,
                    right: '100%',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    marginRight: -2,
                    borderRadius: '10px 0 0 10px',
                    borderTop: `1px solid ${borderColor}`,
                    borderLeft: `1px solid ${borderColor}`,
                    borderBottom: `1px solid ${borderColor}`,
                }
            case 'top':
                return {
                    ...base,
                    width: TAB_LONG,
                    height: TAB_SIZE + 2,
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginTop: -2,
                    borderRadius: '0 0 10px 10px',
                    borderLeft: `1px solid ${borderColor}`,
                    borderRight: `1px solid ${borderColor}`,
                    borderBottom: `1px solid ${borderColor}`,
                }
            case 'bottom':
                return {
                    ...base,
                    width: TAB_LONG,
                    height: TAB_SIZE + 2,
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: -2,
                    borderRadius: '10px 10px 0 0',
                    borderLeft: `1px solid ${borderColor}`,
                    borderRight: `1px solid ${borderColor}`,
                    borderTop: `1px solid ${borderColor}`,
                }
            default:
                return {display: 'none'}
        }
    }

    const transition = ready && !isDragging
        ? 'left 0.3s cubic-bezier(0.2, 0.9, 0.3, 1.1), top 0.3s cubic-bezier(0.2, 0.9, 0.3, 1.1)'
        : 'none'

    if (!isDesktop) return null

    return (
        <div
            style={{
                position: 'fixed',
                left: x,
                top: y,
                zIndex: 9998,
                transition,
                opacity: ready && isOpen ? 1 : 0,
                pointerEvents: isOpen ? 'auto' : 'none',
                visibility: hideWhenClosed && (!ready || !isOpen) ? 'hidden' : 'visible'
            }}
            className={`rounded-2xl relative ${className}`}
        >
            {!disableFilters && (
                <div
                    className="absolute inset-0 pointer-events-none rounded-2xl backdrop-blur-[6px]"
                    style={{
                        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.35))',
                        zIndex: -1
                    }}
                />
            )}

            <div
                ref={panelRef}
                style={{
                    width: 'max-content',
                    minWidth: 'max-content',

                    boxShadow: disableFilters ? ('0 4px 12px rgba(0,0,0,0.35)') : undefined,
                }}

                className={`flex flex-col gap-2 ${disableFilters ? 'bg-background' : tb.bg} border ${tb.border} rounded-2xl p-3 relative`}
            >
                {showHandle && (
                    <>
                        <div
                            {...dragHandlers}
                            style={tabStyle()}
                            className={`transition-colors touch-none ${tb.grip}`}
                        >
                            <GripHorizontal
                                size={14}
                                className={visibleDocked === 'left' || visibleDocked === 'right' ? 'rotate-90' : ''}
                            />
                        </div>

                        <div
                            {...dragHandlers}
                            className={`w-full flex justify-center transition-colors touch-none ${tb.grip} pb-1`}
                            style={{cursor: isDragging ? 'grabbing' : 'grab'}}
                        >
                            <GripHorizontal size={14}/>
                        </div>
                    </>
                )}

                <div className="flex flex-col">
                    {children}
                </div>
            </div>
        </div>
    )}