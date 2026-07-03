import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { vhostBodySchema, type VhostBody } from "@/domains/admin/vhosts/vhost-schema";

export interface VhostFormProps {
  initialValues?: Partial<VhostBody> & { name?: string };
  onSubmit: (data: VhostBody & { name: string }) => void;
  isLoading?: boolean;
  isUpdate?: boolean;
  onCancel?: () => void;
}

export function VhostForm({ initialValues, onSubmit, isLoading, isUpdate, onCancel }: VhostFormProps) {
  const { t } = useTranslation();

  const form = useForm<VhostBody & { name: string }>({
    resolver: zodResolver(vhostBodySchema.extend({ name: z.string().min(1, "Name is required") })),
    defaultValues: {
      name: initialValues?.name || "",
      description: initialValues?.description || "",
      tags: initialValues?.tags || [],
      default_queue_type: initialValues?.default_queue_type || "classic",
      tracing: initialValues?.tracing || false,
    },
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch } = form;
  const tagsValue = watch("tags") || [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t("vhosts.name")}</Label>
        <Input 
          id="name" 
          {...register("name")} 
          disabled={isUpdate || isLoading} 
          placeholder="Virtual host name"
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message as string}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("vhosts.description")}</Label>
        <Input 
          id="description" 
          {...register("description")} 
          disabled={isLoading} 
          placeholder="Description"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">{t("vhosts.tags")}</Label>
        <Input 
          id="tags" 
          disabled={isLoading} 
          value={tagsValue.join(", ")}
          onChange={(e) => {
            const val = e.target.value;
            const newTags = val.split(",").map(t => t.trim()).filter(t => t !== "");
            setValue("tags", newTags);
          }}
          placeholder="e.g. production, eu-west"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="default_queue_type">{t("vhosts.defaultQueueType")}</Label>
        <Select
          disabled={isLoading}
          value={watch("default_queue_type")}
          onValueChange={(val) =>
            setValue(
              "default_queue_type",
              val as NonNullable<VhostBody["default_queue_type"]>,
            )
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="classic">{t("vhosts.classic")}</SelectItem>
            <SelectItem value="quorum">{t("vhosts.quorum")}</SelectItem>
            <SelectItem value="stream">{t("vhosts.stream")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="tracing" 
          checked={watch("tracing")}
          onCheckedChange={(checked) => setValue("tracing", checked === true)}
          disabled={isLoading}
        />
        <Label htmlFor="tracing">{t("vhosts.tracing")}</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {t("common.cancel")}
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t("common.loading") : (isUpdate ? "Update Virtual Host" : "Add Virtual Host")}
        </Button>
      </div>
    </form>
  );
}
