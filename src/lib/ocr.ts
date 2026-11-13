/**
 * Text recognition (OCR) for bill photos, done in the browser with Tesseract.js.
 * The photo never leaves the device. On first use the browser downloads the recognition
 * engine and English language data from public CDNs (jsDelivr and tessdata.projectnaptha.com);
 * after that they are cached.
 */

const MAX_SIDE = 1800; // larger photos are slower and no more accurate

/** Shrink big phone photos before recognition. */
async function prepare(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    if (scale === 1) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b ?? file), 'image/jpeg', 0.92));
  } catch {
    throw new Error('This photo could not be opened. Try a JPG or PNG.');
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Read the text in a bill photo. `onProgress` receives 0..1 while text is recognised. */
export async function readBillText(file: File, onProgress?: (p: number, stage: 'loading' | 'reading') => void): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Choose a photo of the bill (JPG or PNG).');
  const image = await prepare(file);
  onProgress?.(0, 'loading');
  const { createWorker } = await import('tesseract.js');
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  try {
    worker = await createWorker('eng', 1, {
      logger: (m: { status: string; progress: number }) => {
        if (m.status === 'recognizing text') onProgress?.(m.progress, 'reading');
        else onProgress?.(m.progress, 'loading');
      },
    });
    const { data } = await worker.recognize(image);
    return data.text;
  } catch (e) {
    if (e instanceof Error && /fetch|network|load/i.test(e.message)) throw new Error('The text reader could not be downloaded. Check your connection and try again.');
    throw new Error('The text on this photo could not be read. Try a sharper, well-lit photo.');
  } finally {
    await worker?.terminate();
  }
}
