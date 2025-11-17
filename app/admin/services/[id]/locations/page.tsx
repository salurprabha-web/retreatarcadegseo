"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

export default function ServiceLocationsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const serviceId = params.id;

  const [locations, setLocations] = useState<any[]>([]);
  const [assigned, setAssigned] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    // 1️⃣ Load all locations
    const { data: locs, error: locErr } = await supabase
      .from("locations")
      .select("id, city, slug, state, is_active")
      .order("city", { ascending: true });

    if (locErr) {
      console.error("Location Fetch Error", locErr);
      toast.error("Failed to load locations");
      return;
    }

    setLocations(locs || []);

    // 2️⃣ Load assigned locations for this service
    const { data: assignedRows, error: assignErr } = await supabase
      .from("service_locations")
      .select("location_id, is_enabled")
      .eq("service_id", serviceId);

    if (assignErr) {
      console.error("Assigned Fetch Error", assignErr);
      toast.error("Failed to load assigned locations");
      return;
    }

    // Convert to object { location_id: true/false }
    const assignedMap: Record<string, boolean> = {};
    assignedRows?.forEach((row) => {
      assignedMap[row.location_id] = !!row.is_enabled;
    });

    setAssigned(assignedMap);
    setLoading(false);
  }

  // SAVE CHANGES
  async function saveAssignments() {
    setSaving(true);

    try {
      const updates = Object.entries(assigned).map(([location_id, is_enabled]) => ({
        service_id: serviceId,
        location_id,
        is_enabled,
      }));

      // Save all in one API call (bulk)
      const res = await fetch("/api/admin/service-locations", {
        method: "POST",
        body: JSON.stringify({ rows: updates }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Save Error", err);
        toast.error("Failed to save locations");
      } else {
        toast.success("Locations updated successfully");
      }
    } catch (error: any) {
      console.error("Save Exception", error);
      toast.error("Error saving locations");
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="p-10 text-center text-lg">
        Loading locations...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-10">

      <h1 className="text-3xl font-bold mb-6">Manage Locations</h1>
      <p className="text-gray-600 mb-4">
        Enable or disable this service for each location.
      </p>

      <Link href={`/admin/services/${serviceId}`}>
        <Button variant="outline" className="mb-6">← Back to Service</Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Available Locations</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">

            {locations.map((loc) => (
              <div
                key={loc.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {loc.city}
                  </p>
                  <p className="text-sm text-gray-500">
                    {loc.slug} {loc.state ? `| ${loc.state}` : ""}
                  </p>
                </div>

                {/* Toggle Checkbox */}
                <input
                  type="checkbox"
                  checked={assigned[loc.id] || false}
                  onChange={(e) => {
                    setAssigned((prev) => ({
                      ...prev,
                      [loc.id]: e.target.checked,
                    }));
                  }}
                  className="w-5 h-5 accent-orange-600 cursor-pointer"
                />
              </div>
            ))}

          </div>

          {/* SAVE BUTTON */}
          <Button
            onClick={saveAssignments}
            className="w-full mt-6 bg-orange-600 hover:bg-orange-700"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>

        </CardContent>
      </Card>

    </div>
  );
}
