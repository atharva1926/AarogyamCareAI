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
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
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
      model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction:
          'You are AarogyamCare AI. Provide general health information only. ' +
          'Do not diagnose. For severe symptoms, direct the user to emergency services or a licensed clinician.',
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
