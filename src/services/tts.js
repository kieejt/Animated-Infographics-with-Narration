export function getTTSAudioUrls(text, lang = 'en') {
  if (!text) return [];

  // Simple clean up
  const cleanText = text.replace(/[\n\r]/g, ' ');
  
  // Split into chunks approx 200 chars (Google TTS limit is around 200)
  const MAX_LENGTH = 200;
  const words = cleanText.split(' ');
  const chunks = [];
  let currentChunk = '';

  words.forEach(word => {
    if ((currentChunk + word).length < MAX_LENGTH) {
      currentChunk += (currentChunk ? ' ' : '') + word;
    } else {
      chunks.push(currentChunk);
      currentChunk = word;
    }
  });
  if (currentChunk) chunks.push(currentChunk);

  return chunks.map((chunk, index) => ({
    // url: `https://translate.google.com/translate_tts?ie=UTF-8&client=gtx&q=${encodeURIComponent(chunk)}&tl=en`,
    // New local proxy URL
    url: `/api/tts?text=${encodeURIComponent(chunk)}&lang=${lang}`,
    shortText: chunk,
    index
  }));
}
