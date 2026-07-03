import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MutationErrorAlert } from "@/components/shared/mutation-error-alert";
import { useDeleteUserMutation } from "./user-mutations";
import { useNavigate } from "@tanstack/react-router";
import type { ManagementApiClient } from "@/api/management-api-client";

interface DeleteUserDialogProps {
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiClient: ManagementApiClient;
}

export function DeleteUserDialog({ name, open, onOpenChange, apiClient }: DeleteUserDialogProps) {
  const { t } = useTranslation();
  const [confirmName, setConfirmName] = useState("");
  const deleteMutation = useDeleteUserMutation(apiClient);
  const navigate = useNavigate();

  const handleDelete = () => {
    deleteMutation.mutate(name, {
      onSuccess: () => {
        onOpenChange(false);
        navigate({ to: "/admin/users" });
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
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the user <strong>{name}</strong>.
          </DialogDescription>
        </DialogHeader>
        <MutationErrorAlert error={deleteMutation.error} />
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Type the user name to confirm</Label>
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
