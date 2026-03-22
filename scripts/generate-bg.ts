import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });
  
  console.log("Generating image...");
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: 'A beautiful 16-bit pixel art background for a 2D platformer game. Blue sky, fluffy clouds, distant mountains, green hills. Retro video game style, clear pixel art.',
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const base64Data = part.inlineData.data;
      const outPath = path.join(process.cwd(), 'public', 'pixel-bg.png');
      fs.writeFileSync(outPath, Buffer.from(base64Data, 'base64'));
      console.log('Image saved to', outPath);
      return;
    }
  }
  console.log('No image found in response');
}

main().catch(console.error);
