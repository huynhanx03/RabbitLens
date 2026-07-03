import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userBodySchema, type UserBody } from "@/domains/admin/users/user-schema";

export interface UserFormProps {
  initialValues?: Partial<UserBody> & { name?: string };
  onSubmit: (data: UserBody & { name: string }) => void;
  isLoading?: boolean;
  isUpdate?: boolean;
  onCancel?: () => void;
}

export function UserForm({ initialValues, onSubmit, isLoading, isUpdate, onCancel }: UserFormProps) {
  const { t } = useTranslation();

  const form = useForm<UserBody & { name: string }>({
    resolver: zodResolver(userBodySchema.extend({ name: z.string().min(1, "Name is required") })),
    defaultValues: {
      name: initialValues?.name || "",
      password: "",
      tags: initialValues?.tags || "",
    },
  });

  const { register, handleSubmit, formState: { errors } } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t("vhosts.name")}</Label>
        <Input 
          id="name" 
          {...register("name")} 
          disabled={isUpdate || isLoading} 
          placeholder="User name"
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message as string}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">
          {isUpdate ? "Password (leave blank to keep unchanged)" : "Password"}
        </Label>
        <Input 
          id="password" 
          type="password"
          {...register("password")} 
          disabled={isLoading} 
          placeholder="Password"
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message as string}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">{t("vhosts.tags")}</Label>
        <Input 
          id="tags" 
          {...register("tags")} 
          disabled={isLoading} 
          placeholder="e.g. administrator, management"
        />
        <p className="text-xs text-muted-foreground">
          Supported tags: <code>administrator</code>, <code>monitoring</code>, <code>policymaker</code>, <code>management</code>, <code>impersonator</code>
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {t("common.cancel")}
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t("common.loading") : (isUpdate ? "Update User" : "Add User")}
        </Button>
      </div>
    </form>
  );
}
