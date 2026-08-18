import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages;

export function getCategoryImage(category: string): string {
  const norm = (category || "").toLowerCase().trim();
  
  if (norm.includes("ssc")) {
    // SSC - Government staffing exam, focus on library, office structure & digital tablets
    return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop";
  }
  if (norm.includes("bank") || norm.includes("insurance") || norm.includes("finance")) {
    // Banking / Insurance - charts, calculation tools, and economic studies
    return "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800&auto=format&fit=crop";
  }
  if (norm.includes("rail") || norm.includes("technic") || norm.includes("loco")) {
    // Railway / Polytechnic - engineering drafts, architectural layout, technical transit design
    return "https://images.unsplash.com/photo-1474487548417-781cb71495f3?q=80&w=800&auto=format&fit=crop";
  }
  if (norm.includes("upsc") || norm.includes("civil") || norm.includes("ias") || norm.includes("psc")) {
    // UPSC / State Civil Services - reading tables, Indian maps, thick text volumes
    return "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop";
  }
  if (norm.includes("police") || norm.includes("defen") || norm.includes("army") || norm.includes("navy")) {
    // Police / Defense - tactical notes, maps, structural organization, fitness
    return "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?q=80&w=800&auto=format&fit=crop";
  }
  if (norm.includes("teach") || norm.includes("b.ed") || norm.includes("tet")) {
    // Teaching - blackboards, writing notes, educational setups
    return "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=800&auto=format&fit=crop";
  }
  if (norm.includes("jee") || norm.includes("neet") || norm.includes("science") || norm.includes("medical") || norm.includes("engineer")) {
    // JEE / NEET - chemistry lab equations, molecule structures, complex math notations
    return "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop";
  }
  if (norm.includes("cuet") || norm.includes("admission") || norm.includes("college") || norm.includes("univ")) {
    // CUET / College Admissions - university halls, dynamic students, campuses
    return "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800&auto=format&fit=crop";
  }
  
  // Default general student/exam notebook layout
  return "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop";
}

