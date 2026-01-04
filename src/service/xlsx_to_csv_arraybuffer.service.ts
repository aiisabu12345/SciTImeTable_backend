import { HTTPException } from "hono/http-exception";
import * as XLSX from "xlsx";

const xlsx_to_csv_arraybuffer = async (file: File[]) => {
  const csvFiles = [];
  for (const f of file) {
    const isXlsx =
      f.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" &&
      f.name.toLowerCase().endsWith(".xlsx");

    if (!isXlsx) {
      throw new HTTPException(400, { message: "Only xlsx allowed" });
    }
    const arrbuffer1 = await f.arrayBuffer();
    const workbook = XLSX.read(arrbuffer1, { type: "array" });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const csvString = XLSX.utils.sheet_to_csv(sheet);

    const encoder = new TextEncoder();
    const arrayBuffer = encoder.encode(csvString).buffer;
    csvFiles.push(arrayBuffer);
  }

  return csvFiles;
};

export default xlsx_to_csv_arraybuffer;
