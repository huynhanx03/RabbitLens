import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const REPLACEMENTS = [
  // Shared Components
  { pattern: /<SelectItem value="string">String<\/SelectItem>/g, replace: `<SelectItem value="string">{t("common.type")} String</SelectItem>` },
  { pattern: /<SelectItem value="number">Number<\/SelectItem>/g, replace: `<SelectItem value="number">{t("common.type")} Number</SelectItem>` },
  { pattern: /<SelectItem value="boolean">Boolean<\/SelectItem>/g, replace: `<SelectItem value="boolean">{t("common.type")} Boolean</SelectItem>` },
  
  // Vhosts
  { pattern: /<DialogTitle>Restart Virtual Host on Node<\/DialogTitle>/g, replace: `<DialogTitle>{t("vhosts.restartTitle")}</DialogTitle>` },
  { pattern: /<Label>Node<\/Label>/g, replace: `<Label>{t("vhosts.restartNode")}</Label>` },
  { pattern: /<Label htmlFor="name">Name<\/Label>/g, replace: `<Label htmlFor="name">{t("vhosts.name")}</Label>` },
  { pattern: /<Label htmlFor="description">Description<\/Label>/g, replace: `<Label htmlFor="description">{t("vhosts.description")}</Label>` },
  { pattern: /<Label htmlFor="tags">Tags \(comma separated\)<\/Label>/g, replace: `<Label htmlFor="tags">{t("vhosts.tags")}</Label>` },
  { pattern: /<Label htmlFor="default_queue_type">Default Queue Type<\/Label>/g, replace: `<Label htmlFor="default_queue_type">{t("vhosts.defaultQueueType")}</Label>` },
  { pattern: /<SelectItem value="classic">Classic<\/SelectItem>/g, replace: `<SelectItem value="classic">{t("vhosts.classic")}</SelectItem>` },
  { pattern: /<SelectItem value="quorum">Quorum<\/SelectItem>/g, replace: `<SelectItem value="quorum">{t("vhosts.quorum")}</SelectItem>` },
  { pattern: /<SelectItem value="stream">Stream<\/SelectItem>/g, replace: `<SelectItem value="stream">{t("vhosts.stream")}</SelectItem>` },
  { pattern: /<Label htmlFor="tracing">Enable tracing<\/Label>/g, replace: `<Label htmlFor="tracing">{t("vhosts.tracing")}</Label>` },
  { pattern: /<h1 className="text-3xl font-bold tracking-tight">Virtual Hosts<\/h1>/g, replace: `<h1 className="text-3xl font-bold tracking-tight">{t("vhosts.title")}</h1>` },
  { pattern: /<Button>Add virtual host<\/Button>/g, replace: `<Button>{t("vhosts.addVhost")}</Button>` },
  { pattern: /<DialogTitle>Create Virtual Host<\/DialogTitle>/g, replace: `<DialogTitle>{t("vhosts.createTitle")}</DialogTitle>` },

  // Exchanges
  { pattern: /<DialogTitle>Create Exchange<\/DialogTitle>/g, replace: `<DialogTitle>{t("exchanges.createTitle")}</DialogTitle>` },
  { pattern: /<Label htmlFor="type">Type<\/Label>/g, replace: `<Label htmlFor="type">{t("exchanges.type")}</Label>` },
  { pattern: /<Label htmlFor="durable">Durability<\/Label>/g, replace: `<Label htmlFor="durable">{t("exchanges.durability")}</Label>` },
  { pattern: /<Label htmlFor="auto_delete">Auto Delete<\/Label>/g, replace: `<Label htmlFor="auto_delete">{t("exchanges.autoDelete")}</Label>` },
  { pattern: /<Label htmlFor="internal">Internal<\/Label>/g, replace: `<Label htmlFor="internal">{t("exchanges.internal")}</Label>` },
  
  // Users
  { pattern: /<DialogTitle>Create User<\/DialogTitle>/g, replace: `<DialogTitle>{t("users.createTitle")}</DialogTitle>` },
  { pattern: /<Label htmlFor="password">Password<\/Label>/g, replace: `<Label htmlFor="password">{t("users.password")}</Label>` },

  // Definitions
  { pattern: /<h1 className="text-3xl font-bold tracking-tight">Definitions Export \/ Import<\/h1>/g, replace: `<h1 className="text-3xl font-bold tracking-tight">{t("definitions.title")}</h1>` },
  { pattern: /<CardTitle>Export Definitions<\/CardTitle>/g, replace: `<CardTitle>{t("definitions.exportTitle")}</CardTitle>` },
  { pattern: /<CardTitle>Import Definitions<\/CardTitle>/g, replace: `<CardTitle>{t("definitions.importTitle")}</CardTitle>` },
  { pattern: /<Label>Virtual Host \(Optional\)<\/Label>/g, replace: `<Label>{t("definitions.vhostOptional")}</Label>` },
  { pattern: /<SelectItem value="all">All Virtual Hosts<\/SelectItem>/g, replace: `<SelectItem value="all">{t("definitions.allVhosts")}</SelectItem>` },
  { pattern: /<Label htmlFor="importFile">Definitions File<\/Label>/g, replace: `<Label htmlFor="importFile">{t("definitions.importFile")}</Label>` },
];

async function getTsxFiles(dir) {
  let results = [];
  const list = await fs.readdir(dir, { withFileTypes: true });
  for (const dirent of list) {
    const res = path.resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      results = results.concat(await getTsxFiles(res));
    } else if (res.endsWith('.tsx')) {
      results.push(res);
    }
  }
  return results;
}

async function run() {
  const rootDir = path.resolve(__dirname, "../src");
  const files = await getTsxFiles(rootDir);
  let updatedCount = 0;

  for (const file of files) {
    let content = await fs.readFile(file, "utf-8");
    let original = content;

    for (const { pattern, replace } of REPLACEMENTS) {
      content = content.replace(pattern, replace);
    }

    if (content !== original) {
      if (!content.includes("useTranslation")) {
        const importStatement = `import { useTranslation } from "react-i18next";\n`;
        const lastImportIndex = content.lastIndexOf("import ");
        if (lastImportIndex !== -1) {
          const endOfLine = content.indexOf("\\n", lastImportIndex);
          content = content.slice(0, endOfLine + 1) + importStatement + content.slice(endOfLine + 1);
        } else {
          content = importStatement + content;
        }
      }

      const componentRegex = /export (default )?function ([A-Z][a-zA-Z0-9_]*)\([^)]*\) \{\n/;
      if (componentRegex.test(content) && !content.includes("const { t }")) {
         content = content.replace(componentRegex, (match) => {
           return `${match}  const { t } = useTranslation();\n`;
         });
      }

      await fs.writeFile(file, content, "utf-8");
      console.log(`Updated ${path.basename(file)}`);
      updatedCount++;
    }
  }
  
  console.log(`Successfully refactored ${updatedCount} files.`);
}

run().catch(console.error);
