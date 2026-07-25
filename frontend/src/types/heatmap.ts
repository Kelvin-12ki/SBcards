export interface HeatmapData {
  eventId: string;
  hour: number;
  day: number;
  connectionCount: number;
  messageCount: number;
  checkinCount: number;
  scanCount: number;
  locationData: { location: string; density: number }[];
}

export interface PeakTime {
  hour: number;
  day: number;
  totalCount: number;
  label: string; // e.g. "Tuesday 14:00"
}

export interface LocationDensity {
  location: string;
  density: number;
}
