import { NextRequest, NextResponse } from "next/server"
import { PutCommand, QueryCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb"
import { db, TABLE_NAME } from "@/lib/dynamodb"
import { invokeModel } from "@/lib/ai"
import { auth } from "@clerk/nextjs/server"

// ── Core Utilities ────────────────────────────────────────────────────────────

async function stringifyStream(stream: AsyncGenerator<string, void, unknown>): Promise<string> {
    let fullText = ""
    for await (const chunk of stream) {
        fullText += chunk
    }
    return fullText
}

async function getWorldState(sessionId: string) {
    const result = await db.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { pk: `SESSION#${sessionId}`, sk: "WORLDSTATE" },
    }))
    return result.Item
}

async function getStoryHistory(sessionId: string) {
    const result = await db.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
        ExpressionAttributeValues: {
            ":pk": `SESSION#${sessionId}`,
            ":prefix": "TURN#",
        },
        ScanIndexForward: true,
    }))
    return result.Items ?? []
}

async function updateWorldState(sessionId: string, updates: Record<string, any>) {
    await db.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
            pk: `SESSION#${sessionId}`,
            sk: "WORLDSTATE",
            ...updates,
            updatedAt: new Date().toISOString(),
        },
    }))
}

async function writeTurn(
    sessionId: string,
    type: "user" | "ai" | "system",
    content: string,
    choices: string[],
    turnNumber: number
) {
    const now = new Date().toISOString()
    await db.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
            pk: `SESSION#${sessionId}`,
            sk: `TURN#${now}`,
            type,
            content,
            choices,
            turnNumber,
            createdAt: now,
        },
    }))
}

// ── Agent: Combat ─────────────────────────────────────────────────────────────

function isCombatAction(playerAction: string): boolean {
    const combatKeywords = [
        'attack', 'fight', 'hit', 'strike', 'stab', 'shoot', 'punch', 'kick',
        'slash', 'swing', 'throw', 'cast', 'fire', 'charge', 'kill',
        'draw sword', 'draw weapon', 'engage', 'combat', 'battle', 'defend',
        'dodge', 'parry', 'block', 'flee', 'run', 'escape'
    ]
    const lower = playerAction.toLowerCase()
    return combatKeywords.some((kw) => lower.includes(kw))
}

async function runCombatAgent(
    genre: string,
    playerAction: string,
    worldState: Record<string, any>
): Promise<{
    damage: number
    damageTaken: number
    outcome: 'victory' | 'defeat' | 'ongoing' | 'fled'
    combatNarrative: string
    updatedHp: number
}> {
    const prompt = `You are a combat resolver for a ${genre} RPG.
Player stats:
- HP: ${worldState.hp}/${worldState.maxHp}
- Sanity: ${worldState.sanity}/${worldState.maxSanity}
- Inventory: ${worldState.inventory?.join(', ') || 'None'}
- Tension: ${worldState.tensionScore}/100

Player action: "${playerAction}"

Resolve this combat action realistically. Consider the player's inventory and tension level.
Return ONLY this JSON, no markdown fences, no explanation:
{
  "damage": number (damage player deals, 0-30),
  "damageTaken": number (damage player takes, 0-25),
  "outcome": "victory" | "defeat" | "ongoing" | "fled",
  "combatNarrative": "1-2 sentences describing the combat exchange vividly",
  "updatedHp": number (current hp minus damageTaken, minimum 0)
}`

    try {
        const stream = await invokeModel(prompt, `You are a fair but ruthless combat resolver for a ${genre} game. Always return valid JSON only.`)
        const raw = await stringifyStream(stream)
        const cleaned = raw.replace(/```json|```/g, '').trim()
        return JSON.parse(cleaned)
    } catch {
        const damageTaken = Math.floor(Math.random() * 15) + 5
        return {
            damage: Math.floor(Math.random() * 20) + 5,
            damageTaken,
            outcome: 'ongoing',
            combatNarrative: 'The exchange is brutal and swift.',
            updatedHp: Math.max(0, worldState.hp - damageTaken),
        }
    }
}

// ── Agent: Memory ─────────────────────────────────────────────────────────────

async function runMemoryAgent(storyHistory: Record<string, any>[]): Promise<string> {
    if (storyHistory.length <= 10) return ''

    const oldTurns = storyHistory
        .slice(0, -6)
        .map((t) => `[${t.type.toUpperCase()}]: ${t.content}`)
        .join('\n')

    const prompt = `Summarize this RPG story history into 3-4 sentences.
Include: key decisions made, important NPCs encountered, locations visited, and major consequences.
Be specific and factual. This summary will be injected as context for the next story beat.

Story history:
${oldTurns}`

    try {
        const stream = await invokeModel(prompt, "You are a precise story archivist. Summarize accurately and concisely.")
        return await stringifyStream(stream)
    } catch {
        return ''
    }
}

// ── Agent: World State ────────────────────────────────────────────────────────

