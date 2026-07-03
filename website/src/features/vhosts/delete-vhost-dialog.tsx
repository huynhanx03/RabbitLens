import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MutationErrorAlert } from "@/components/shared/mutation-error-alert";
import { useDeleteVhostMutation } from "./vhost-mutations";
import { useNavigate } from "@tanstack/react-router";
import type { ManagementApiClient } from "@/api/management-api-client";

interface DeleteVhostDialogProps {
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiClient: ManagementApiClient;
}

export function DeleteVhostDialog({ name, open, onOpenChange, apiClient }: DeleteVhostDialogProps) {
  const { t } = useTranslation();
  const [confirmName, setConfirmName] = useState("");
  const deleteMutation = useDeleteVhostMutation(apiClient);
  const navigate = useNavigate();

  const handleDelete = () => {
    deleteMutation.mutate(name, {
      onSuccess: () => {
        onOpenChange(false);
        navigate({ to: "/admin/vhosts" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) setConfirmName("");
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Virtual Host</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the virtual host <strong>{name}</strong> and all of its queues, exchanges, and bindings.
          </DialogDescription>
        </DialogHeader>
        <MutationErrorAlert error={deleteMutation.error} />
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Type the virtual host name to confirm</Label>
            <Input 
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={name}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleteMutation.isPending}>
            {t("common.cancel")}
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={confirmName !== name || deleteMutation.isPending}
          >
            {deleteMutation.isPending ? t("common.loading") : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
