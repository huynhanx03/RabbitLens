import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { FormActions } from "@/components/shared/form-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LimitScope } from "@/domains/admin/limits/limit-schema";

const limitFormSchema = z.object({
  owner: z.string().min(1),
  name: z.enum(["max-connections", "max-queues"]),
  value: z.number().int(),
});

type LimitFormValues = z.infer<typeof limitFormSchema>;

export type LimitFormSubmit = LimitFormValues & { scope: LimitScope };

type LimitFormProps = {
  scope: LimitScope;
  owners: string[];
  onSubmit: (input: LimitFormSubmit) => void;
  onCancel: () => void;
  isPending?: boolean;
};

export function LimitForm({
  scope,
  owners,
  onSubmit,
  onCancel,
  isPending = false,
}: LimitFormProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LimitFormValues>({
    resolver: zodResolver(limitFormSchema),
    defaultValues: {
      owner: owners[0] ?? "",
      name: "max-connections",
      value: -1,
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit((values) => onSubmit({ scope, ...values }))}
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="limit-owner">
          {scope === "vhost" ? t("limits.vhost") : t("limits.user")}
        </Label>
        <Select
          value={watch("owner")}
          onValueChange={(value) => setValue("owner", value)}
          disabled={isPending}
        >
          <SelectTrigger id="limit-owner" className="w-full">
            <SelectValue placeholder={t("limits.selectOwner")} />
          </SelectTrigger>
          <SelectContent>
            {owners.map((owner) => (
              <SelectItem key={owner} value={owner}>
                {owner}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.owner ? (
          <p className="text-sm text-destructive" role="alert">
            {t("limits.ownerRequired")}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="limit-name">{t("limits.limit")}</Label>
        <Select
          value={watch("name")}
          onValueChange={(value) =>
            setValue("name", value as LimitFormValues["name"])
          }
          disabled={isPending}
        >
          <SelectTrigger id="limit-name" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="max-connections">
              {t("limits.maxConnections")}
            </SelectItem>
            <SelectItem value="max-queues">{t("limits.maxQueues")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="limit-value">{t("limits.value")}</Label>
        <Input
          id="limit-value"
          type="number"
          {...register("value", { valueAsNumber: true })}
          disabled={isPending}
          aria-invalid={Boolean(errors.value)}
        />
        <p className="text-xs text-muted-foreground">{t("limits.noLimitHint")}</p>
        {errors.value ? (
          <p className="text-sm text-destructive" role="alert">
            {t("limits.integerRequired")}
          </p>
        ) : null}
      </div>

      <FormActions
        isPending={isPending}
        onCancel={onCancel}
        submitLabel={t("limits.setLimit")}
        pendingLabel={t("common.loading")}
        submitDisabled={owners.length === 0}
      />
    </form>
  );
}