async function runWorldStateAgent(
    genre: string,
    playerAction: string,
    currentState: Record<string, any>
): Promise<Record<string, any>> {
    // FIX: The full prompt was missing — this was causing silent JSON parse failures
    // and the world state never updating. Now fully specified.
    const prompt = `You are a world state manager for a ${genre} RPG.

Current world state:
${JSON.stringify(currentState, null, 2)}

Player action: "${playerAction}"

Based on this action, update the world state. Return ONLY a valid JSON object with these exact fields:
{
  "hp": number (0-${currentState.maxHp}),
  "maxHp": ${currentState.maxHp},
  "sanity": number (0-${currentState.maxSanity}),
  "maxSanity": ${currentState.maxSanity},
  "gold": number,
  "location": string,
  "inventory": string[],
  "activeCharacters": string[],
  "tensionScore": number (0-100)
}

Rules:
- Only change values that logically result from this action
- tensionScore increases for dangerous or frightening actions, decreases for safe ones
- inventory changes only if the player explicitly picks up or drops something
- activeCharacters includes any NPCs currently present in the scene
- Return ONLY the JSON object, no explanation, no markdown fences`

    try {
        const stream = await invokeModel(prompt, "You are a precise world state manager. Always return valid JSON only.")
        const raw = await stringifyStream(stream)
        const cleaned = raw.replace(/```json|```/g, "").trim()
        return JSON.parse(cleaned)
    } catch {
        // Return current state unchanged if parsing fails
        return currentState
    }
}

// ── Agent: Tone ───────────────────────────────────────────────────────────────

async function runToneAgent(genre: string, tensionScore: number): Promise<string> {
    const tensionLabel =
        tensionScore > 75 ? "critical — imminent danger, pulse-pounding" :
            tensionScore > 45 ? "rising — unease growing, stakes increasing" :
                "low — exploratory, atmospheric, mysterious"

    return `You are a ${genre} dungeon master. Current tension: ${tensionLabel} (${tensionScore}/100).
Maintain consistent ${genre} atmosphere. Be vivid and specific.
${genre === "Horror" ? "Build dread. Never resolve tension cheaply." : ""}
${genre === "Fantasy" ? "Use rich world-building details. Magic has weight." : ""}
${genre === "Sci-Fi" ? "Ground the fantastical in technical plausibility." : ""}
${genre === "Noir" ? "Everyone has an angle. Nothing is as it seems." : ""}
Keep responses to 3-4 sentences maximum. End in a way that demands a decision.`
}

// ── Agent: Contextual Choices ─────────────────────────────────────────────────

async function generateContextualChoices(genre: string, narrativeContext: string): Promise<string[]> {
    const prompt = `Based on this narrative in a ${genre} game, generate exactly 3 short, specific action choices for the player.
Each choice should be 4-8 words, concrete, and distinct from each other.

Narrative:
"${narrativeContext.slice(0, 500)}"

Return ONLY a JSON array of 3 strings, no markdown, no explanation:
["choice 1", "choice 2", "choice 3"]`

    try {
        const stream = await invokeModel(prompt, "Return a valid JSON array of exactly 3 strings only.")
        const raw = await stringifyStream(stream)
        const cleaned = raw.replace(/```json|```/g, "").trim()
        const parsed = JSON.parse(cleaned)
        // Guard: ensure we always get exactly 3 strings
        if (Array.isArray(parsed) && parsed.length >= 3) {
            return parsed.slice(0, 3)
        }
        throw new Error("Invalid choices format")
    } catch {
        return ["Look around carefully", "Move forward cautiously", "Wait and listen"]
    }
}

