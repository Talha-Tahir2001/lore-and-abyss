'use client';
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'

const genres = [
    {
        id: 'fantasy',
        emoji: '🗡️',
        name: 'Fantasy',
        desc: 'Swords, sorcery, and ancient prophecies',
        flavor: 'You are the chosen one — or perhaps the villain. Magic is real, and it costs something.',
    },
    {
        id: 'horror',
        emoji: '🩸',
        name: 'Horror',
        desc: 'Something watches from the dark',
        flavor: 'Survival is not guaranteed. The tension meter climbs. Something is always close.',
    },
    {
        id: 'scifi',
        emoji: '🚀',
        name: 'Sci-Fi',
        desc: 'The stars hold no mercy',
        flavor: 'Deep space, rogue AI, or a dying colony. Technology is your weapon and your curse.',
    },
    {
        id: 'noir',
        emoji: '🕵️',
        name: 'Noir',
        desc: "Everyone's hiding something",
        flavor: 'Rain-slicked streets, unreliable allies, and a case that keeps getting messier.',
    },
]

export default function NewGame() {
    const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
    const [characterName, setCharacterName] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    // const { userId } = await auth()
    const selected = genres.find((g) => g.id === selectedGenre)

    const handleEnterStory = async () => {
        if (!selectedGenre || !characterName.trim()) return
        setIsLoading(true)
        setError(null)

        try {
            const res = await fetch("/api/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    genre: selectedGenre,
                    characterName: characterName.trim(),
                    userId: "anonymous", // TODO: replace with real auth later
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            // Store genre + character in sessionStorage so game page can read it
            sessionStorage.setItem(`session_${data.sessionId}`, JSON.stringify({
                genre: selectedGenre,
                characterName: characterName.trim(),
                sessionName: data.sessionName,
                openingNarrative: data.openingNarrative,
            }))

            window.location.href = `/game/${data.sessionId}`
        } catch (err: any) {
            setError(err.message ?? "Something went wrong")
            setIsLoading(false)
        }
    }

    return (
        <main className="min-h-[calc(100vh-4rem)] bg-background">

            {/* Page header */}
            <div className="border-b border-border">
                <div className="max-w-5xl mx-auto px-6 py-10">
                    <p className="text-xs text-muted-foreground tracking-widest uppercase mb-3">New Game</p>
                    <h1 className="text-4xl font-bold text-foreground">Choose your world</h1>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-12">
                <div className="grid md:grid-cols-3 gap-8">

                    {/* Left: genre grid */}
                    <div className="md:col-span-2 space-y-3">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-5">Genre</p>

                        {genres.map((genre) => (
                            <button
                                key={genre.id}
                                onClick={() => setSelectedGenre(genre.id)}
                                className={`w-full text-left flex items-start gap-5 p-5 rounded-md border transition-all
                  ${selectedGenre === genre.id
                                        ? 'border-primary bg-primary/5 text-foreground'
                                        : 'border-border bg-card hover:border-primary/40 text-foreground'
                                    }`}
                            >
                                {/* Selection indicator */}
                                <div className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${selectedGenre === genre.id ? 'border-primary' : 'border-muted-foreground/40'
                                    }`}>
                                    {selectedGenre === genre.id && (
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-lg">{genre.emoji}</span>
                                        <span className="font-semibold text-sm">{genre.name}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{genre.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Right: config panel */}
                    <div className="space-y-6">

                        {/* Genre flavor */}
                        <div className="bg-card border border-border rounded-md p-5 min-h-[100px]">
                            {selected ? (
                                <>
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">{selected.name}</p>
                                    <p className="text-sm text-foreground leading-relaxed">{selected.flavor}</p>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">Select a genre to see details.</p>
                            )}
                        </div>

                        {/* Character name */}
                        <div>
                            <label className="text-xs text-muted-foreground uppercase tracking-widest block mb-2">
                                Character name
                            </label>
                            <Input
                                placeholder="Enter name..."
                                value={characterName}
                                onChange={(e) => setCharacterName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && selectedGenre && characterName.trim()) handleEnterStory()
                                }}
                                className="bg-background"
                            />
                        </div>

                        {/* Validation hint */}
                        {!selectedGenre && (
                            <p className="text-xs text-muted-foreground">← Pick a genre first</p>
                        )}

                        {/* Actions */}
                        <div className="space-y-2 pt-2">
                            {error && (
                                <p className="text-xs text-destructive">{error}</p>
                            )}
                            <Button
                                onClick={handleEnterStory}
                                disabled={!selectedGenre || !characterName.trim()}
                                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                {isLoading ? "Creating your world..." : "Enter the Story"}
                            </Button>
                            <Link href="/">
                                <Button variant="outline" className="w-full">
                                    Back
                                </Button>
                            </Link>
                        </div>

                        {/* Summary */}
                        {selectedGenre && characterName.trim() && (
                            <div className="bg-muted/30 border border-border rounded-md p-4 text-xs text-muted-foreground space-y-1">
                                <p><span className="text-foreground">Genre:</span> {selected?.name}</p>
                                <p><span className="text-foreground">Character:</span> {characterName}</p>
                                <p><span className="text-foreground">Agent setup:</span> Narrator · World State · Tone</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}