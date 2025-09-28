import type { MetadataRoute } from 'next';

// Generate the sitemap with product and category URLs
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Helper to fetch JSON safely
  const safeFetch = async <T>(url: string): Promise<T | null> => {
    try {
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) return null;
      const json = await res.json();
      return json as T;
    } catch (_) {
      return null;
    }
  };

  // 1) Fetch all active categories (endpoint returns all active without pagination)
  type Category = { id: string; slug: string };
  type CategoriesResponse = { success: boolean; data: Category[] };
  const categoriesRes = await safeFetch<CategoriesResponse>(`${baseUrl}/api/categories`);
  const categories = categoriesRes?.data || [];

  // 2) Fetch products with pagination
  type Product = { id: string; slug: string };
  type Pagination = { page: number; limit: number; totalPages: number };
  type ProductsResponse = { success: boolean; data: Product[]; pagination?: Pagination };

  const products: Product[] = [];
  const limit = 200; // batch size per request for sitemap
  let page = 1;
  let totalPages = 1;

  do {
    const url = `${baseUrl}/api/products?page=${page}&limit=${limit}`;
    const res = await safeFetch<ProductsResponse>(url);
    if (!res || !Array.isArray(res.data)) break;

    products.push(...res.data);
    totalPages = res.pagination?.totalPages || 1;
    page += 1;
  } while (page <= totalPages);

  // Base routes
  const entries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  // Category pages
  for (const c of categories) {
    if (!c?.slug) continue;
    entries.push({
      url: `${baseUrl}/category/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    });
  }

  // Product pages
  for (const p of products) {
    if (!p?.slug) continue;
    entries.push({
      url: `${baseUrl}/products/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    });
  }

  return entries;
}
