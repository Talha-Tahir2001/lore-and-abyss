import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface WorldState {
    character: {
        name: string
        avatarColor: string
        genre: string
    }
    stats: {
        hp: number
        maxHp: number
        sanity: number
        maxSanity: number
        gold: number
    }
    inventory: string[]
    location: string
    activeCharacters: string[]
}

interface WorldStateSidebarProps {
    worldState: WorldState
}

export default function WorldStateSidebar({ worldState }: WorldStateSidebarProps) {
    return (
        <div className="w-[30%] border-l border-border bg-card/30 overflow-y-auto">
            <div className="p-6 space-y-8">
                {/* Character Card */}
                <div>
                    <div className="mb-4">
                        <div className={`w-16 h-16 rounded-lg bg-linear-to-br ${worldState.character.avatarColor} mb-4`} />
                        <h3
                            className="text-xl font-bold text-foreground"
                            style={{ fontFamily: 'var(--font-heading)' }}
                        >
                            {worldState.character.name}
                        </h3>
                        <Badge className="bg-purple-500/20 text-purple-300 mt-2">{worldState.character.genre}</Badge>
                    </div>
                </div>

                {/* Stats Section */}
                <div>
                    <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">Stats</h4>

                    {/* HP */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs text-muted-foreground">Health</label>
                            <span className="text-xs text-foreground">
                                {worldState.stats.hp}/{worldState.stats.maxHp}
                            </span>
                        </div>
                        <Progress
                            value={(worldState.stats.hp / worldState.stats.maxHp) * 100}
                            className="h-2 bg-green-950/30"
                        />
                    </div>

                    {/* Sanity */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs text-muted-foreground">Sanity</label>
                            <span className="text-xs text-foreground">
                                {worldState.stats.sanity}/{worldState.stats.maxSanity}
                            </span>
                        </div>
                        <Progress
                            value={(worldState.stats.sanity / worldState.stats.maxSanity) * 100}
                            className="h-2 bg-purple-950/30"
                        />
                    </div>

                    {/* Gold */}
                    <div className="flex items-center justify-between p-3 bg-card border border-border/50 rounded-lg">
                        <span className="text-xs text-muted-foreground">Gold</span>
                        <span className="text-sm font-semibold text-secondary">{worldState.stats.gold}</span>
                    </div>
                </div>

                {/* Inventory */}
                <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">Inventory</h4>
                    <div className="space-y-2">
                        {worldState.inventory.map((item, index) => (
                            <Badge key={index} variant="outline" className="block text-center py-2 border-border/50 text-xs">
                                {item}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Location */}
                <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wide">Location</h4>
                    <p className="text-sm text-muted-foreground bg-card/50 border border-border/50 rounded-lg p-3">
                        {worldState.location}
                    </p>
                </div>

                {/* Active Characters */}
                <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                        Encountered NPCs
                    </h4>
                    <div className="space-y-2">
                        {worldState.activeCharacters.map((character, index) => (
                            <div key={index} className="text-sm text-foreground bg-card/50 border border-border/50 rounded-lg p-2 px-3">
                                • {character}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
