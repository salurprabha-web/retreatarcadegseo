"use client";

import { useState } from "react";

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const upload = async () => {
    if (!file) return alert("Choose CSV file");
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload-csv", { method: "POST", body: fd });
    const json = await res.json();
    setLoading(false);
    if (json.error) return alert("Error: " + json.error);
    alert(`Uploaded ${json.inserted} rows`);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl mb-4">Bulk Upload Locations CSV</h2>
      <input type="file" accept=".csv" onChange={(e)=>setFile(e.target.files?.[0]||null)} />
      <div className="mt-4">
        <button className="px-5 py-2 bg-orange-600 text-white rounded" onClick={upload} disabled={loading}>
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>
      <p className="mt-4 text-sm text-gray-600">CSV format: city,slug,state,is_active</p>
    </div>
  );
}
