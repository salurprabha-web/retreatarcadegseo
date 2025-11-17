"use client";

import { useEffect, useState } from "react";

export default function AssignLocationsPage({ params }: any) {
  const serviceId = params.id;

  const [locations, setLocations] = useState<any[]>([]);
  const [assigned, setAssigned] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all locations + existing assignments
  useEffect(() => {
    async function fetchData() {
      const locRes = await fetch("/api/admin/get-locations");
      const locData = await locRes.json();

      const assignRes = await fetch(`/api/admin/get-service-locations?service_id=${serviceId}`);
      const assignData = await assignRes.json();

      setLocations(locData);
      setAssigned(assignData.map((row: any) => row.location_id));
      setLoading(false);
    }

    fetchData();
  }, [serviceId]);

  const toggleLocation = (id: string) => {
    setAssigned((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const saveAssignments = async () => {
    await fetch("/api/admin/service-locations", {
      method: "POST",
      body: JSON.stringify({
        service_id: serviceId,
        location_ids: assigned,
      }),
    });

    alert("Locations updated successfully!");
  };

  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-10">
      <h1 className="text-3xl font-bold mb-6">Assign Locations to Service</h1>

      <div className="grid grid-cols-2 gap-4">
        {locations.map((loc: any) => (
          <label key={loc.id} className="flex items-center gap-3 border p-3 rounded">
            <input
              type="checkbox"
              checked={assigned.includes(loc.id)}
              onChange={() => toggleLocation(loc.id)}
            />
            <span className="text-lg">{loc.city}</span>
          </label>
        ))}
      </div>

      <button
        onClick={saveAssignments}
        className="mt-10 px-8 py-3 bg-orange-600 text-white rounded-lg"
      >
        Save Locations
      </button>
    </div>
  );
}
