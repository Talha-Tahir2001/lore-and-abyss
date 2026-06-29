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

// ── Specialized Multi-Agent Systems ──────────────────────────────────────────

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

Resolve this combat action realistically. Consider context items.
Return ONLY this JSON:
{
  "damage": number,
  "damageTaken": number,
  "outcome": "victory" | "defeat" | "ongoing" | "fled",
  "combatNarrative": "1-2 sentences describing the combat exchange vividly",
  "updatedHp": number
}`

    try {
        const stream = await invokeModel(prompt, `You are a fair but ruthless combat resolver for a ${genre} game.`)
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

async function runMemoryAgent(storyHistory: Record<string, any>[]): Promise<string> {
    if (storyHistory.length <= 10) return ''

    const oldTurns = storyHistory
        .slice(0, -6)
        .map((t) => `[${t.type.toUpperCase()}]: ${t.content}`)
        .join('\n')

    const prompt = `Summarize this RPG story history into 3-4 sentences.
Include key decisions, major locations, and persistent consequences. Be objective.
Story history:
${oldTurns}`

    try {
        const stream = await invokeModel(prompt, "You are a precise story archivist. Summarize accurately.")
        return await stringifyStream(stream)
    } catch {
        return ''
    }
}

async function runWorldStateAgent(
    genre: string,
    playerAction: string,
    currentState: Record<string, any>
): Promise<Record<string, any>> {
    const prompt = `You are a world state manager for a ${genre} RPG...`
    const stream = await invokeModel(prompt, "You are a precise world state manager. Always return valid JSON only.")
    const raw = await stringifyStream(stream)

    try {
        const cleaned = raw.replace(/```json|```/g, "").trim()
        return JSON.parse(cleaned)
    } catch {
        return currentState
    }
}

async function runToneAgent(genre: string, tensionScore: number): Promise<string> {
    const tensionLabel =
        tensionScore > 75 ? "critical — imminent danger, pulse-pounding" :
            tensionScore > 45 ? "rising — unease growing, stakes increasing" :
                "low — exploratory, atmospheric, mysterious"

    return `You are a ${genre} dungeon master. Current tension: ${tensionLabel} (${tensionScore}/100). Describe events vividly.`
}

async function generateContextualChoices(genre: string, narrativeContext: string): Promise<string[]> {
    const prompt = `Based on the following narrative context in a ${genre} game, generate 3 immersive action items for the player.\nNarrative:\n"${narrativeContext}"\n\nReturn ONLY a JSON array of strings.`
    try {
        const stream = await invokeModel(prompt, "Return valid JSON string arrays only.")
        const raw = await stringifyStream(stream)
        const cleaned = raw.replace(/```json|```/g, "").trim()
        return JSON.parse(cleaned)
    } catch {
        return ["Look around", "Move forward cautiously", "Wait and listen"]
    }
}

// ── Main Controller Route Handler ────────────────────────────────────────────

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

        // Commit user action
        await writeTurn(sessionId, "user", playerAction, [], turnNumber)

        // 1. Evaluate Combat Intercept
        let combatResult = null
        let worldStateOverrides: Record<string, any> = {}

        if (isCombatAction(playerAction)) {
            combatResult = await runCombatAgent(genre, playerAction, worldState)
            worldStateOverrides = {
                hp: combatResult.updatedHp,
                sanity: genre === 'Horror'
                    ? Math.max(0, worldState.sanity - Math.floor(Math.random() * 8))
                    : worldState.sanity,
                tensionScore: Math.min(100, worldState.tensionScore + 15),
            }
        }

        // 2. Execute Remaining Context Analysis Agents concurrently
        const baseStateForWorldAgent = { ...worldState, ...worldStateOverrides }
        const [updatedWorldState, systemPrompt, memorySummary] = await Promise.all([
            runWorldStateAgent(genre, playerAction, baseStateForWorldAgent),
            runToneAgent(genre, worldState.tensionScore),
            runMemoryAgent(storyHistory)
        ])

        // Ensure Combat results maintain priority authority on health metrics
        if (combatResult) {
            updatedWorldState.hp = combatResult.updatedHp
        }

        const isDead = updatedWorldState.hp <= 0
        const isInsane = updatedWorldState.sanity <= 0

        const encoder = new TextEncoder()
        const customStream = new TransformStream()
        const writer = customStream.writable.getWriter()

        const processStream = async () => {
            let finalizedNarrative = ""
            let finalizedChoices: string[] = []
            let isGameOver = false

            if (isDead || isInsane) {
                isGameOver = true
                const endingPrompt = `You are a ${genre} dungeon master writing a dramatic final ending. The adventurer has met their end due to being ${isDead ? 'killed' : 'driven insane'}.`
                const stream = await invokeModel(endingPrompt, systemPrompt)

                for await (const chunk of stream) {
                    finalizedNarrative += chunk
                    await writer.write(encoder.encode(chunk))
                }
            } else {
                // 3. Construct Narrative Prompt passing Memory & Combat metadata structures
                const recentHistory = storyHistory.slice(-6).map((t) => `[${t.type.toUpperCase()}]: ${t.content}`).join("\n")
                const combatContext = combatResult
                    ? `\n[COMBAT EVENT]: ${combatResult.combatNarrative}. Player dealt ${combatResult.damage} DMG, took ${combatResult.damageTaken} DMG.`
                    : ''

                const prompt = `${memorySummary ? `Story Chronicles Archive (Summary):\n${memorySummary}\n\n` : ''}Recent chronological interactions:\n${recentHistory}${combatContext}\n\nCurrent State Vector:\n- Location: ${updatedWorldState.location || 'Unknown'}\n- HP: ${updatedWorldState.hp}/${updatedWorldState.maxHp}\n- Sanity: ${updatedWorldState.sanity}/${updatedWorldState.maxSanity}\n\nPlayer Intention: "${playerAction}"\n\nGenerate the next phase of the journey as pure fluid markdown storytelling. Do not output JSON.`

                const stream = await invokeModel(prompt, systemPrompt)

                for await (const chunk of stream) {
                    finalizedNarrative += chunk
                    await writer.write(encoder.encode(chunk))
                }

                // Gather choices over the pipeline after text finishes streaming
                finalizedChoices = await generateContextualChoices(genre, finalizedNarrative)
            }

            // 4. Persistence Transaction Synced
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

            // 5. Append Metadata Tail Payload securely
            const metadataPayload = {
                __METADATA__: true,
                choices: finalizedChoices,
                worldState: updatedWorldState,
                gameOver: isGameOver,
                gameOverReason: isGameOver ? (isDead ? "dead" : "insane") : null
            }

            await writer.write(encoder.encode(`\n||METADATA_SPLIT||\n${JSON.stringify(metadataPayload)}`))
            await writer.close()
        }

        processStream()

        return new Response(customStream.readable, {
            headers: { "Content-Type": "text/html; charset=utf-8" },
        })

    } catch (err) {
        console.error("Critical Post Error:", err)
        return new Response("Internal Server Error", { status: 500 })
    }
}