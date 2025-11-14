export function chunkBuffer(buffer: Buffer, size: number): Buffer[] {
  const chunks: Buffer[] = [];
  for (let offset = 0; offset < buffer.length; offset += size) {
    chunks.push(buffer.subarray(offset, Math.min(offset + size, buffer.length)));
  }
  return chunks;
}
