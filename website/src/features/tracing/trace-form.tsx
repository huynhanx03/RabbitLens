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
import type { TraceBody } from "@/domains/extensions/tracing/tracing-api";

const formSchema = z.object({
  vhost: z.string().min(1),
  name: z.string().trim().min(1),
  format: z.enum(["text", "json"]),
  pattern: z.string().min(1),
  maxPayloadBytes: z
    .string()
    .refine((value) => value === "" || /^\d+$/.test(value)),
  username: z.string(),
  password: z.string(),
});

type FormValues = z.infer<typeof formSchema>;
type VhostOption = { name: string };
type Submission = { vhost: string; name: string; body: TraceBody };

type Props = {
  vhosts: VhostOption[];
  onSubmit: (submission: Submission) => void;
  onCancel: () => void;
  isPending: boolean;
};

export function TraceForm({ vhosts, onSubmit, onCancel, isPending }: Props) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vhost: vhosts[0]?.name ?? "",
      name: "",
      format: "text",
      pattern: "#",
      maxPayloadBytes: "",
      username: "",
      password: "",
    },
  });

  const submit = (values: FormValues) => {
    const body: TraceBody = {
      format: values.format,
      pattern: values.pattern,
    };
    if (values.maxPayloadBytes) {
      body.max_payload_bytes = Number(values.maxPayloadBytes);
    }
    if (values.username) body.tracer_connection_username = values.username;
    if (values.password) body.tracer_connection_password = values.password;
    onSubmit({ vhost: values.vhost, name: values.name, body });
  };

  return (
    <form
      aria-label="Trace form"
      className="rl-admin-form space-y-4"
      onSubmit={handleSubmit(submit)}
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="trace-vhost">{t("tracing.vhost")}</Label>
        <Select
          value={watch("vhost")}
          onValueChange={(value) => setValue("vhost", value, { shouldValidate: true })}
          disabled={isPending}
        >
          <SelectTrigger id="trace-vhost" className="w-full">
            <SelectValue placeholder={t("tracing.selectVhost")} />
          </SelectTrigger>
          <SelectContent>
            {vhosts.map(({ name }) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="trace-name">{t("tracing.name")}</Label>
        <Input id="trace-name" {...register("name")} disabled={isPending} />
        {errors.name ? <p role="alert" className="text-sm text-destructive">{t("common.required")}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="trace-format">{t("tracing.format")}</Label>
        <Select
          value={watch("format")}
          onValueChange={(value) => setValue("format", value as FormValues["format"])}
          disabled={isPending}
        >
          <SelectTrigger id="trace-format" className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="text">{t("tracing.text")}</SelectItem>
            <SelectItem value="json">{t("tracing.json")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="trace-pattern">{t("tracing.pattern")}</Label>
        <Input id="trace-pattern" {...register("pattern")} disabled={isPending} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="trace-max-payload">{t("tracing.maxPayloadBytes")}</Label>
        <Input id="trace-max-payload" inputMode="numeric" {...register("maxPayloadBytes")} disabled={isPending} />
        {errors.maxPayloadBytes ? <p role="alert" className="text-sm text-destructive">{t("tracing.invalidPayloadLimit")}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="trace-username">{t("tracing.username")}</Label>
          <Input id="trace-username" autoComplete="off" {...register("username")} disabled={isPending} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="trace-password">{t("tracing.password")}</Label>
          <Input id="trace-password" type="password" autoComplete="new-password" {...register("password")} disabled={isPending} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{t("tracing.credentialsNotice")}</p>
      <FormActions
        isPending={isPending}
        onCancel={onCancel}
        submitLabel={t("tracing.addTrace")}
        pendingLabel={t("common.loading")}
      />
    </form>
  );
}
