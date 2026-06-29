// 'use client'

// import { Button } from '@/components/ui/button'
// import { Badge } from '@/components/ui/badge'
// import Link from 'next/link'

// interface Session {
//     id: string
//     genre: 'Fantasy' | 'Horror' | 'Sci-Fi' | 'Noir'
//     title: string
//     characterName: string
//     lastPlayed: string
//     tension: number
//     turnCount: number
// }

// // TODO: Fetch sessions from DynamoDB
// const sessions: Session[] = [
//     { id: 'session_1', genre: 'Fantasy', title: 'The Forgotten Tomb', characterName: 'Aldric the Brave', lastPlayed: '2 hours ago', tension: 72, turnCount: 18 },
//     { id: 'session_2', genre: 'Horror', title: 'Whispers in the Fog', characterName: 'Dr. Marcus Cole', lastPlayed: '1 day ago', tension: 91, turnCount: 34 },
//     { id: 'session_3', genre: 'Sci-Fi', title: 'Escape from Station Alpha', characterName: 'Commander Vale', lastPlayed: '3 days ago', tension: 45, turnCount: 9 },
//     { id: 'session_4', genre: 'Noir', title: 'The Missing Artifact', characterName: 'Detective Sam Stone', lastPlayed: '1 week ago', tension: 58, turnCount: 22 },
// ]

// const genreEmoji: Record<Session['genre'], string> = {
//     Fantasy: '🗡️',
//     Horror: '🩸',
//     'Sci-Fi': '🚀',
//     Noir: '🕵️',
// }

// function TensionBar({ value }: { value: number }) {
//     const color = value > 75 ? 'bg-destructive' : value > 45 ? 'bg-primary' : 'bg-muted-foreground'
//     return (
//         <div className="flex items-center gap-2">
//             <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
//                 <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
//             </div>
//             <span className="text-xs text-muted-foreground w-7 text-right">{value}</span>
//         </div>
//     )
// }

// export default function Sessions() {
//     return (
//         <main className="min-h-[calc(100vh-4rem)] bg-background">

//             {/* Page header */}
//             <div className="border-b border-border">
//                 <div className="max-w-5xl mx-auto px-6 py-10 flex items-end justify-between gap-4">
//                     <div>
//                         <p className="text-xs text-muted-foreground tracking-widest uppercase mb-3">Library</p>
//                         <h1 className="text-4xl font-bold text-foreground">Your Stories</h1>
//                     </div>
//                     <Link href="/new-game">
//                         <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
//                             + New Story
//                         </Button>
//                     </Link>
//                 </div>
//             </div>

//             <div className="max-w-5xl mx-auto px-6 py-12">

//                 {sessions.length > 0 ? (
//                     <>
//                         {/* Table header */}
//                         <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 pb-3 text-xs text-muted-foreground uppercase tracking-widest border-b border-border mb-2">
//                             <span>Story</span>
//                             <span className="text-right w-24">Tension</span>
//                             <span className="text-right w-16">Turns</span>
//                             <span className="text-right w-28">Actions</span>
//                         </div>

//                         {/* Session rows */}
//                         <div className="divide-y divide-border">
//                             {sessions.map((session) => (
//                                 <div
//                                     key={session.id}
//                                     className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-4 py-5 hover:bg-card/60 transition-colors group"
//                                 >
//                                     {/* Story info */}
//                                     <div className="min-w-0">
//                                         <div className="flex items-center gap-2 mb-1">
//                                             <span className="text-sm">{genreEmoji[session.genre]}</span>
//                                             <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
//                                                 {session.title}
//                                             </span>
//                                             <Badge variant="outline" className="text-xs flex-shrink-0">
//                                                 {session.genre}
//                                             </Badge>
//                                         </div>
//                                         <p className="text-xs text-muted-foreground">
//                                             {session.characterName} · Last played {session.lastPlayed}
//                                         </p>
//                                     </div>

//                                     {/* Tension */}
//                                     <div className="w-24">
//                                         <TensionBar value={session.tension} />
//                                     </div>

//                                     {/* Turn count */}
//                                     <div className="w-16 text-right">
//                                         <span className="text-sm font-medium text-foreground">{session.turnCount}</span>
//                                         <span className="text-xs text-muted-foreground"> turns</span>
//                                     </div>

//                                     {/* Actions */}
//                                     <div className="w-28 flex justify-end gap-2">
//                                         <Link href={`/game/${session.id}`}>
//                                             <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs">
//                                                 Continue
//                                             </Button>
//                                         </Link>
//                                         <Button
//                                             size="sm"
//                                             variant="outline"
//                                             className="text-xs"
//                                             onClick={() => {
//                                                 // TODO: Export session as markdown/PDF
//                                                 console.log('Export:', session.id)
//                                             }}
//                                         >
//                                             Export
//                                         </Button>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>

