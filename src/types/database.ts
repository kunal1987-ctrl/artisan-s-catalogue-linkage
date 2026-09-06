export interface Artisan {
  id: string;
  name: string;
  craft_type: string;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  rating: number;
  experience_years: number;
  created_at?: string;
}

export interface Product {
  id: string;
  artisan_id: string;
  title: string;
  description: string | null;
  category: string;
  price: number;
  material: string | null;
  dimensions: string | null;
  image_url: string | null;
  featured: boolean;
  stock: number;
  created_at?: string;
  artisans?: Artisan;
}

export interface Inquiry {
  id: string;
  product_id: string | null;
  customer_name: string;
  customer_email: string;
  message: string;
  created_at: string;
  products?: {
    title: string;
    image_url: string | null;
  };
}
