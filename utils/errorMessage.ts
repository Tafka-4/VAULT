export function getErrorMessage(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object') {
    const maybeData = (error as any).data;
    if (maybeData) {
      if (typeof maybeData === 'string') return maybeData;
      if (typeof maybeData === 'object' && 'message' in maybeData) {
        return String(maybeData.message);
      }
    }
    if ('statusMessage' in (error as any)) {
      return String((error as any).statusMessage);
    }
  }
  return '';
}
