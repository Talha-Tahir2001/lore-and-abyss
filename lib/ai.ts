import OpenAI from "openai"

const client = new OpenAI({
    apiKey: process.env.AIML_API_KEY!,
    baseURL: process.env.AIML_BASE_URL!,
})

// export async function invokeModel(
//     prompt: string,
//     systemPrompt?: string
// ): Promise<string> {
//     const response = await client.chat.completions.create({
//         model: process.env.AIML_MODEL!,
//         max_tokens: 1024,
//         // stream: true,
//         messages: [
//             {
//                 role: "system",
//                 content: systemPrompt ?? "You are a helpful assistant.",
//             },
//             {
//                 role: "user",
//                 content: prompt,
//             },
//         ],
//     })

//     return response.choices[0].message.content ?? ""
// }

export async function* invokeModel(
    prompt: string,
    systemPrompt?: string
): AsyncGenerator<string, void, unknown> { // 1. Fixed return type and added '*' to 'async function'
    const response = await client.chat.completions.create({
        model: process.env.AIML_MODEL!,
        max_tokens: 4096,
        stream: true, // Streaming is active
        messages: [
            {
                role: "system",
                content: systemPrompt ?? "You are a helpful assistant.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
    })

    for await (const chunk of response) {
        const delta = chunk.choices[0]?.delta?.content // 2. Added optional chaining for safety
        if (delta) {
            yield delta
        }
    }
}