import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { FormActions } from "@/components/shared/form-actions";
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
    <form
      aria-label="User form"
      onSubmit={handleSubmit(onSubmit)}
      className="rl-admin-form space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="name">{t("users.name")}</Label>
        <Input 
          id="name" 
          {...register("name")} 
          disabled={isUpdate || isLoading} 
          placeholder={t("users.namePlaceholder")}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message as string}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">
          {isUpdate ? t("users.passwordKeepExisting") : t("users.password")}
        </Label>
        <Input 
          id="password" 
          type="password"
          autoComplete="new-password"
          {...register("password")} 
          disabled={isLoading} 
          placeholder={t("users.password")}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message as string}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">{t("vhosts.tags")}</Label>
        <Input 
          id="tags" 
          {...register("tags")} 
          disabled={isLoading} 
          placeholder={t("users.tagsHelp")}
        />
        <p className="text-xs text-muted-foreground">
          {t("users.supportedTags")} <code>administrator</code>, <code>monitoring</code>, <code>policymaker</code>, <code>management</code>, <code>impersonator</code>
        </p>
      </div>

      <FormActions
        isPending={Boolean(isLoading)}
        onCancel={onCancel ?? (() => undefined)}
        submitLabel={isUpdate ? t("users.updateUser") : t("users.addUser")}
        pendingLabel={t("common.loading")}
      />
    </form>
  );
}