//                         {/* Footer count */}
//                         <p className="text-xs text-muted-foreground mt-6 px-4">
//                             {sessions.length} active {sessions.length === 1 ? 'story' : 'stories'}
//                         </p>
//                     </>
//                 ) : (
//                     /* Empty state */
//                     <div className="border border-border rounded-md p-16 text-center">
//                         <p className="text-4xl mb-4">📖</p>
//                         <p className="text-base font-semibold text-foreground mb-2">No stories yet</p>
//                         <p className="text-sm text-muted-foreground mb-6">Your first adventure is one click away.</p>
//                         <Link href="/new-game">
//                             <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
//                                 Begin Your Story
//                             </Button>
//                         </Link>
//                     </div>
//                 )}
//             </div>
//         </main>
//     )
// }

'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Session {
    id: string
    genre: 'Fantasy' | 'Horror' | 'Sci-Fi' | 'Noir'
    title: string
    characterName: string
    lastPlayed: string
    status: string
}

const genreEmoji: Record<string, string> = {
    Fantasy: '🗡️',
    Horror: '🩸',
    'Sci-Fi': '🚀',
    Noir: '🕵️',
}

function TensionBar({ value }: { value: number }) {
    const color = value > 75
        ? 'bg-destructive'
        : value > 45
            ? 'bg-primary'
            : 'bg-muted-foreground'
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
            </div>
            <span className="text-xs text-muted-foreground w-7 text-right">{value}</span>
        </div>
    )
}

export default function Sessions() {
    const [sessions, setSessions] = useState<Session[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchSessions() {
            try {
                const res = await fetch('/api/sessions')
                const data = await res.json()
                if (!res.ok) throw new Error(data.error)
                setSessions(data.sessions)
            } catch (err: any) {
                setError(err.message ?? 'Failed to load sessions')
            } finally {
                setIsLoading(false)
            }
        }
        fetchSessions()
    }, [])

    return (
        <main className="min-h-[calc(100vh-4rem)] bg-background">

            {/* Page header */}
            <div className="border-b border-border">
                <div className="max-w-5xl mx-auto px-6 py-10 flex items-end justify-between gap-4">
                    <div>
                        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-3">Library</p>
                        <h1 className="text-4xl font-bold text-foreground">Your Stories</h1>
                    </div>
                    <Link href="/new-game">
                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                            + New Story
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-12">

                {/* Loading */}
                {isLoading && (
                    <div className="text-center py-16">
                        <p className="text-sm text-muted-foreground animate-pulse">Loading your stories...</p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="border border-destructive/40 bg-destructive/5 rounded-md p-4 text-sm text-destructive">
                        {error}
                    </div>
                )}

                {/* Sessions table */}
                {!isLoading && !error && sessions.length > 0 && (
                    <>
                        <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 pb-3 text-xs text-muted-foreground uppercase tracking-widest border-b border-border mb-2">
                            <span>Story</span>
                            <span className="text-right w-24">Last Played</span>
                            <span className="text-right w-28">Actions</span>
                        </div>

                        <div className="divide-y divide-border">
                            {sessions.map((session) => (
                                <div
                                    key={session.id}
                                    className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-4 py-5 hover:bg-card/60 transition-colors group"
                                >
                                    {/* Story info */}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm">{genreEmoji[session.genre] ?? '📖'}</span>
                                            <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                                {session.title}
                                            </span>
                                            <Badge variant="outline" className="text-xs shrink-0">
                                                {session.genre}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {session.characterName}
                                        </p>
                                    </div>

                                    {/* Last played */}
                                    <div className="w-24 text-right">
                                        <span className="text-xs text-muted-foreground">{session.lastPlayed}</span>
                                    </div>

                                    {/* Actions */}
                                    <div className="w-28 flex justify-end gap-2">
                                        <Link href={`/game/${session.id}`}>
                                            <Button
                                                size="sm"
                                                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
                                            >
                                                Continue
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <p className="text-xs text-muted-foreground mt-6 px-4">
                            {sessions.length} active {sessions.length === 1 ? 'story' : 'stories'}
                        </p>
                    </>
                )}

                {/* Empty state */}
                {!isLoading && !error && sessions.length === 0 && (
                    <div className="border border-border rounded-md p-16 text-center">
                        <p className="text-4xl mb-4">📖</p>
                        <p className="text-base font-semibold text-foreground mb-2">No stories yet</p>
                        <p className="text-sm text-muted-foreground mb-6">
                            Your first adventure is one click away.
                        </p>
                        <Link href="/new-game">
                            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                                Begin Your Story
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </main>
    )
}