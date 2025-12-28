"use client";

import { Activity, useState } from "react";
import { AmenitiesTable } from "@/app/features/admin/components/amenities/amenities-table";
import { MeetingRoomsTable } from "@/app/features/admin/components/meeting-rooms/meeting-rooms-table";
import type { AdminAmenity } from "@/app/features/amenities/actions/get-amenities";
import type { MeetingRoom } from "@/app/features/meeting-rooms/actions/get-meeting-rooms";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import messages from "@/lib/messages.json";
import type { SupabaseResponse } from "@/lib/supabase-response";

type AdminDashboardTabsProps = Readonly<{
  allAmenities: AdminAmenity[];
  meetingRoomsPromise: Promise<SupabaseResponse<MeetingRoom[]>>;
  amenitiesPromise: Promise<SupabaseResponse<AdminAmenity[]>>;
}>;

function AdminDashboardTabs({
  allAmenities,
  meetingRoomsPromise,
  amenitiesPromise,
}: AdminDashboardTabsProps) {
  const [activeTab, setActiveTab] = useState("rooms");

  return (
    <>
      <Tabs onValueChange={setActiveTab} value={activeTab}>
        <TabsList>
          <TabsTrigger value="rooms">
            {messages.admin.ui.tabs.meetingRooms.title}
          </TabsTrigger>
          <TabsTrigger value="amenities">
            {messages.admin.ui.tabs.amenities.title}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Activity mode={activeTab === "rooms" ? "visible" : "hidden"}>
        <MeetingRoomsTable
          allAmenities={allAmenities}
          meetingRoomsPromise={meetingRoomsPromise}
        />
      </Activity>

      <Activity mode={activeTab === "amenities" ? "visible" : "hidden"}>
        <AmenitiesTable amenitiesPromise={amenitiesPromise} />
      </Activity>
    </>
  );
}

export default AdminDashboardTabs;
