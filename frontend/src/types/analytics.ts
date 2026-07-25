export interface EventAnalytics {
  totalAttendees: number;
  activeAttendees: number;
  connectionsMade: number;
  averageMatchScore: number;
  sessionAttendance: number;
  topIndustries: { industry: string; count: number }[];
  companiesRepresented: number;
  connectionTimeline: { date: string; count: number }[];
  networkingHeatmap: { hour: number; count: number }[];
  exhibitorStats: { totalExhibitors: number; totalVisitors: number; totalLeads: number };
}
