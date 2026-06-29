import { NextRequest, NextResponse } from "next/server"
import { QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb"
import { db, TABLE_NAME } from "@/lib/dynamodb"
import { auth } from "@clerk/nextjs/server"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { sessionId } = await params

        // Load session metadata, world state, and story turns in parallel
        const [sessionResult, worldStateResult, turnsResult] = await Promise.all([
            db.send(new GetCommand({
                TableName: TABLE_NAME,
                Key: {
                    pk: `USER#${userId}`,
                    sk: `SESSION#${sessionId}`,
                },
            })),
            db.send(new GetCommand({
                TableName: TABLE_NAME,
                Key: {
                    pk: `SESSION#${sessionId}`,
                    sk: "WORLDSTATE",
                },
            })),
            db.send(new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
                ExpressionAttributeValues: {
                    ":pk": `SESSION#${sessionId}`,
                    ":prefix": "TURN#",
                },
                ScanIndexForward: true,
            })),
        ])

        if (!sessionResult.Item) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 })
        }

        const session = sessionResult.Item
        const worldState = worldStateResult.Item
        const turns = turnsResult.Items ?? []

        // Map turns to story segments
        const story = turns.map((turn) => ({
            type: turn.type,
            content: turn.content,
        }))

        // Get choices from last AI turn
        const lastAiTurn = [...turns].reverse().find((t) => t.type === "ai")
        const lastChoices = lastAiTurn?.choices ?? []
        const lastTurnNumber = turns.length

        return NextResponse.json({
            session: {
                sessionId: session.sessionId,
                genre: session.genre,
                characterName: session.characterName,
                sessionName: session.sessionName,
                status: session.status,
            },
            worldState,
            story,
            lastChoices,
            lastTurnNumber,
        })

    } catch (err) {
        console.error("GET /api/session/[sessionId] error:", err)
        return NextResponse.json({ error: "Failed to load session" }, { status: 500 })
    }
}