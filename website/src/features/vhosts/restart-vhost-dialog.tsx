import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MutationErrorAlert } from "@/components/shared/mutation-error-alert";
import { useResetOnClose } from "@/components/shared/use-reset-on-close";
import { useRestartVhostMutation } from "./vhost-mutations";
import type { ManagementApiClient } from "@/api/management-api-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { VhostResponse } from "@/domains/admin/vhosts/vhost-schema";

interface RestartVhostDialogProps {
  vhost: VhostResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiClient: ManagementApiClient;
}

export function RestartVhostDialog({
  vhost,
  open,
  onOpenChange,
  apiClient,
}: RestartVhostDialogProps) {
  const { t } = useTranslation();
  const [selectedNode, setSelectedNode] = useState("");
  const restartMutation = useRestartVhostMutation(apiClient);

  useResetOnClose(open, () => setSelectedNode(""));

  const nodes = Object.keys(vhost.cluster_state || {});

  const handleRestart = () => {
    if (!selectedNode) return;
    restartMutation.mutate(
      { vhost: vhost.name, node: selectedNode },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedNode("");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("vhosts.restartTitle")}</DialogTitle>
          <DialogDescription>
            {t("vhosts.restartDescription", { name: vhost.name })}
          </DialogDescription>
        </DialogHeader>
        <MutationErrorAlert error={restartMutation.error} />
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t("vhosts.restartNode")}</Label>
            <Select
              disabled={restartMutation.isPending}
              value={selectedNode}
              onValueChange={setSelectedNode}
            >
              <SelectTrigger aria-label={t("vhosts.restartNode")}>
                <SelectValue placeholder={t("vhosts.selectNode")} />
              </SelectTrigger>
              <SelectContent>
                {nodes.length > 0 ? (
                  nodes.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-nodes" disabled>
                    {t("vhosts.noNodesAvailable")}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={restartMutation.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button onClick={handleRestart} disabled={!selectedNode || restartMutation.isPending}>
            {restartMutation.isPending ? t("common.loading") : t("vhosts.restartAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
