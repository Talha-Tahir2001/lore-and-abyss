import { NextRequest, NextResponse } from "next/server"
import { PutCommand } from "@aws-sdk/lib-dynamodb"
import { db, TABLE_NAME } from "@/lib/dynamodb"
import { invokeModel } from "@/lib/ai"
import { auth } from "@clerk/nextjs/server"

// ── Helper to Consume Streams completely on the Server ────────────────────────
async function stringifyStream(stream: AsyncGenerator<string, void, unknown>): Promise<string> {
    let fullText = ""
    for await (const chunk of stream) {
        fullText += chunk
    }
    return fullText
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { genre, characterName } = await req.json()

        if (!genre || !characterName) {
            return NextResponse.json(
                { error: "genre and characterName are required" },
                { status: 400 }
            )
        }

        const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        const now = new Date().toISOString()

        const openingPrompt = `You are a dungeon master starting a new ${genre} story.
The player's character name is "${characterName}".
Write a compelling 2-3 sentence opening scene that sets the atmosphere.
End with the character in an interesting situation that demands a decision.
Be vivid and specific. Do not offer choices yet.`

        // 1. FIXED: Resolve the stream into a string
        const openingStream = await invokeModel(
            openingPrompt,
            `You are a ${genre} dungeon master. Be atmospheric, concise, and immersive.`
        )
        const openingNarrative = await stringifyStream(openingStream)

        const titlePrompt = `Based on this opening scene, generate a short evocative title (3-5 words) for this ${genre} story. Return only the title, nothing else.\n\n${openingNarrative}`

        // 2. FIXED: Resolve the title stream into a string
        const titleStream = await invokeModel(titlePrompt)
        const rawSessionName = await stringifyStream(titleStream)
        const sessionName = rawSessionName.trim()

        // 3. Write to DynamoDB (Now safely receiving processed strings)
        await db.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                pk: `USER#${userId}`,
                sk: `SESSION#${sessionId}`,
                sessionId,
                userId,
                genre,
                characterName,
                sessionName,
                createdAt: now,
                lastPlayedAt: now,
                status: "active",
            },
        }))

        await db.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                pk: `SESSION#${sessionId}`,
                sk: "WORLDSTATE",
                hp: 100,
                maxHp: 100,
                sanity: 100,
                maxSanity: 100,
                gold: 50,
                location: "Unknown",
                inventory: ["Torch", "Basic Supplies"],
                activeCharacters: [],
                tensionScore: 10,
                updatedAt: now,
            },
        }))

        await db.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                pk: `SESSION#${sessionId}`,
                sk: `TURN#${now}`,
                type: "system",
                content: openingNarrative,
                choices: [],
                turnNumber: 0,
                createdAt: now,
            },
        }))

        return NextResponse.json({
            sessionId,
            sessionName,
            openingNarrative,
        })

    } catch (err) {
        console.error("POST /api/session error:", err)
        return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
    }
}