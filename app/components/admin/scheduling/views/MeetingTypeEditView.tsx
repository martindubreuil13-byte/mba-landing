import { notFound } from "next/navigation";
import MeetingTypeForm from "../MeetingTypeForm";
import type { SchedulingData } from "@/app/lib/scheduling/types";

export function NewMeetingTypeView() {
  return <><h2 className="mb-8 text-2xl font-light tracking-tight">New meeting type</h2><MeetingTypeForm /></>;
}

export default function MeetingTypeEditView({ data, id }: { data: SchedulingData; id: string }) {
  const type = data.meetingTypes.find((t) => t.id === id);
  if (!type) notFound();
  return <><h2 className="mb-8 text-2xl font-light tracking-tight">{type.name}</h2><MeetingTypeForm key={type.id} type={type} /></>;
}
