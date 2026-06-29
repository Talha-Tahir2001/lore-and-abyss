import { NextRequest, NextResponse } from "next/server"
import { QueryCommand } from "@aws-sdk/lib-dynamodb"
import { db, TABLE_NAME } from "@/lib/dynamodb"
import { auth } from "@clerk/nextjs/server"

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const result = await db.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
            ExpressionAttributeValues: {
                ":pk": `USER#${userId}`,
                ":prefix": "SESSION#",
            },
            ScanIndexForward: false, // most recent first
        }))

        const sessions = (result.Items ?? []).map((item) => ({
            id: item.sessionId,
            genre: item.genre,
            title: item.sessionName,
            characterName: item.characterName,
            lastPlayed: formatRelativeTime(item.lastPlayedAt),
            status: item.status,
        }))

        return NextResponse.json({ sessions })
    } catch (err) {
        console.error("GET /api/sessions error:", err)
        return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
    }
}

function formatRelativeTime(isoString: string): string {
    const diff = Date.now() - new Date(isoString).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "just now"
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
    return `${days} day${days === 1 ? "" : "s"} ago`
}