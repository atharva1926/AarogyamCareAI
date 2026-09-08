import 'dotenv/config'
// @ts-expect-error cors typings may not be installed in this project.
import cors from 'cors'
// @ts-expect-error Express typings may not be installed in this project.
import express from 'express'
import { GoogleGenAI } from '@google/genai'

const app = express()
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

app.use(
  cors({
    origin: true,
  }),
)
app.use(express.json())

app.post('/api/chat', async (req: any, res: any) => {
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : ''

  if (!message) {
    return res.status(400).json({ message: 'A message is required.' })
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error('Gemini is not configured: GEMINI_API_KEY is missing.')
    return res.status(503).json({ message: 'AI service is not configured.' })
  }

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL ?? 'gemini-3.6-flash',
      contents: message,
      config: {
        systemInstruction: `You are AarogyamCare AI, a warm and reliable health-information assistant.

Answer the user's latest question directly and completely. Do not write as if you are continuing a previous answer, do not say "as mentioned above", and never leave a response unfinished.

Write every response in polished Markdown that is easy to scan:
- Start with the answer or recommendation; do not repeat the question.
- Keep simple questions concise. For longer answers, use descriptive ## or ### headings, short paragraphs, and whitespace.
- Use **bold** for key conclusions, bullet lists for related points, and numbered lists for procedures.
- Use a Markdown table only when comparing options or specifications makes the answer clearer.
- For technical questions, put code in fenced blocks with the correct language and use inline code for commands, APIs, and filenames.
- Do not use a wall of text. Do not add unnecessary introductions, repetition, or a generic closing question.
- Use emojis only when they clearly improve a warning, tip, or recommendation.
- Match the user's language and tone. Never invent facts, sources, links, statistics, or citations.

Provide general health information only; do not diagnose or claim certainty about a condition. Encourage urgent medical care or local emergency services for severe, sudden, or life-threatening symptoms.`,
      },
    })

    const reply = response.text?.trim()

    if (!reply) {
      return res.status(502).json({ message: 'The AI returned no response.' })
    }

    return res.json({ reply })
  } catch (error) {
    console.error(
      'Gemini request failed:',
      error instanceof Error ? error.message : 'Unknown Gemini error',
    )
    return res.status(502).json({ message: 'Unable to get an AI response right now.' })
  }
})

app.listen(process.env.PORT ?? 3000, () => {
  console.log('Backend running at http://localhost:3000')
})
