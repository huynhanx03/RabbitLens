import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouteContext } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MutationErrorAlert } from "@/components/shared/mutation-error-alert";
import { buildMoveMessagesShovel } from "@/domains/extensions/shovels/shovel-parameter-api";
import { useSaveShovel } from "@/domains/extensions/shovels/shovel-parameter-query";

type MoveMessagesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vhost: string;
  sourceQueue: string;
  queueType?: string;
};

function safeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-|-$/g, "") || "queue";
}

export function MoveMessagesDialog({ open, onOpenChange, vhost, sourceQueue, queueType }: MoveMessagesDialogProps) {
  const { t } = useTranslation();
  const { apiClient } = useRouteContext({ from: "__root__" });
  const save = useSaveShovel(apiClient);
  const [destination, setDestination] = useState("");
  const [validationError, setValidationError] = useState(false);

  const submit = () => {
    const target = destination.trim();
    if (!target || target === sourceQueue) {
      setValidationError(true);
      return;
    }
    setValidationError(false);
    save.mutate({
      vhost,
      name: `rabbitlens-move-${safeName(sourceQueue)}-${Date.now()}`,
      value: buildMoveMessagesShovel(sourceQueue, target, queueType),
    }, {
      onSuccess: () => {
        setDestination("");
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("queues.moveMessages")}</DialogTitle>
          <DialogDescription>{t("queues.moveMessagesDescription", { queue: sourceQueue })}</DialogDescription>
        </DialogHeader>
        <MutationErrorAlert error={save.error} />
        <div className="space-y-2">
          <Label htmlFor="move-destination">{t("queues.destinationQueue")}</Label>
          <Input id="move-destination" value={destination} onChange={(event) => setDestination(event.target.value)} disabled={save.isPending} />
          {validationError ? <p className="text-sm text-destructive">{t("queues.differentDestination")}</p> : null}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>{t("common.cancel")}</Button>
          <Button onClick={submit} disabled={save.isPending}>{t("queues.moveMessages")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
