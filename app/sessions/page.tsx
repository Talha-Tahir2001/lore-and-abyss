// 'use client'

// import { useEffect, useState } from 'react'
// import { Button } from '@/components/ui/button'
// import { Badge } from '@/components/ui/badge'
// import Link from 'next/link'

// interface Session {
//     id: string
//     genre: 'Fantasy' | 'Horror' | 'Sci-Fi' | 'Noir'
//     title: string
//     characterName: string
//     lastPlayed: string
//     status: string
// }

// const genreEmoji: Record<string, string> = {
//     Fantasy: '🗡️',
//     Horror: '🩸',
//     'Sci-Fi': '🚀',
//     Noir: '🕵️',
// }

// function TensionBar({ value }: { value: number }) {
//     const color = value > 75
//         ? 'bg-destructive'
//         : value > 45
//             ? 'bg-primary'
//             : 'bg-muted-foreground'
//     return (
//         <div className="flex items-center gap-2">
//             <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
//                 <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
//             </div>
//             <span className="text-xs text-muted-foreground w-7 text-right">{value}</span>
//         </div>
//     )
// }

// export default function Sessions() {
//     const [sessions, setSessions] = useState<Session[]>([])
//     const [isLoading, setIsLoading] = useState(true)
//     const [error, setError] = useState<string | null>(null)

//     useEffect(() => {
//         async function fetchSessions() {
//             try {
//                 const res = await fetch('/api/sessions')
//                 const data = await res.json()
//                 if (!res.ok) throw new Error(data.error)
//                 setSessions(data.sessions)
//             } catch (err: any) {
//                 setError(err.message ?? 'Failed to load sessions')
//             } finally {
//                 setIsLoading(false)
//             }
//         }
//         fetchSessions()
//     }, [])

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

//                 {/* Loading */}
//                 {isLoading && (
//                     <div className="text-center py-16">
//                         <p className="text-sm text-muted-foreground animate-pulse">Loading your stories...</p>
//                     </div>
//                 )}

//                 {/* Error */}
//                 {error && (
//                     <div className="border border-destructive/40 bg-destructive/5 rounded-md p-4 text-sm text-destructive">
//                         {error}
//                     </div>
//                 )}

//                 {/* Sessions table */}
//                 {!isLoading && !error && sessions.length > 0 && (
//                     <>
//                         <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 pb-3 text-xs text-muted-foreground uppercase tracking-widest border-b border-border mb-2">
//                             <span>Story</span>
//                             <span className="text-right w-24">Last Played</span>
//                             <span className="text-right w-28">Actions</span>
//                         </div>

//                         <div className="divide-y divide-border">
//                             {sessions.map((session) => (
//                                 <div
//                                     key={session.id}
//                                     className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-4 py-5 hover:bg-card/60 transition-colors group"
//                                 >
//                                     {/* Story info */}
//                                     <div className="min-w-0">
//                                         <div className="flex items-center gap-2 mb-1">
//                                             <span className="text-sm">{genreEmoji[session.genre] ?? '📖'}</span>
//                                             <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
//                                                 {session.title}
//                                             </span>
//                                             <Badge variant="outline" className="text-xs shrink-0">
//                                                 {session.genre}
//                                             </Badge>
//                                         </div>
//                                         <p className="text-xs text-muted-foreground">
//                                             {session.characterName}
//                                         </p>
//                                     </div>

//                                     {/* Last played */}
//                                     <div className="w-24 text-right">
//                                         <span className="text-xs text-muted-foreground">{session.lastPlayed}</span>
//                                     </div>

//                                     {/* Actions */}
//                                     <div className="w-28 flex justify-end gap-2">
//                                         <Link href={`/game/${session.id}`}>
//                                             <Button
//                                                 size="sm"
//                                                 className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
//                                             >
//                                                 Continue
//                                             </Button>
//                                         </Link>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>

//                         <p className="text-xs text-muted-foreground mt-6 px-4">
//                             {sessions.length} active {sessions.length === 1 ? 'story' : 'stories'}
//                         </p>
//                     </>
//                 )}

//                 {/* Empty state */}
//                 {!isLoading && !error && sessions.length === 0 && (
//                     <div className="border border-border rounded-md p-16 text-center">
//                         <p className="text-4xl mb-4">📖</p>
//                         <p className="text-base font-semibold text-foreground mb-2">No stories yet</p>
//                         <p className="text-sm text-muted-foreground mb-6">
//                             Your first adventure is one click away.
//                         </p>
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
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

