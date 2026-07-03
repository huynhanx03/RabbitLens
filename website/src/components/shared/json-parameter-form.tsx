import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormActions } from "./form-actions";

const formSchema = z.object({
  vhost: z.string().min(1),
  name: z.string().trim().min(1),
  value: z.string().min(2),
});

type FormValues = z.infer<typeof formSchema>;

type JsonParameterFormProps = {
  vhosts: string[];
  initialVhost?: string;
  initialName?: string;
  initialValue?: Record<string, unknown>;
  isUpdate?: boolean;
  isPending?: boolean;
  onSubmit: (input: {
    vhost: string;
    name: string;
    value: Record<string, unknown>;
  }) => void;
  onCancel: () => void;
};

export function JsonParameterForm({
  vhosts,
  initialVhost,
  initialName = "",
  initialValue = {},
  isUpdate = false,
  isPending = false,
  onSubmit,
  onCancel,
}: JsonParameterFormProps) {
  const { t } = useTranslation();
  const [jsonError, setJsonError] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vhost: initialVhost ?? vhosts[0] ?? "",
      name: initialName,
      value: JSON.stringify(initialValue, null, 2),
    },
  });

  const submit = (values: FormValues) => {
    try {
      const value: unknown = JSON.parse(values.value);
      if (!value || Array.isArray(value) || typeof value !== "object") {
        setJsonError(true);
        return;
      }
      setJsonError(false);
      onSubmit({
        vhost: values.vhost,
        name: values.name,
        value: value as Record<string, unknown>,
      });
    } catch {
      setJsonError(true);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
      <Alert>
        <AlertTitle>{t("parameters.secretTitle")}</AlertTitle>
        <AlertDescription>{t("parameters.secretDescription")}</AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="parameter-vhost">{t("vhosts.title")}</Label>
        <Select
          value={watch("vhost")}
          onValueChange={(value) => setValue("vhost", value)}
          disabled={isPending || isUpdate}
        >
          <SelectTrigger id="parameter-vhost" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {vhosts.map((vhost) => (
              <SelectItem key={vhost} value={vhost}>
                {vhost}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="parameter-name">{t("common.name")}</Label>
        <Input
          id="parameter-name"
          {...register("name")}
          disabled={isPending || isUpdate}
          aria-invalid={Boolean(errors.name)}
        />
        {errors.name ? (
          <p role="alert" className="text-sm text-destructive">
            {t("parameters.nameRequired")}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="parameter-value">{t("parameters.valueJson")}</Label>
        <Textarea
          id="parameter-value"
          rows={14}
          className="font-mono text-xs"
          {...register("value")}
          disabled={isPending}
          aria-invalid={jsonError}
          autoComplete="off"
        />
        {jsonError ? (
          <p role="alert" className="text-sm text-destructive">
            {t("parameters.invalidJson")}
          </p>
        ) : null}
      </div>

      <FormActions
        isPending={isPending}
        onCancel={onCancel}
        submitLabel={t("common.save")}
        pendingLabel={t("common.loading")}
        submitDisabled={vhosts.length === 0}
      />
    </form>
  );
}
