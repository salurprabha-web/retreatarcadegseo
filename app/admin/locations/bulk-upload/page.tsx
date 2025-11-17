"use client";

import { useState } from "react";

export default function BulkUploadLocations() {
  const [file, setFile] = useState<any>(null);

  const upload = async () => {
    const form = new FormData();
    form.append("file", file);

    await fetch("/api/admin/upload-locations-csv", {
      method: "POST",
      body: form,
    });

    alert("Locations uploaded!");
  };

  return (
    <div className="p-10 max-w-3xl mx-auto">
      <h1 className="text-3xl mb-6">Upload Locations CSV</h1>

      <input
        type="file"
        accept=".csv"
        onChange={(e) => setFile(e.target.files?.[0])}
      />

      <button
        className="mt-6 px-6 py-3 bg-orange-600 text-white"
        onClick={upload}
      >
        Upload
      </button>
    </div>
  );
}