// ── Main Route Handler ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const { sessionId, playerAction, genre, turnNumber } = await req.json()
        const { userId } = await auth()

        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        if (!sessionId || !playerAction || !genre) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

        const [worldState, storyHistory] = await Promise.all([
            getWorldState(sessionId),
            getStoryHistory(sessionId),
        ])

        if (!worldState) return NextResponse.json({ error: "Session not found" }, { status: 404 })

        // Commit user action to DynamoDB immediately
        await writeTurn(sessionId, "user", playerAction, [], turnNumber)

        // ── 1. Combat intercept ───────────────────────────────────────────────
        let combatResult = null
        let worldStateOverrides: Record<string, any> = {}

        if (isCombatAction(playerAction)) {
            combatResult = await runCombatAgent(genre, playerAction, worldState)
            worldStateOverrides = {
                hp: combatResult.updatedHp,
                // Sanity drains slightly in Horror combat
                sanity: genre === 'Horror'
                    ? Math.max(0, worldState.sanity - Math.floor(Math.random() * 8))
                    : worldState.sanity,
                tensionScore: Math.min(100, worldState.tensionScore + 15),
            }
        }

        // ── 2. Parallel agents ────────────────────────────────────────────────
        const baseState = { ...worldState, ...worldStateOverrides }
        const [updatedWorldState, systemPrompt, memorySummary] = await Promise.all([
            runWorldStateAgent(genre, playerAction, baseState),
            runToneAgent(genre, worldState.tensionScore),
            runMemoryAgent(storyHistory),
        ])

        // Combat agent is authoritative on HP — merge its result back
        if (combatResult) {
            updatedWorldState.hp = combatResult.updatedHp
        }

        const isDead = updatedWorldState.hp <= 0
        const isInsane = updatedWorldState.sanity <= 0

        // ── 3. Stream the narrative ───────────────────────────────────────────
        const encoder = new TextEncoder()
        const customStream = new TransformStream()
        const writer = customStream.writable.getWriter()

        const processStream = async () => {
            let finalizedNarrative = ""
            let finalizedChoices: string[] = []
            const isGameOver = isDead || isInsane

            try {
                if (isGameOver) {
                    const endingPrompt = `You are a ${genre} dungeon master writing a dramatic, final ending.
The adventurer has ${isDead ? 'died — HP reached zero' : 'lost their sanity — Sanity reached zero'}.

Recent story (last 3 turns):
${storyHistory.slice(-3).map(t => `[${t.type.toUpperCase()}]: ${t.content}`).join('\n')}

Write a powerful, atmospheric 3-4 sentence ending. Make it feel earned and final.
${isDead ? 'Describe their death vividly.' : 'Describe their descent into madness.'}`

                    const stream = await invokeModel(endingPrompt, systemPrompt)
                    for await (const chunk of stream) {
                        finalizedNarrative += chunk
                        await writer.write(encoder.encode(chunk))
                    }
                    finalizedChoices = []

                } else {
                    // Build narrator context
                    const recentHistory = storyHistory
                        .slice(-6)
                        .map((t) => `[${t.type.toUpperCase()}]: ${t.content}`)
                        .join("\n")

                    const combatContext = combatResult
                        ? `\n[COMBAT]: ${combatResult.combatNarrative} Player dealt ${combatResult.damage} damage, took ${combatResult.damageTaken} damage.`
                        : ''

                    const narratorPrompt = `${memorySummary ? `Story so far (summary):\n${memorySummary}\n\n` : ''}Recent events:
${recentHistory}${combatContext}

Current world state:
- Location: ${updatedWorldState.location || 'Unknown'}
- HP: ${updatedWorldState.hp}/${updatedWorldState.maxHp}
- Sanity: ${updatedWorldState.sanity}/${updatedWorldState.maxSanity}
- Tension: ${updatedWorldState.tensionScore}/100
- Present: ${updatedWorldState.activeCharacters?.join(', ') || 'No one'}

Player action: "${playerAction}"

Write what happens next in 3-4 vivid sentences. Do not include choices — write pure narrative prose only.`

                    const stream = await invokeModel(narratorPrompt, systemPrompt)
                    for await (const chunk of stream) {
                        finalizedNarrative += chunk
                        await writer.write(encoder.encode(chunk))
                    }

                    // Generate choices after narrative completes
                    finalizedChoices = await generateContextualChoices(genre, finalizedNarrative)
                }

                // ── 4. Persist everything in parallel ────────────────────────
                await Promise.all([
                    updateWorldState(sessionId, updatedWorldState),
                    writeTurn(sessionId, "ai", finalizedNarrative, finalizedChoices, turnNumber + 1),
                    db.send(new UpdateCommand({
                        TableName: TABLE_NAME,
                        Key: { pk: `USER#${userId}`, sk: `SESSION#${sessionId}` },
                        UpdateExpression: "SET lastPlayedAt = :now" + (isGameOver ? ", #status = :status" : ""),
                        ExpressionAttributeNames: isGameOver ? { "#status": "status" } : undefined,
                        ExpressionAttributeValues: {
                            ":now": new Date().toISOString(),
                            ...(isGameOver && { ":status": isDead ? "dead" : "insane" })
                        },
                    }))
                ])

                // ── 5. Append metadata tail ───────────────────────────────────
                const metadataPayload = {
                    __METADATA__: true,
                    choices: finalizedChoices,
                    worldState: updatedWorldState,
                    gameOver: isGameOver,
                    gameOverReason: isGameOver ? (isDead ? "dead" : "insane") : null
                }

                await writer.write(encoder.encode(`\n||METADATA_SPLIT||\n${JSON.stringify(metadataPayload)}`))

            } catch (err) {
                console.error("Stream processing error:", err)
                await writer.write(encoder.encode("\n[Story generation failed. Please try again.]"))
            } finally {
                await writer.close()
            }
        }

        // Fire processStream without awaiting — the response streams back live
        processStream()

        // FIX: text/plain prevents browser buffering that text/html can cause
        return new Response(customStream.readable, {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
        })

    } catch (err) {
        console.error("POST /api/turn error:", err)
        return new Response("Internal Server Error", { status: 500 })
    }
}