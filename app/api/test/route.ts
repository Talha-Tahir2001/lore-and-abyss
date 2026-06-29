import { invokeModel } from "@/lib/ai"
import { NextResponse } from "next/server"

export async function GET() {
    const result = await invokeModel(
        "Say hello in one sentence.",
        "You are a narrative RPG dungeon master."
    )
    return NextResponse.json({ result })
}