'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ModeToggle } from './ModeToggle'
import { SignInButton, UserButton, Show } from '@clerk/nextjs'

export default function Navbar() {
    return (
        <nav className="h-14 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">

                <Link href="/" className="flex items-center gap-2 group">
                    <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                        Lore & Abyss
                    </span>
                    <span className="text-primary text-xs animate-pulse">█</span>
                </Link>

                <div className="flex items-center gap-2">

                    <Show when="signed-in">
                        <Link href="/sessions">
                            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
                                My Stories
                            </Button>
                        </Link>
                        <Link href="/new-game">
                            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs">
                                + New Game
                            </Button>
                        </Link>
                        <UserButton />
                    </Show>

                    <Show when="signed-out">
                        <SignInButton mode="modal">
                            <Button size="sm" variant="outline" className="text-xs">
                                Sign In
                            </Button>
                        </SignInButton>
                    </Show>

                    <ModeToggle />
                </div>

            </div>
        </nav>
    )
}