const genreVariant: Record<string, string> = {
    Fantasy: 'bg-primary/10 text-primary border-primary/20',
    Horror: 'bg-destructive/10 text-destructive border-destructive/20',
    'Sci-Fi': 'bg-chart-4/10 text-chart-4 border-chart-4/20',
    Noir: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
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

            {/* Header */}
            <div className="border-b border-border">
                <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-10 flex items-end justify-between gap-4">
                    <div>
                        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2 md:mb-3">Library</p>
                        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Your Stories</h1>
                    </div>
                    <Link href="/new-game">
                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
                            + New Story
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">

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

                {/* Sessions — Desktop Table */}
                {!isLoading && !error && sessions.length > 0 && (
                    <>
                        {/* Table: hidden on mobile */}
                        <div className="hidden md:block rounded-md border border-border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="text-xs uppercase tracking-widest text-muted-foreground w-[40%]">
                                            Story
                                        </TableHead>
                                        <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">
                                            Genre
                                        </TableHead>
                                        <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">
                                            Character
                                        </TableHead>
                                        <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">
                                            Last Played
                                        </TableHead>
                                        <TableHead className="text-xs uppercase tracking-widest text-muted-foreground text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sessions.map((session) => (
                                        <TableRow
                                            key={session.id}
                                            className="group hover:bg-card/60 transition-colors"
                                        >
                                            {/* Title */}
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-base shrink-0">
                                                        {genreEmoji[session.genre] ?? '📖'}
                                                    </span>
                                                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate max-w-[200px]">
                                                        {session.title}
                                                    </span>
                                                    {session.status !== 'active' && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs shrink-0 border-destructive/30 text-destructive"
                                                        >
                                                            {session.status === 'dead' ? '💀 Ended' : '🌀 Ended'}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Genre */}
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${genreVariant[session.genre] ?? 'bg-muted text-muted-foreground'}`}>
                                                    {session.genre}
                                                </span>
                                            </TableCell>

                                            {/* Character */}
                                            <TableCell className="text-sm text-muted-foreground">
                                                {session.characterName}
                                            </TableCell>

                                            {/* Last played */}
                                            <TableCell className="text-xs text-muted-foreground">
                                                {session.lastPlayed}
                                            </TableCell>

                                            {/* Actions */}
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/game/${session.id}`}>
                                                        <Button
                                                            size="sm"
                                                            disabled={session.status !== 'active'}
                                                            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs disabled:opacity-40"
                                                        >
                                                            {session.status === 'active' ? 'Continue' : 'View'}
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Cards: shown on mobile instead of table */}
                        <div className="flex flex-col gap-3 md:hidden">
                            {sessions.map((session) => (
                                <div
                                    key={session.id}
                                    className="bg-card border border-border rounded-md p-4 space-y-3"
                                >
                                    {/* Title row */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-base shrink-0">{genreEmoji[session.genre] ?? '📖'}</span>
                                            <span className="text-sm font-semibold text-foreground truncate">
                                                {session.title}
                                            </span>
                                        </div>
                                        {session.status !== 'active' && (
                                            <Badge variant="outline" className="text-xs shrink-0 border-destructive/30 text-destructive">
                                                {session.status === 'dead' ? '💀 Ended' : '🌀 Ended'}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Meta row */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${genreVariant[session.genre] ?? 'bg-muted text-muted-foreground'}`}>
                                            {session.genre}
                                        </span>
                                        <span className="text-xs text-muted-foreground">{session.characterName}</span>
                                        <span className="text-xs text-muted-foreground ml-auto">{session.lastPlayed}</span>
                                    </div>

                                    {/* Action */}
                                    <Link href={`/game/${session.id}`} className="block">
                                        <Button
                                            size="sm"
                                            disabled={session.status !== 'active'}
                                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs disabled:opacity-40"
                                        >
                                            {session.status === 'active' ? 'Continue' : 'View'}
                                        </Button>
                                    </Link>
                                </div>
                            ))}
                        </div>

                        {/* Footer count */}
                        <p className="text-xs text-muted-foreground mt-6">
                            {sessions.length} {sessions.length === 1 ? 'story' : 'stories'} · {sessions.filter(s => s.status === 'active').length} active
                        </p>
                    </>
                )}

                {/* Empty state */}
                {!isLoading && !error && sessions.length === 0 && (
                    <div className="border border-border rounded-md p-12 md:p-16 text-center">
                        <p className="text-3xl md:text-4xl mb-4">📖</p>
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