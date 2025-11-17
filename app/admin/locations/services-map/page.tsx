"use client";

import { useEffect, useState } from "react";

export default function ServicesMap() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/get-services-map");
      const data = await res.json();
      setRows(data);
    }
    load();
  }, []);

  return (
    <div className="p-10">
      <h1 className="text-3xl mb-8">Services × Locations Map</h1>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-3 border">Service</th>
            <th className="p-3 border">Locations</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => (
            <tr key={r.service_id}>
              <td className="p-3 border">{r.service_title}</td>
              <td className="p-3 border">{r.locations.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
