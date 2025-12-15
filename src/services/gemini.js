import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateNarration(apiKey, csvData, scenes, languageCode = 'en') {
  if (!apiKey) throw new Error("API Key is required");
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // Map code to full language name for the prompt
  const langMap = {
    'en': 'English', 'en-GB': 'English', 'en-AU': 'English',
    'vi': 'Vietnamese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'fr': 'French',
    'es': 'Spanish',
    'de': 'German'
  };
  const targetLanguage = langMap[languageCode] || 'English';

  // Create a summary of data (first 5 rows)
  const dataPreview = JSON.stringify(csvData.slice(0, 5));
  
  // Calculate total duration
  const totalDuration = scenes.reduce((acc, s) => acc + (s.duration || 5), 0);
  // Adjust word count per language if needed (approx)
  const targetWordCount = Math.round(totalDuration * 2.5); 

  const scenesDesc = scenes.map((s, i) => {
    const activeColumns = (s.yColumns && s.yColumns.length > 0) ? s.yColumns.join(' and ') : s.yAxis;
    return `Scene ${i+1} (${s.duration || 5}s): ${s.type} chart titled "${s.title}" visualization showing specifically [${activeColumns}] grouped by ${s.xAxis}.`
  }).join('\n');

  const prompt = `
    I am creating an animated infographic video that tells a story through data.
    Here is a preview of the dataset: ${dataPreview}
    
    The video structure is as follows (Total Time: ${totalDuration} seconds):
    ${scenesDesc}
    
    Write a compelling, storytelling voiceover script for this video IN ${targetLanguage.toUpperCase()}.
    
    Crucial Style Guidelines:
    1. **Language**: The script MUST be written entirely in ${targetLanguage}.
    2. **Storytelling Tone**: Do not just read the numbers. Explain the "why" and the narrative behind the trends. Make it sound like a high-quality explainer video or documentary.
    3. **Context Aware**: When describing a scene, YOU MUST explicitly mention the specific data variables shown (e.g. if the scene shows "Revenue", talk about Revenue). match the script EXACTLY to the visual content described for that scene.
    4. **Engaging & Punchy**: Use energetic, conversational language. Avoid robotic phrases like "As shown in the chart".
    5. **Focus on Insights**: Highlight the peaks, troughs, and key takeaways for the specific columns shown.
    6. **Infographic Flow**: Connect the scenes smoothly as if taking the viewer on a journey.
    7. **Timing**: The script MUST be approximately ${targetWordCount} words long to fit the ${totalDuration}-second video exactly. Do not overwrite.
    
    Do not include any visual directions. Just the spoken text.
    IMPORTANT: Do NOT use markdown formatting. No asterisks (**), no bolding, no italics. Return clean, plain text only.
    Return ONLY the raw text.
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
