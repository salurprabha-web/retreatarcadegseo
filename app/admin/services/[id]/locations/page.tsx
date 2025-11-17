"use client";

import { useEffect, useState } from "react";

export default function AssignLocations({ params }: { params: { id: string } }) {
  const serviceId = params.id;
  const [locations, setLocations] = useState<any[]>([]);
  const [assigned, setAssigned] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [locRes, linkRes] = await Promise.all([
        fetch("/api/admin/get-locations"),
        fetch(`/api/admin/get-service-location-link?service_id=${serviceId}&location_id=`) // get all links later
      ]);
      const locData = await locRes.json();
      // fetch service's assigned locations
      const assignedRes = await fetch(`/api/admin/get-service-location-links-by-service?service_id=${serviceId}`);
      const assignedData = await assignedRes.json();

      setLocations(locData || []);
      setAssigned((assignedData || []).map((r: any) => r.location_id));
      setLoading(false);
    }
    load();
  }, [serviceId]);

  const toggle = (id: string) => {
    setAssigned((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const save = async () => {
    await fetch("/api/admin/service-locations", {
      method: "POST",
      body: JSON.stringify({ service_id: serviceId, location_ids: assigned }),
    });
    alert("Locations updated");
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Assign Locations for this Service</h2>
      <div className="grid grid-cols-2 gap-3">
        {locations.map((loc) => (
          <label key={loc.id} className="flex items-center gap-3 border p-3 rounded">
            <input type="checkbox" checked={assigned.includes(loc.id)} onChange={() => toggle(loc.id)} />
            <span>{loc.city} ({loc.slug})</span>
          </label>
        ))}
      </div>

      <div className="mt-6">
        <button onClick={save} className="px-5 py-2 bg-orange-600 text-white rounded">Save</button>
      </div>
    </div>
  );
}
