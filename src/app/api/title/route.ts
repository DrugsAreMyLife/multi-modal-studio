import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return new Response('No messages provided', { status: 400 });
        }

        // Use a fast, cheap model for titling
        const { text } = await generateText({
            model: openai('gpt-4o-mini'),
            system: 'You are a helpful assistant that generates concise (3-5 words) titles for conversations. You do not use quotes or punctuation like periods.',
            prompt: `Generate a title for the following conversation:\n\n${messages.map((m: any) => `${m.role}: ${m.content}`).join('\n').slice(0, 2000)}`,
        });

        return Response.json({ title: text });
    } catch (error) {
        console.error('Title generation error:', error);
        return new Response('Error generating title', { status: 500 });
    }
}
