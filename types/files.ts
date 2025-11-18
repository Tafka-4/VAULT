export type ZipEntrySummary = {
  name: string;
  directory: boolean;
  compressedSize: number;
  uncompressedSize: number;
};

export type ZipEntriesPayload = {
  entries: ZipEntrySummary[];
  totalEntries: number;
  truncated: boolean;
};
