import { defineEventHandler } from 'h3';
import fs from 'node:fs';
import { requireAuth } from '~/server/utils/auth';
import { getAppConfig } from '~/server/utils/config';
import { getTotalStoredBytes, getUserStoredBytes } from '~/server/services/fileService';

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

  const blockSize = toNumber(stats?.bsize) || 1;
  const userBytes = getUserStoredBytes(auth.user.id);
  const totalStoredBytes = getTotalStoredBytes();

  let totalBytes = FALLBACK_TOTAL_BYTES;
  let freeBytes = Math.max(FALLBACK_TOTAL_BYTES - totalStoredBytes, 0);
  let usedBytes = Math.min(totalStoredBytes, FALLBACK_TOTAL_BYTES);

  if (stats) {
    const rawTotalBytes = blockSize * toNumber(stats.blocks);
    const freeForUsers = blockSize * toNumber(stats.bavail ?? stats.bfree);
    const accessibleTotal = Math.min(rawTotalBytes, freeForUsers + totalStoredBytes);
    totalBytes = Math.max(accessibleTotal, 0);
    freeBytes = Math.max(Math.min(freeForUsers, totalBytes), 0);
    usedBytes = Math.min(totalStoredBytes, totalBytes);
  }

  usedBytes = Math.min(usedBytes, totalBytes);
  freeBytes = Math.max(Math.min(freeBytes, totalBytes - usedBytes), 0);

  return {
    data: {
      totalBytes,
      freeBytes,
      usedBytes,
      userBytes,
    },
  };
});

function toNumber(value?: number | bigint | null) {
  if (typeof value === 'bigint') {
    return Number(value);
  }
  if (typeof value === 'number') {
    return value;
  }
  return 0;
}
