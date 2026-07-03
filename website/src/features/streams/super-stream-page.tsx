import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouteContext } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { FormActions } from "@/components/shared/form-actions";
import { MutationErrorAlert } from "@/components/shared/mutation-error-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSuperStream } from "@/domains/extensions/streams/stream-query";
import { useVhosts } from "@/domains/admin/vhosts/vhost-query";

const formSchema = z.object({
  vhost: z.string().min(1),
  name: z.string().trim().min(1),
  partitions: z.number().int().min(1).max(1000),
  bindingKeys: z.string(),
  arguments: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

export function SuperStreamPage() {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "__root__" });
  const vhosts = useVhosts(context.apiClient);
  const create = useCreateSuperStream(context.apiClient);
  const [mode, setMode] = useState<"partitions" | "binding-keys">("partitions");
  const [jsonError, setJsonError] = useState(false);
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { vhost: "/", name: "", partitions: 3, bindingKeys: "", arguments: "{}" },
  });

  const submit = (values: FormValues) => {
    try {
      const parsed: unknown = JSON.parse(values.arguments);
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
        setJsonError(true);
        return;
      }
      setJsonError(false);
      const body = mode === "partitions"
        ? { partitions: values.partitions, arguments: parsed as Record<string, unknown> }
        : { "binding-keys": values.bindingKeys, arguments: parsed as Record<string, unknown> };
      create.mutate(
        { vhost: values.vhost, name: values.name, body },
        { onSuccess: () => reset() },
      );
    } catch {
      setJsonError(true);
    }
  };

  return (
    <div className="space-y-4">
      <div className="max-w-2xl rounded-xl border bg-card p-5">
        <MutationErrorAlert error={create.error} />
        <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="super-vhost">{t("vhosts.title")}</Label>
            <Select value={watch("vhost")} onValueChange={(value) => setValue("vhost", value)} disabled={create.isPending}>
              <SelectTrigger id="super-vhost" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{vhosts.data?.map(({ name }) => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="super-name">{t("common.name")}</Label>
            <Input id="super-name" {...register("name")} disabled={create.isPending} aria-invalid={Boolean(errors.name)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="super-mode">{t("streams.partitionMode")}</Label>
            <Select value={mode} onValueChange={(value) => setMode(value as typeof mode)} disabled={create.isPending}>
              <SelectTrigger id="super-mode" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="partitions">{t("streams.partitions")}</SelectItem>
                <SelectItem value="binding-keys">{t("streams.bindingKeys")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {mode === "partitions" ? (
            <div className="space-y-2">
              <Label htmlFor="super-partitions">{t("streams.partitions")}</Label>
              <Input id="super-partitions" type="number" min={1} max={1000} {...register("partitions", { valueAsNumber: true })} disabled={create.isPending} />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="super-binding-keys">{t("streams.bindingKeys")}</Label>
              <Input id="super-binding-keys" {...register("bindingKeys")} disabled={create.isPending} />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="super-arguments">{t("streams.argumentsJson")}</Label>
            <Textarea id="super-arguments" rows={8} className="font-mono" {...register("arguments")} disabled={create.isPending} aria-invalid={jsonError} />
            {jsonError ? <p role="alert" className="text-sm text-destructive">{t("parameters.invalidJson")}</p> : null}
          </div>
          <FormActions
            isPending={create.isPending}
            submitLabel={t("streams.createSuperStream")}
            pendingLabel={t("common.loading")}
            onCancel={() => reset()}
          />
        </form>
      </div>
    </div>
  );
}
