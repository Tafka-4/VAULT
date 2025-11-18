import type { ZipEntriesPayload, ZipEntrySummary } from '~/types/files';

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const ZIP64_EOCD_SIGNATURE = 0x06064b50;
const ZIP64_EOCD_LOCATOR_SIGNATURE = 0x07064b50;
const ZIP64_EXTRA_FIELD_ID = 0x0001;
const MAX_COMMENT_LENGTH = 0xffff;

let cp437Decoder: TextDecoder | null = null;
if (typeof TextDecoder !== 'undefined') {
  try {
    cp437Decoder = new TextDecoder('ibm437');
  } catch {
    cp437Decoder = null;
  }
}

type CentralDirectoryInfo = {
  totalEntries: number;
  centralDirectorySize: number;
  centralDirectoryOffset: number;
};

export function parseZipEntries(buffer: Buffer): ZipEntriesPayload {
  if (buffer.length < 22) {
    throw new Error('유효한 ZIP 파일이 아닙니다.');
  }
  const directoryInfo = readCentralDirectoryInfo(buffer);
  if (directoryInfo.centralDirectoryOffset + directoryInfo.centralDirectorySize > buffer.length) {
    throw new Error('ZIP 중앙 디렉터리 오프셋이 잘못되었습니다.');
  }

  const entries: ZipEntrySummary[] = [];
  let offset = directoryInfo.centralDirectoryOffset;
  for (let index = 0; index < directoryInfo.totalEntries; index++) {
    if (offset + 46 > buffer.length) {
      break;
    }
    if (buffer.readUInt32LE(offset) !== CENTRAL_DIRECTORY_SIGNATURE) {
      break;
    }
    const generalPurposeFlag = buffer.readUInt16LE(offset + 8);
    const compressedSize32 = buffer.readUInt32LE(offset + 20);
    const uncompressedSize32 = buffer.readUInt32LE(offset + 24);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraFieldLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const fileNameStart = offset + 46;
    const fileNameEnd = fileNameStart + fileNameLength;
    if (fileNameEnd > buffer.length) {
      break;
    }

    const nameBuffer = buffer.subarray(fileNameStart, fileNameEnd);
    const extraFieldStart = fileNameEnd;
    const extraFieldEnd = extraFieldStart + extraFieldLength;

    const sizeInfo = resolveEntrySizes(
      buffer,
      extraFieldStart,
      extraFieldEnd,
      uncompressedSize32,
      compressedSize32
    );
    const name = decodeFileName(nameBuffer, Boolean(generalPurposeFlag & 0x800));
    entries.push({
      name,
      directory: name.endsWith('/'),
      compressedSize: sizeInfo.compressedSize,
      uncompressedSize: sizeInfo.uncompressedSize,
    });

    offset = extraFieldEnd + commentLength;
  }

  return { entries, totalEntries: directoryInfo.totalEntries, truncated: false };
}

function readCentralDirectoryInfo(buffer: Buffer): CentralDirectoryInfo {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  if (eocdOffset < 0) {
    throw new Error('ZIP 파일에서 중앙 디렉터리를 찾을 수 없습니다.');
  }

  let totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  let centralDirectorySize = buffer.readUInt32LE(eocdOffset + 12);
  let centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);

  const needsZip64 =
    totalEntries === 0xffff || centralDirectorySize === 0xffffffff || centralDirectoryOffset === 0xffffffff;

  if (needsZip64) {
    const locatorOffset = eocdOffset - 20;
    if (locatorOffset < 0 || buffer.readUInt32LE(locatorOffset) !== ZIP64_EOCD_LOCATOR_SIGNATURE) {
      throw new Error('ZIP64 구조를 찾을 수 없습니다.');
    }
    const zip64RecordOffset = Number(buffer.readBigUInt64LE(locatorOffset + 8));
    if (!Number.isSafeInteger(zip64RecordOffset) || zip64RecordOffset < 0) {
      throw new Error('지원되지 않는 ZIP64 오프셋입니다.');
    }
    if (zip64RecordOffset + 56 > buffer.length) {
      throw new Error('ZIP64 레코드가 손상되었습니다.');
    }
    if (buffer.readUInt32LE(zip64RecordOffset) !== ZIP64_EOCD_SIGNATURE) {
      throw new Error('ZIP64 레코드를 찾을 수 없습니다.');
    }

    totalEntries = Number(buffer.readBigUInt64LE(zip64RecordOffset + 24));
    centralDirectorySize = Number(buffer.readBigUInt64LE(zip64RecordOffset + 32));
    centralDirectoryOffset = Number(buffer.readBigUInt64LE(zip64RecordOffset + 40));

    if (!Number.isSafeInteger(totalEntries) || !Number.isSafeInteger(centralDirectorySize) || !Number.isSafeInteger(centralDirectoryOffset)) {
      throw new Error('ZIP64 파일이 너무 큽니다.');
    }
  }

  return {
    totalEntries,
    centralDirectorySize,
    centralDirectoryOffset,
  };
}

function findEndOfCentralDirectory(buffer: Buffer): number {
  const maxSearchLength = Math.min(buffer.length, MAX_COMMENT_LENGTH + 22);
  const start = buffer.length - maxSearchLength;
  for (let offset = buffer.length - 22; offset >= start; offset--) {
    if (buffer.readUInt32LE(offset) === EOCD_SIGNATURE) {
      return offset;
    }
  }
  return -1;
}

function resolveEntrySizes(
  buffer: Buffer,
  extraFieldStart: number,
  extraFieldEnd: number,
  uncompressedSize32: number,
  compressedSize32: number
): { uncompressedSize: number; compressedSize: number } {
  let uncompressedSize = uncompressedSize32;
  let compressedSize = compressedSize32;

  if (uncompressedSize32 !== 0xffffffff && compressedSize32 !== 0xffffffff) {
    return { uncompressedSize, compressedSize };
  }

  let offset = extraFieldStart;
  while (offset + 4 <= extraFieldEnd) {
    const headerId = buffer.readUInt16LE(offset);
    const dataSize = buffer.readUInt16LE(offset + 2);
    const dataStart = offset + 4;
    const dataEnd = dataStart + dataSize;
    if (dataEnd > extraFieldEnd) {
      break;
    }
    if (headerId === ZIP64_EXTRA_FIELD_ID) {
      let cursor = dataStart;
      if (uncompressedSize32 === 0xffffffff) {
        uncompressedSize = Number(buffer.readBigUInt64LE(cursor));
        cursor += 8;
      }
      if (compressedSize32 === 0xffffffff) {
        compressedSize = Number(buffer.readBigUInt64LE(cursor));
        cursor += 8;
      }
      break;
    }
    offset = dataEnd;
  }

  if (!Number.isSafeInteger(uncompressedSize) || !Number.isSafeInteger(compressedSize)) {
    throw new Error('ZIP 항목 크기를 계산할 수 없습니다.');
  }

  return { uncompressedSize, compressedSize };
}

function decodeFileName(buffer: Buffer, isUtf8: boolean) {
  if (isUtf8) {
    return buffer.toString('utf8');
  }
  if (cp437Decoder) {
    return cp437Decoder.decode(buffer);
  }
  return buffer.toString('latin1');
}
