export class UpsertContentPageDto {
  slug: string;
  title: string;
  subtitle?: string;
  body: string;
  heroImageUrl?: string;
  isActive?: boolean;
}
