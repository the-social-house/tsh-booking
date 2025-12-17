"use client";

import { Activity, useState } from "react";
import { MeetingRoomsTable } from "@/app/features/admin/components/meeting-rooms/meeting-rooms-table";
import type { MeetingRoom } from "@/app/features/meeting-rooms/actions/get-meeting-rooms";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import messages from "@/lib/messages.json";
import type { SupabaseResponse } from "@/lib/supabase-response";

type AdminDashboardTabsProps = {
  meetingRoomsPromise: Promise<SupabaseResponse<MeetingRoom[]>>;
};

function AdminDashboardTabs({ meetingRoomsPromise }: AdminDashboardTabsProps) {
  const [activeTab, setActiveTab] = useState("rooms");

  return (
    <>
      <Tabs onValueChange={setActiveTab} value={activeTab}>
        <TabsList>
          <TabsTrigger value="rooms">
            {messages.admin.ui.tabs.meetingRooms.title}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Activity mode={activeTab === "rooms" ? "visible" : "hidden"}>
        <MeetingRoomsTable meetingRoomsPromise={meetingRoomsPromise} />
      </Activity>
    </>
  );
}

export default AdminDashboardTabs;
