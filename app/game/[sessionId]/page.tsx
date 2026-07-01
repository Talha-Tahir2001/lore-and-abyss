'use client'

import { useState, useRef, useEffect, use } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { RiBrainLine, RiFileTextLine, RiMarkdownLine, RiSkullLine, RiVolumeMuteLine, RiVolumeUpLine } from '@remixicon/react'

// ── Types ─────────────────────────────────────────────────────────────────────

type SegmentType = 'system' | 'user' | 'ai'

interface PageParams {
    sessionId: string
}

interface StorySegment {
    type: SegmentType
    content: string
}

interface WorldState {
    hp: number
    maxHp: number
    sanity: number
    maxSanity: number
    gold: number
    location: string
    inventory: string[]
    activeCharacters: string[]
    tensionScore: number
}

const GENRE_AUDIO_MAP: Record<string, string> = {
    'horror': '/audio/508_Danse_de_Vampyr.mp3',
    'fantasy': '/audio/505_Visitation.mp3',
    'scifi': '/audio/510_City_of_Wonders.mp3',
    'noir': '/audio/494_Docks_Noir.mp3',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatBar({ label, value, max, color }: {
    label: string; value: number; max: number; color: string
}) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>{label}</span>
                <span className="text-foreground font-medium">
                    {value}<span className="text-muted-foreground font-normal">/{max}</span>
                </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${color}`}
                    style={{ width: `${(value / max) * 100}%` }}
                />
            </div>
        </div>
    )
}

function TensionBar({ value }: { value: number }) {
    const color = value > 75 ? 'bg-destructive' : value > 45 ? 'bg-primary' : 'bg-muted-foreground/60'
    const label = value > 75 ? 'Critical' : value > 45 ? 'Rising' : 'Low'
    return (
        <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground w-14 shrink-0">Tension</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
            </div>
            <span className={`w-12 text-right shrink-0 font-medium ${value > 75 ? 'text-destructive' : 'text-foreground'}`}>
                {label}
            </span>
        </div>
    )
}

function Segment({ seg }: { seg: StorySegment }) {
    if (seg.type === 'system') {
        return (
            <div className="py-3 border-b border-border/40">
                <div className="text-xs text-muted-foreground italic leading-relaxed whitespace-pre-wrap">
                    <ReactMarkdown>{seg.content}</ReactMarkdown>
                </div>
            </div>
        )
    }
    if (seg.type === 'user') {
        return (
            <div className="py-3 flex gap-3 items-start">
                <span className="text-xs text-primary font-semibold shrink-0 mt-0.5">YOU</span>
                <div className="text-sm text-foreground whitespace-pre-wrap">
                    <ReactMarkdown>{seg.content}</ReactMarkdown>
                </div>
            </div>
        )
    }
    return (
        <div className="py-3 flex gap-3 items-start border-b border-border/20">
            <span className="text-xs text-muted-foreground font-semibold shrink-0 mt-0.5">DM</span>
            <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                <ReactMarkdown>{seg.content}</ReactMarkdown>
            </div>
        </div>
    )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GamePage({ params }: { params: { sessionId: string } }) {
    const { sessionId } = use(params as unknown as Promise<PageParams>)
    const [mobileTab, setMobileTab] = useState<'story' | 'world'>('story')
    const [story, setStory] = useState<StorySegment[]>([])
    const [worldState, setWorldState] = useState<WorldState | null>(null)
    const [choices, setChoices] = useState<string[]>([])
    const [customInput, setCustomInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [turnNumber, setTurnNumber] = useState(1)
    const [sessionMeta, setSessionMeta] = useState<{
        genre: string; characterName: string; sessionName: string
    } | null>(null)
    const [isMuted, setIsMuted] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [gameOver, setGameOver] = useState<"dead" | "insane" | null>(null)
    const storyEndRef = useRef<HTMLDivElement>(null)
    const [showExportMenu, setShowExportMenu] = useState(false);



    const exportAsText = () => {
        if (!sessionMeta || story.length === 0) return

        let output = `========================================\n`
        output += `STORY SESSION: ${sessionMeta.sessionName}\n`
        output += `Character: ${sessionMeta.characterName} | Genre: ${sessionMeta.genre}\n`
        output += `Turns Played: ${Math.floor(turnNumber / 2)}\n`
        output += `========================================\n\n`

        story.forEach((seg) => {
            if (seg.type === 'user') {
                output += `> YOU: ${seg.content}\n\n`
            } else if (seg.type === 'ai') {
                output += `DM: ${seg.content}\n\n`
            } else {
                output += `[SYSTEM]: ${seg.content}\n\n`
            }
        })

        const blob = new Blob([output], { type: 'text/plain;charset=utf-8' })
        triggerDownload(blob, `${sessionMeta.sessionName}_story.txt`)
    }

    const exportAsMarkdown = () => {
        if (!sessionMeta || story.length === 0) return

        // Markdown file with structured frontmatter headers
        let output = `# ${sessionMeta.sessionName}\n\n`
        output += `**Character:** \`${sessionMeta.characterName}\` | **Genre:** \`${sessionMeta.genre}\` | **Turns:** \`${Math.floor(turnNumber / 2)}\`\n\n`
        output += `---\n\n`

        story.forEach((seg) => {
            if (seg.type === 'user') {
                output += `### 👤 You\n${seg.content}\n\n`
            } else if (seg.type === 'ai') {
                output += `### 🧙‍♂️ Dungeon Master\n${seg.content}\n\n`
            } else {
                output += `> ⚙️ **System:** *${seg.content}*\n\n`
            }
        })

        const blob = new Blob([output], { type: 'text/markdown;charset=utf-8' })
        triggerDownload(blob, `${sessionMeta.sessionName}_log.md`)
    }

    // Clean helper to clean up download triggers instantly
    const triggerDownload = (blob: Blob, filename: string) => {
        const cleanFilename = filename.replace(/\s+/g, '_')
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = cleanFilename
        link.click()
        URL.revokeObjectURL(url)
    }

    // ── FIXED: Audio Initialization Effect ────────────────────────────────────
    useEffect(() => {
        const currentGenre = sessionMeta?.genre
        if (!currentGenre || !GENRE_AUDIO_MAP[currentGenre]) return

        // 1. Instantly assign layout audio to ref so toggleMute can find it immediately
        const audioTrack = GENRE_AUDIO_MAP[currentGenre]
        const audio = new Audio(audioTrack)
        audio.loop = true
        audio.volume = 0.3
        audio.muted = isMuted
        audioRef.current = audio

        // 2. Play audio on click event if not muted
        const startPlayback = () => {
            if (audioRef.current && !audioRef.current.muted) {
                audioRef.current.play().catch(err => {
                    console.log("Autoplay context initialization notice:", err)
                })
            }
            window.removeEventListener('click', startPlayback)
        }

        window.addEventListener('click', startPlayback)

        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
            }
            window.removeEventListener('click', startPlayback)
            audioRef.current = null
        }
    }, [sessionMeta?.genre])

    // ── FIXED: Audio Volume Dynamics based on Tension ───────────────────────
    useEffect(() => {
        if (audioRef.current) {
            const baseVolume = 0.15
            const tensionModifier = ((worldState?.tensionScore ?? 10) / 100) * 0.25
            audioRef.current.volume = baseVolume + tensionModifier
        }
    }, [worldState?.tensionScore])

    // const toggleMute = () => {
    //     if (!audioRef.current) return

    //     if (isMuted) {
    //         audioRef.current.muted = false
    //         audioRef.current.play().catch(() => { })
    //         setIsMuted(false)
    //     } else {
    //         audioRef.current.muted = true
    //         setIsMuted(true)
    //     }
    // }

    // ── Load session from sessionStorage on mount ────────────────────────────

    // 1. Remove BOTH of your audio/tension useEffect hooks completely.
    // 2. Replace your toggleMute function with this one:

    const toggleMute = () => {
        const currentGenre = sessionMeta?.genre
        if (!currentGenre || !GENRE_AUDIO_MAP[currentGenre]) return

        // Case A: Audio hasn't been instantiated yet (First click initialization)
        if (!audioRef.current) {
            const audioTrack = GENRE_AUDIO_MAP[currentGenre]
            const audio = new Audio(audioTrack)
            audio.loop = true

            // Dynamic volume calculation based on tension state
            const baseVolume = 0.15
            const tensionModifier = ((worldState?.tensionScore ?? 10) / 100) * 0.25
            audio.volume = baseVolume + tensionModifier

            audioRef.current = audio

            // Because this runs DIRECTLY inside the button's onClick event, 
            // the browser will allow playback unconditionally.
            audio.play()
                .then(() => setIsMuted(false))
                .catch(err => console.error("Audio playback failure:", err))
            return
        }

        // Case B: Audio exists, handle explicit toggle
        if (isMuted) {
            audioRef.current.muted = false
            audioRef.current.play().catch(() => { })
            setIsMuted(false)
        } else {
            audioRef.current.muted = true
            setIsMuted(true)
        }
    }

    // 3. Keep a simple cleanup effect to pause music if the user leaves the page or shifts sessions
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
        }
    }, [sessionId])

    // 4. Update the volume whenever tension updates (safely verifying instance life)
    useEffect(() => {
        if (audioRef.current) {
            const baseVolume = 0.15
            const tensionModifier = ((worldState?.tensionScore ?? 10) / 100) * 0.25
            audioRef.current.volume = baseVolume + tensionModifier
        }
    }, [worldState?.tensionScore])

    // useEffect(() => {
    //     async function loadSession() {
    //         const raw = sessionStorage.getItem(`session_${sessionId}`)
    //         if (raw) {
    //             const meta = JSON.parse(raw)
    //             setSessionMeta(meta)
    //             setStory([{ type: 'system', content: meta.openingNarrative }])
    //             setChoices(['Look around carefully', 'Call out into the darkness', 'Check your equipment'])
    //             setTurnNumber(1)
    //             return
    //         }

    //         try {
    //             const res = await fetch(`/api/session/${sessionId}`)
    //             if (!res.ok) {
    //                 window.location.href = '/sessions'
    //                 return
    //             }
    //             const data = await res.json()

    //             setSessionMeta({
    //                 genre: data.session.genre,
    //                 characterName: data.session.characterName,
    //                 sessionName: data.session.sessionName,
    //             })
    //             setStory(data.story)
    //             setWorldState(data.worldState)
    //             setChoices(data.lastChoices)
    //             setTurnNumber(data.lastTurnNumber)

    //             if (data.session.status === 'dead') setGameOver('dead')
    //             if (data.session.status === 'insane') setGameOver('insane')

    //         } catch (err) {
    //             console.error('Failed to load session:', err)
    //             window.location.href = '/sessions'
    //         }
    //     }

    //     loadSession()
    // }, [sessionId])

    // ── Auto-scroll to bottom ────────────────────────────────────────────────

    useEffect(() => {
        async function loadSession() {
            try {
                const res = await fetch(`/api/session/${sessionId}`)
                if (!res.ok) {
                    window.location.href = '/sessions'
                    return
                }
                const data = await res.json()

                setSessionMeta({
                    genre: data.session.genre,
                    characterName: data.session.characterName,
                    sessionName: data.session.sessionName,
                })
                setStory(data.story)
                setWorldState(data.worldState)
                setChoices(data.lastChoices)
                setTurnNumber(data.lastTurnNumber)

                if (data.session.status === 'dead') setGameOver('dead')
                if (data.session.status === 'insane') setGameOver('insane')

            } catch (err) {
                console.error('Failed to load session:', err)

                // Only fall back to sessionStorage if the API completely fails
                const raw = sessionStorage.getItem(`session_${sessionId}`)
                if (raw) {
                    const meta = JSON.parse(raw)
                    setSessionMeta(meta)
                    setStory([{ type: 'system', content: meta.openingNarrative }])
                    setChoices(['Look around carefully', 'Call out into the darkness', 'Check your equipment'])
                    setTurnNumber(1)
                } else {
                    window.location.href = '/sessions'
                }
            }
        }
        loadSession()
    }, [sessionId])

    useEffect(() => {
        storyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [story, isLoading])

    // ── Send a turn ──────────────────────────────────────────────────────────
    const sendTurn = async (action: string) => {
        if (!sessionMeta || isLoading) return
        setIsLoading(true)
        setChoices([])

        setStory((prev) => [...prev, { type: 'user', content: action }])
        setStory((prev) => [...prev, { type: 'ai', content: '' }])

        try {
            const res = await fetch('/api/turn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    playerAction: action,
                    genre: sessionMeta.genre,
                    turnNumber,
                }),
            })

            if (!res.ok || !res.body) throw new Error("Failed to process stream response")

            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let done = false
            let accumulatedText = ""

            while (!done) {
                const { value, done: doneReading } = await reader.read()
                done = doneReading

                if (value) {
                    const chunk = decoder.decode(value, { stream: !done })
                    accumulatedText += chunk

                    if (accumulatedText.includes("||METADATA_SPLIT||")) {
                        const parts = accumulatedText.split("||METADATA_SPLIT||\n")
                        const cleanText = parts[0].trim()

                        setStory((prev) => {
                            const updated = [...prev]
                            updated[updated.length - 1] = { type: 'ai', content: cleanText }
                            return updated
                        })

                        try {
                            const metaObj = JSON.parse(parts[1])
                            setChoices(metaObj.choices)
                            setWorldState(metaObj.worldState)
                            if (metaObj.gameOver) {
                                setGameOver(metaObj.gameOverReason)
                                setChoices([])
                            }
                        } catch (e) {
                            console.error("Meta payload parsing exception", e)
                        }
                    } else {
                        setStory((prev) => {
                            const updated = [...prev]
                            updated[updated.length - 1] = { type: 'ai', content: accumulatedText }
                            return updated
                        })
                    }
                }
            }

            setTurnNumber((n) => n + 2)

        } catch (err) {
            console.error(err)
            setStory((prev) => [
                ...prev,
                { type: 'system', content: '⚠ Something went wrong. Try again.' },
            ])
            setChoices(['Try again', 'Look around', 'Wait'])
        } finally {
            setIsLoading(false)
        }
    }

    const handleChoice = (choice: string) => sendTurn(choice)

    const handleCustomInput = () => {
        if (customInput.trim() && !isLoading) {
            sendTurn(customInput.trim())
            setCustomInput('')
        }
    }

    return (
        <div className="h-[calc(100vh-4rem)] bg-background flex flex-col overflow-hidden">
            {/* Mobile tab switcher */}
            <div className="flex md:hidden border-b border-border shrink-0">
                <button
                    onClick={() => setMobileTab('story')}
                    className={`flex-1 py-2.5 text-xs font-medium transition-colors ${mobileTab === 'story'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-muted-foreground'
                        }`}
                >
                    Story
                </button>
                <button
                    onClick={() => setMobileTab('world')}
                    className={`flex-1 py-2.5 text-xs font-medium transition-colors ${mobileTab === 'world'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-muted-foreground'
                        }`}
                >
                    World State
                </button>
            </div>

            {/* Main content area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left panel: Story */}
                <div className={`
                    flex-1 flex flex-col border-r border-border min-w-0
                    ${mobileTab === 'world' ? 'hidden md:flex' : 'flex'}
                `}>
                    {/* Header */}
                    <div className="shrink-0 border-b border-border px-4 md:px-6 py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 md:gap-3 min-w-0">
                            <Badge variant="outline" className="text-xs shrink-0">
                                {sessionMeta?.genre ?? '...'}
                            </Badge>
                            <span className="text-xs md:text-sm font-semibold text-foreground truncate">
                                {sessionMeta?.sessionName ?? 'Loading...'}
                            </span>
                            {/* Mute Toggle Button */}
                            {sessionMeta?.genre && (
                                <Button variant="ghost" size="icon" className="h-7 w-7 ml-1" onClick={toggleMute}>
                                    {isMuted ? <RiVolumeMuteLine className="h-4 w-4" /> : <RiVolumeUpLine className="h-4 w-4" />}
                                </Button>
                            )}


                            {story.length > 0 && (
                                <div className="relative ml-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-3 text-xs flex items-center gap-1.5 font-medium border-primary/20 hover:border-primary/60"
                                        onClick={() => setShowExportMenu(!showExportMenu)}
                                    >
                                        <span>Export Story</span>
                                        <svg
                                            className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </Button>

                                    {/* Dropdown Menu Overlay Controlled by React State */}
                                    {showExportMenu && (
                                        <>
                                            {/* Invisible backdrop layer that closes the menu if you tap anywhere outside */}
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => setShowExportMenu(false)}
                                            />

                                            <div className="absolute right-0 top-full mt-1 w-36 bg-popover border border-border rounded-md shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                                                <button
                                                    onClick={() => {
                                                        exportAsText();
                                                        setShowExportMenu(false);
                                                    }}
                                                    className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-accent hover:text-accent-foreground transition-colors font-medium flex items-center gap-2"
                                                >
                                                    <RiFileTextLine /> As Text (.txt)
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        exportAsMarkdown();
                                                        setShowExportMenu(false);
                                                    }}
                                                    className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-accent hover:text-accent-foreground transition-colors font-medium flex items-center gap-2"
                                                >
                                                    <RiMarkdownLine /> As Markdown (.md)
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="w-32 md:w-48 shrink-0">
                            <TensionBar value={worldState?.tensionScore ?? 10} />
                        </div>
                    </div>

                    {/* Story feed */}
                    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
                        {story.map((seg, i) => <Segment key={i} seg={seg} />)}
                        {isLoading && (
                            <div className="py-3 flex gap-3 items-start">
                                <span className="text-xs text-muted-foreground font-semibold shrink-0 mt-0.5">DM</span>
                                <p className="text-sm text-muted-foreground animate-pulse">The story continues...</p>
                            </div>
                        )}
                        {!isLoading && (
                            <div className="py-2">
                                <span className="text-primary text-sm animate-pulse">█</span>
                            </div>
                        )}
                        <div ref={storyEndRef} />
                    </div>

                    {gameOver && (
                        <div className={`border rounded-md p-4 text-center mb-4 mx-4 md:mx-6 ${gameOver === 'dead'
                            ? 'border-destructive/50 bg-destructive/10'
                            : 'border-chart-4/50 bg-chart-4/10'
                            }`}>
                            {/* <p className="text-sm font-semibold text-foreground mb-1">
                                {gameOver === 'dead' ? <><RiSkullLine /> {'Your character has died'} </> : <><RiBrainLine /> {'Your character has lost their mind'}</>}
                            </p> */}
                            <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground mb-1">
                                {gameOver === 'dead' ? (
                                    <>
                                        <RiSkullLine className="w-4 h-4 text-rose-500" />
                                        <span>Your character has died</span>
                                    </>
                                ) : (
                                    <>
                                        <RiBrainLine className="w-4 h-4 text-purple-500" />
                                        <span>Your character has lost their mind</span>
                                    </>
                                )}
                            </p>
                            <p className="text-xs text-muted-foreground mb-3">This story has ended.</p>
                            <div className="flex gap-2 justify-center">
                                <Link href="/sessions">
                                    <Button size="sm" variant="outline" className="text-xs">View All Stories</Button>
                                </Link>
                                <Link href="/new-game">
                                    <Button size="sm" className="bg-primary text-primary-foreground text-xs">Start New Game</Button>
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Choices + input */}
                    <div className="shrink-0 border-t border-border p-4 md:p-5 space-y-3 md:space-y-4 bg-card/30">
                        {choices.length > 0 && (
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 md:mb-3">
                                    What do you do?
                                </p>
                                <div className="flex flex-col sm:grid sm:grid-cols-3 gap-2">
                                    {choices.map((choice, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleChoice(choice)}
                                            disabled={isLoading}
                                            className="text-left text-xs md:text-sm px-3 md:px-4 py-2.5 md:py-3 rounded-md border border-border
                                              bg-background hover:border-primary/60 hover:bg-primary/5 hover:text-primary
                                              transition-all text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            {choice}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <Input
                                placeholder="Or write your own action..."
                                value={customInput}
                                onChange={(e) => setCustomInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleCustomInput() }}
                                disabled={isLoading}
                                className="flex-1 bg-background text-sm"
                            />
                            <Button
                                onClick={handleCustomInput}
                                disabled={!customInput.trim() || isLoading}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs md:text-sm"
                            >
                                Send
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right panel: World State */}
                <div className={`
                    w-full md:w-72 xl:w-80 shrink-0 flex flex-col overflow-y-auto bg-card/20
                    ${mobileTab === 'story' ? 'hidden md:flex' : 'flex'}
                `}>
                    <div className="border-b border-border px-5 py-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Character</p>
                        <p className="text-sm font-semibold text-foreground">{sessionMeta?.characterName ?? '...'}</p>
                        <Badge variant="outline" className="text-xs mt-1">{sessionMeta?.genre ?? '...'}</Badge>
                    </div>

                    <div className="border-b border-border px-5 py-4 space-y-3">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Stats</p>
                        <StatBar label="HP" value={worldState?.hp ?? 100} max={worldState?.maxHp ?? 100} color="bg-primary" />
                        <StatBar label="Sanity" value={worldState?.sanity ?? 100} max={worldState?.maxSanity ?? 100} color="bg-chart-4" />
                        <div className="flex justify-between text-xs pt-1">
                            <span className="text-muted-foreground">Gold</span>
                            <span className="text-foreground font-medium">{worldState?.gold ?? 50} gp</span>
                        </div>
                    </div>

                    <div className="border-b border-border px-5 py-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Location</p>
                        <p className="text-xs text-foreground leading-relaxed">{worldState?.location ?? 'Unknown'}</p>
                    </div>

                    <div className="border-b border-border px-5 py-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Inventory</p>
                        <div className="flex flex-wrap gap-1.5">
                            {(worldState?.inventory ?? ['Torch', 'Basic Supplies']).map((item) => (
                                <Badge key={item} variant="secondary" className="text-xs font-normal">{item}</Badge>
                            ))}
                        </div>
                    </div>

                    <div className="px-5 py-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Present</p>
                        {(worldState?.activeCharacters ?? []).length > 0 ? (
                            <div className="space-y-2">
                                {worldState!.activeCharacters.map((npc) => (
                                    <div key={npc} className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                        <span className="text-xs text-foreground">{npc}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground">No one else is here.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}