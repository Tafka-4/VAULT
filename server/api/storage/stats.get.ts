import { defineEventHandler } from 'h3';
import fs from 'node:fs';
import { requireAuth } from '~/server/utils/auth';
import { getAppConfig } from '~/server/utils/config';
import { listFiles } from '~/server/services/fileService';

const FALLBACK_TOTAL_BYTES = 512 * 1024 * 1024 * 1024; // 512GB baseline

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event);
  const cfg = getAppConfig();

  let stats: fs.StatsFs | null = null;
  if (typeof fs.statfsSync === 'function') {
    try {
      stats = fs.statfsSync(cfg.dataDir);
    } catch (error) {
      console.warn('[storage] Unable to read statfs for data dir', error);
    }
  }

  const blockSize = stats?.bsize ?? 1;
  const files = listFiles(auth.user.id);
  const userBytes = files.reduce((sum, file) => sum + file.size, 0);

  let totalBytes = FALLBACK_TOTAL_BYTES;
  let freeBytes = Math.max(FALLBACK_TOTAL_BYTES - userBytes, 0);
  let usedBytes = Math.min(userBytes, FALLBACK_TOTAL_BYTES);

  if (stats) {
    totalBytes = blockSize * stats.blocks;
    freeBytes = blockSize * stats.bfree;
    usedBytes = Math.max(totalBytes - freeBytes, 0);
  }

  return {
    data: {
      totalBytes,
      freeBytes,
      usedBytes,
      userBytes,
    },
  };
});
