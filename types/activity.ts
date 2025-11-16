export type ActivityLog = {
  id: string;
  action: 'upload' | 'delete' | 'move' | 'download' | string;
  targetId: string | null;
  targetName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: number;
};
