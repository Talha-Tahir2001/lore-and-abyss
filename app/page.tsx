import Link from "next/link"
import { Button } from "@/components/ui/button"
import { RiSwordLine, RiSkullLine, RiRocketLine, RiSearchLine } from "@remixicon/react"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">

      {/* Hero */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 pt-24 pb-20">
          {/* Eyebrow */}
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-8">
            AI Narrative Engine · Open World · Persistent Sessions
          </p>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-[1.05] tracking-tight mb-6">
            Your story.
            <br />
            <span className="text-primary">No limits.</span>
            <span className="text-primary animate-pulse">█</span>
          </h1>

          <p className="text-muted-foreground text-lg max-w-xl leading-relaxed mb-10">
            An AI dungeon master that remembers everything. Choose your genre,
            name your character, and let the world reshape itself around your decisions.
          </p>

          <div className="flex items-center gap-4">
            <Link href="/new-game">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
                Begin Your Story
              </Button>
            </Link>
            <Link href="/sessions">
              <Button size="lg" variant="outline">
                Continue Playing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-border bg-card/40">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-wrap gap-8 text-sm text-muted-foreground">
          <span><span className="text-foreground font-semibold">4</span> genres</span>
          <span><span className="text-foreground font-semibold">∞</span> story paths</span>
          <span><span className="text-foreground font-semibold">3</span> active agents</span>
          <span><span className="text-foreground font-semibold">AWS</span> DynamoDB · Bedrock</span>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-12">How it works</p>

        <div className="grid md:grid-cols-3 gap-px bg-border">
          {[
            {
              index: "01",
              title: "AI Dungeon Master",
              body: "A narrator agent that adapts in real time. It reads your choices, the world state, and the genre tone — then generates what happens next.",
            },
            {
              index: "02",
              title: "Living World State",
              body: "A dedicated world-state agent tracks your inventory, NPC relationships, location, and tension score. Nothing is forgotten.",
            },
            {
              index: "03",
              title: "Every Choice Matters",
              body: "Pick from AI-generated options or write your own action. The story branches, NPCs react, and consequences follow you across sessions.",
            },
          ].map((f) => (
            <div key={f.index} className="bg-background p-8 group">
              <p className="text-xs text-muted-foreground mb-6 font-medium">{f.index}</p>
              <h3 className="text-base font-semibold text-foreground mb-3">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Genre preview */}
      <section className="border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-12">Choose your world</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: RiSwordLine, name: "Fantasy", desc: "Swords, sorcery, ancient prophecies" },
              { icon: RiSkullLine, name: "Horror", desc: "Something watches from the dark" },
              { icon: RiRocketLine, name: "Sci-Fi", desc: "The stars hold no mercy" },
              { icon: RiSearchLine, name: "Noir", desc: "Everyone's hiding something" },
            ].map((g) => (
              <div
                key={g.name}
                className="bg-card border border-border rounded-md p-5 hover:border-primary/60 transition-colors cursor-pointer group"
              >
                <div className="mb-4 text-foreground group-hover:text-primary transition-colors">
                  <g.icon className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{g.name}</p>
                <p className="text-xs text-muted-foreground leading-snug">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA footer strip */}
      <section className="border-t border-border bg-card/40">
        <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Ready to start?</p>
            <p className="text-xs text-muted-foreground">Your first session takes under 30 seconds to set up.</p>
          </div>
          <Link href="/new-game">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Begin Your Story
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Lore & Abyss</span>
          <span>AI-powered narrative engine · Built on AWS + Vercel</span>
        </div>
      </footer>

    </main>
  )
}