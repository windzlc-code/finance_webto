import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { readDB } from "@/lib/store";
import type { Lead } from "@/lib/types";

function maskPhone(phone: string) {
  if (!phone) return "";
  if (phone.includes("*")) return phone;
  if (phone.length < 6) return "已遮罩";
  return `${phone.slice(0, 4)}***${phone.slice(-3)}`;
}

function maskLineId(lineId: string) {
  if (!lineId) return "";
  if (lineId.includes("*")) return lineId;
  if (lineId.length < 4) return "已遮罩";
  return `${lineId.slice(0, 2)}***${lineId.slice(-1)}`;
}

function leadListItem(lead: Lead): Lead {
  return {
    ...lead,
    phone: maskPhone(lead.phone),
    lineId: maskLineId(lead.lineId),
  };
}

export async function GET(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const db = await readDB();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase() || "";
  const loanType = searchParams.get("loanType") || "";
  const status = searchParams.get("status") || "";
  const sourceChannel = searchParams.get("sourceChannel") || "";
  const assignedTo = searchParams.get("assignedTo") || "";
  if (user.role !== "super_admin" && user.role !== "specialist") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const leads = db.leads.filter((lead) => {
    const matchesQ =
      !q ||
      lead.name.toLowerCase().includes(q) ||
      lead.phone.includes(q) ||
      lead.lineId.toLowerCase().includes(q);
    return (
      matchesQ &&
      (!loanType || lead.loanType === loanType) &&
      (!status || lead.status === status) &&
      (!sourceChannel || lead.sourceChannel === sourceChannel) &&
      (!assignedTo || lead.assignedTo === assignedTo) &&
      (user.role === "super_admin" || lead.assignedTo === user.id)
    );
  });

  const specialists = db.users
    .filter((item) => item.role === "super_admin" || item.role === "specialist")
    .filter((item) => user.role === "super_admin" || item.id === user.id);
  const sourceChannels = Array.from(new Set(db.leads.map((lead) => lead.sourceChannel).filter(Boolean))).sort();
  return NextResponse.json({ leads: leads.map(leadListItem), specialists, sourceChannels });
}
