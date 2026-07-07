import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { ManagementApiClient } from "@/api/management-api-client";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useVhosts } from "@/domains/admin/vhosts/vhost-query";
import { policyBodySchema, type PolicyBody } from "@/domains/admin/policies/policy-schema";

const formSchema = z.object({
  vhost: z.string().min(1),
  name: z.string().trim().min(1),
  pattern: z.string(),
  "apply-to": z.enum(["all", "exchanges", "queues"]),
  priority: z.number().int(),
  definition: z.string().min(1),
});

type FormValues = z.infer<typeof formSchema>;

type PolicyFormProps = {
  initialValues?: Partial<PolicyBody> & { vhost?: string; name?: string };
  onSubmit: (vhost: string, name: string, data: PolicyBody) => void;
  isLoading?: boolean;
  onCancel: () => void;
  apiClient: ManagementApiClient;
  isUpdate?: boolean;
};

export function PolicyForm({
  initialValues,
  onSubmit,
  isLoading = false,
  onCancel,
  apiClient,
  isUpdate = false,
}: PolicyFormProps) {
  const { t } = useTranslation();
  const vhosts = useVhosts(apiClient);
  const [definitionError, setDefinitionError] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vhost: initialValues?.vhost ?? "",
      name: initialValues?.name ?? "",
      pattern: initialValues?.pattern ?? ".*",
      "apply-to": initialValues?.["apply-to"] ?? "all",
      priority: initialValues?.priority ?? 0,
      definition: JSON.stringify(initialValues?.definition ?? {}, null, 2),
    },
  });

  const submit = (values: FormValues) => {
    try {
      const definition = policyBodySchema.shape.definition.parse(
        JSON.parse(values.definition),
      );
      setDefinitionError(false);
      onSubmit(values.vhost, values.name, {
        pattern: values.pattern,
        "apply-to": values["apply-to"],
        priority: values.priority,
        definition,
      });
    } catch {
      setDefinitionError(true);
    }
  };

  return (
    <form
      aria-label="Policy form"
      className="rl-admin-form space-y-4"
      onSubmit={handleSubmit(submit)}
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="policy-vhost">{t("policies.vhost")}</Label>
        {vhosts.isPending ? (
          <Skeleton className="h-8 w-full" />
        ) : (
          <Select
            value={watch("vhost")}
            onValueChange={(value) => setValue("vhost", value)}
            disabled={isLoading || isUpdate}
          >
            <SelectTrigger id="policy-vhost" className="w-full">
              <SelectValue placeholder={t("policies.selectVhost")} />
            </SelectTrigger>
            <SelectContent>
              {vhosts.data?.map(({ name }) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {errors.vhost ? (
          <p role="alert" className="text-sm text-destructive">
            {t("policies.vhostRequired")}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="policy-name">{t("policies.name")}</Label>
        <Input
          id="policy-name"
          {...register("name")}
          disabled={isLoading || isUpdate}
        />
        {errors.name ? (
          <p role="alert" className="text-sm text-destructive">
            {t("policies.nameRequired")}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="policy-pattern">{t("policies.pattern")}</Label>
        <Input
          id="policy-pattern"
          {...register("pattern")}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="policy-apply-to">{t("policies.applyTo")}</Label>
        <Select
          value={watch("apply-to")}
          onValueChange={(value) =>
            setValue("apply-to", value as FormValues["apply-to"])
          }
          disabled={isLoading}
        >
          <SelectTrigger id="policy-apply-to" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("policies.allResources")}</SelectItem>
            <SelectItem value="exchanges">{t("nav.exchanges")}</SelectItem>
            <SelectItem value="queues">{t("nav.queues")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="policy-priority">{t("policies.priority")}</Label>
        <Input
          id="policy-priority"
          type="number"
          {...register("priority", { valueAsNumber: true })}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="policy-definition">
          {t("policies.definitionJson")}
        </Label>
        <Textarea
          id="policy-definition"
          rows={6}
          className="font-mono"
          {...register("definition")}
          disabled={isLoading}
          aria-invalid={definitionError}
        />
        {definitionError ? (
          <p role="alert" className="text-sm text-destructive">
            {t("policies.invalidDefinition")}
          </p>
        ) : null}
      </div>

      <FormActions
        isPending={isLoading || vhosts.isPending}
        onCancel={onCancel}
        submitLabel={
          isUpdate ? t("policies.updatePolicy") : t("policies.addPolicy")
        }
        pendingLabel={t("common.loading")}
      />
    </form>
  );
}
