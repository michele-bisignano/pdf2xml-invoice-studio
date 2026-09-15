import fs from "fs";
import path from "path";
import * as PELibrary from "pe-library";
import * as ResEdit from "resedit";

const exePath = path.resolve("dist/GeneratoreXML.exe");
const iconPath = path.resolve("public/favicon.ico");

if (!fs.existsSync(exePath)) {
  console.log(`[set-exe-icon] File non trovato: ${exePath}`);
  process.exit(0);
}

if (!fs.existsSync(iconPath)) {
  console.log(`[set-exe-icon] Icona non trovata: ${iconPath}`);
  process.exit(0);
}

try {
  console.log(`[set-exe-icon] Applicazione icona a ${exePath}...`);
  const exeBuffer = fs.readFileSync(exePath);
  const exe = PELibrary.NtExecutable.from(exeBuffer, { ignoreCert: true });
  const res = PELibrary.NtExecutableResource.from(exe);

  const iconBuffer = fs.readFileSync(iconPath);
  const iconFile = ResEdit.Data.IconFile.from(iconBuffer);

  const existingIcons = ResEdit.Resource.IconGroupEntry.fromEntries(res.entries);
  const iconGroupID = existingIcons.length > 0 ? existingIcons[0].id : 1;

  ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
    res.entries,
    iconGroupID,
    1040, // it-IT (or 1033)
    iconFile.icons.map((item) => item.data)
  );

  res.outputResource(exe);
  const newBinary = exe.generate();
  fs.writeFileSync(exePath, Buffer.from(newBinary));
  console.log(`[set-exe-icon] Icona applicata con successo all'eseguibile Windows!`);
} catch (err) {
  console.warn(`[set-exe-icon] Impossibile applicare l'icona:`, err);
}
