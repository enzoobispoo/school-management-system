export function exportToCSV(data: any[], filename = "export.csv") {
    if (!data.length) return;
  
    const headers = Object.keys(data[0]);
  
    const csv = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((field) => JSON.stringify(row[field] ?? "")).join(",")
      ),
    ].join("\n");
  
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
  
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }