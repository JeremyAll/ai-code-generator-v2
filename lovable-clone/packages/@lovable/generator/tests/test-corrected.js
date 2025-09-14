import { PureSonnetWorkflow } from "./dist/workflows/pure-sonnet.js"; 
const workflow = new PureSonnetWorkflow();
console.log("🧪 TEST POST-CORRECTIONS - Génération simple blog");
workflow.generate("créer un blog simple avec articles et navigation").then(result => {
  console.log(result.success ? `✅ SUCCÈS: ${result.path}` : `❌ ÉCHEC: ${result.error}`);
  process.exit(result.success ? 0 : 1);
}).catch(e => {
  console.error("💥 Exception:", e.message);
  process.exit(1);
});
