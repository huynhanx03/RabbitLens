import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { permissionBodySchema, type PermissionBody } from "@/domains/admin/users/user-schema";
import { useVhosts } from "@/domains/admin/vhosts/vhost-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export interface PermissionFormProps {
  initialValues?: Partial<PermissionBody> & { vhost?: string };
  onSubmit: (vhost: string, data: PermissionBody) => void;
  isLoading?: boolean;
  onCancel?: () => void;
  apiClient: ManagementApiClient;
  isUpdate?: boolean;
}

export function PermissionForm({ initialValues, onSubmit, isLoading, onCancel, apiClient, isUpdate }: PermissionFormProps) {
  const { t } = useTranslation();
  const { data: vhosts, isPending } = useVhosts(apiClient);

  const form = useForm<PermissionBody & { vhost: string }>({
    resolver: zodResolver(permissionBodySchema.extend({ vhost: z.string().min(1, "Virtual host is required") })),
    defaultValues: {
      vhost: initialValues?.vhost || "",
      configure: initialValues?.configure || ".*",
      write: initialValues?.write || ".*",
      read: initialValues?.read || ".*",
    },
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch } = form;

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data.vhost, data))} className="space-y-4">
      <div className="space-y-2">
        <Label>Virtual Host</Label>
        {isPending ? <Skeleton className="h-10 w-full" /> : (
          <Select
            disabled={isLoading || isUpdate}
            value={watch("vhost")}
            onValueChange={(val) => setValue("vhost", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a virtual host" />
            </SelectTrigger>
            <SelectContent>
              {vhosts?.map((v) => (
                <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {errors.vhost && <p className="text-sm text-destructive">{errors.vhost.message as string}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="configure">Configure (Regex)</Label>
        <Input 
          id="configure" 
          {...register("configure")} 
          disabled={isLoading} 
          placeholder=".*"
        />
        {errors.configure && <p className="text-sm text-destructive">{errors.configure.message as string}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="write">Write (Regex)</Label>
        <Input 
          id="write" 
          {...register("write")} 
          disabled={isLoading} 
          placeholder=".*"
        />
        {errors.write && <p className="text-sm text-destructive">{errors.write.message as string}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="read">Read (Regex)</Label>
        <Input 
          id="read" 
          {...register("read")} 
          disabled={isLoading} 
          placeholder=".*"
        />
        {errors.read && <p className="text-sm text-destructive">{errors.read.message as string}</p>}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {t("common.cancel")}
          </Button>
        )}
        <Button type="submit" disabled={isLoading || isPending}>
          {isLoading ? t("common.loading") : "Set Permission"}
        </Button>
      </div>
    </form>
  );
}
