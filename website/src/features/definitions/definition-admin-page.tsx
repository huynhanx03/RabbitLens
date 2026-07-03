import { useTranslation } from "react-i18next";
import { useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useVhosts } from "@/domains/admin/vhosts/vhost-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { definitionApi } from "@/domains/admin/definitions/definition-api";
import { useImportDefinitionsMutation } from "./definition-mutations";
import { MutationErrorAlert } from "@/components/shared/mutation-error-alert";
import { usePermissionDecision } from "@/auth/permissions/permission-gate";
import { Upload, Download, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { z } from "zod";

export function DefinitionAdminPage() {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "/_authenticated/admin/definitions" });
  const { data: vhosts } = useVhosts(context.apiClient);
  
  const [exportVhost, setExportVhost] = useState<string>("all");
  const [importVhost, setImportVhost] = useState<string>("all");
  const [file, setFile] = useState<File | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<Error | null>(null);
  const [fileError, setFileError] = useState<Error | null>(null);
  
  const importMutation = useImportDefinitionsMutation(context.apiClient);

  const canManageDefinitions = usePermissionDecision({ requiredAnyTag: ["administrator"] }).kind !== "deny";

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      const vhostParam = exportVhost === "all" ? undefined : exportVhost;
      const data = await definitionApi.exportDefinitions(context.apiClient, vhostParam);
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rabbitmq-definitions${vhostParam ? `-${vhostParam}` : ""}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: unknown) {
      setExportError(error instanceof Error ? error : new Error(t("errors.unexpected")));
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      const text = await file.text();
      const json = z.record(z.string(), z.unknown()).parse(JSON.parse(text));
      setFileError(null);
      const vhostParam = importVhost === "all" ? undefined : importVhost;
      
      importMutation.mutate({ body: json, vhost: vhostParam }, {
        onSuccess: () => {
          setFile(null);
          // reset file input
          const fileInput = document.getElementById("importFile") as HTMLInputElement;
          if (fileInput) fileInput.value = "";
        }
      });
    } catch (error: unknown) {
      setFileError(error instanceof Error ? error : new Error(t("definitions.invalidFile")));
    }
  };

  if (!canManageDefinitions) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t("definitions.permissionDenied")}</AlertTitle>
        <AlertDescription>{t("definitions.permissionDescription")}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("definitions.exportTitle")}</CardTitle>
            <CardDescription>
              {t("definitions.exportDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <MutationErrorAlert error={exportError} />
            <div className="space-y-2">
              <Label>{t("definitions.vhostOptional")}</Label>
              <Select value={exportVhost} onValueChange={setExportVhost}>
                <SelectTrigger>
                  <SelectValue placeholder={t("definitions.selectVhost")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("definitions.allVhosts")}</SelectItem>
                  {vhosts?.map(v => (
                    <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {t("definitions.exportHint")}
              </p>
            </div>
            <Button onClick={handleExport} disabled={isExporting}>
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? t("definitions.exporting") : t("definitions.exportButton")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("definitions.importTitle")}</CardTitle>
            <CardDescription>
              {t("definitions.importDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleImport} className="space-y-4">
              <MutationErrorAlert error={importMutation.error} />
              <MutationErrorAlert error={fileError} />
              
              <div className="space-y-2">
                <Label>{t("definitions.vhostOptional")}</Label>
                <Select value={importVhost} onValueChange={setImportVhost}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("definitions.selectVhost")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("definitions.allVhosts")}</SelectItem>
                    {vhosts?.map(v => (
                      <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {t("definitions.importHint")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="importFile">{t("definitions.importFile")}</Label>
                <Input 
                  id="importFile" 
                  type="file" 
                  accept=".json"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>

              <Button type="submit" disabled={!file || importMutation.isPending}>
                <Upload className="w-4 h-4 mr-2" />
                {importMutation.isPending ? t("definitions.importing") : t("definitions.importButton")}
              </Button>
              {importMutation.isSuccess && (
                <p className="text-sm text-green-600 mt-2">{t("definitions.importSuccess")}</p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
