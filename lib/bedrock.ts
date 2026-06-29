import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime"

const bedrock = new BedrockRuntimeClient({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
})

export async function invokeModel(prompt: string, systemPrompt?: string): Promise<string> {
    const payload = {
        anthropic_version: "bedrock-2026-06-25",
        max_tokens: 1024,
        system: systemPrompt ?? "You are a helpful assistant.",
        messages: [
            { role: "user", content: prompt }
        ],
    }

    const command = new InvokeModelCommand({
        modelId: process.env.AWS_BEDROCK_MODEL_ID!, // anthropic.claude-3-haiku-20240307-v1:0
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(payload),
    })

    const response = await bedrock.send(command)
    const decoded = JSON.parse(Buffer.from(response.body).toString("utf-8"))
    return decoded.content[0].text
}