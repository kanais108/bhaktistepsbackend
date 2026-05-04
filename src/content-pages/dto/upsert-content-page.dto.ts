export class UpsertContentPageDto {
  slug: string;
  parentSlug?: string;
  title: string;
  subtitle?: string;
  body: string;
  heroImageUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
}
