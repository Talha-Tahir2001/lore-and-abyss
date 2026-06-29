import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useEffect, useRef } from 'react'

interface StorySegment {
    type: 'system' | 'user' | 'ai'
    content: string
}

interface StoryPanelProps {
    genre: string
    sessionName: string
    tensionLevel: number
    storySegments: StorySegment[]
}

export default function StoryPanel({
    genre,
    sessionName,
    tensionLevel,
    storySegments,
}: StoryPanelProps) {
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Auto-scroll to bottom
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [storySegments])

    const genreColors: Record<string, string> = {
        Fantasy: 'bg-blue-500/20 text-blue-300',
        Horror: 'bg-red-500/20 text-red-300',
        'Sci-Fi': 'bg-cyan-500/20 text-cyan-300',
        Noir: 'bg-amber-500/20 text-amber-300',
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="border-b border-border p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2
                            className="text-2xl font-bold text-foreground"
                            style={{ fontFamily: 'var(--font-heading)' }}
                        >
                            {sessionName}
                        </h2>
                        <Badge className={genreColors[genre] || 'bg-purple-500/20 text-purple-300'}>
                            {genre}
                        </Badge>
                    </div>
                </div>

                {/* Tension Meter */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-foreground">Tension</label>
                        <span className="text-sm text-muted-foreground">{tensionLevel}%</span>
                    </div>
                    <Progress value={tensionLevel} className="h-2 bg-red-950/30" />
                </div>
            </div>

            {/* Story Feed */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-4"
                style={{
                    backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(124, 58, 237, 0.05) 0%, transparent 50%)',
                }}
            >
                {storySegments.map((segment, index) => (
                    <div
                        key={index}
                        className={`${segment.type === 'user' ? 'ml-12' : segment.type === 'ai' ? 'mr-0' : 'mx-0'
                            }`}
                    >
                        {segment.type === 'system' && (
                            <div className="bg-card/50 border border-border/50 rounded-lg p-4 text-sm text-muted-foreground italic">
                                {segment.content}
                            </div>
                        )}

                        {segment.type === 'user' && (
                            <div className="bg-primary/20 border border-primary/30 rounded-lg p-4 text-sm text-primary">
                                <p className="font-semibold mb-2">Your Action</p>
                                <p>{segment.content}</p>
                            </div>
                        )}

                        {segment.type === 'ai' && (
                            <div className="bg-card border border-border/50 rounded-lg p-4 text-sm text-foreground leading-relaxed">
                                {segment.content}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
