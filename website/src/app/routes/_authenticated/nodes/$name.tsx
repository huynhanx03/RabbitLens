import { createFileRoute } from '@tanstack/react-router';
import { NodeDetailPage } from '@/features/nodes/node-detail-page';

export const Route = createFileRoute('/_authenticated/nodes/$name')({
  component: NodeDetailPage,
});
