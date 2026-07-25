export interface Exhibitor {
  id: string;
  eventId: string;
  companyName: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  products: string[];
  services: string[];
  teamMemberIds: string[];
  boothNumber?: string;
  boothLocation?: string;
  visitorCount: number;
  leadCount: number;
  createdAt: string;
}
