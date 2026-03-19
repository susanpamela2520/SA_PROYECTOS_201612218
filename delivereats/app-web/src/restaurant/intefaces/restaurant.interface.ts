export interface Restaurant {
  id?: number;
  name: string;
  address: string;
  category: string;
  horario: string;
  calificacion?: string;
  rating?: number;
  ratingCount?: number;
}

export interface RestaurantResponse {
  restaurants?: Restaurant[];
  id?: number;
  name?: string;
  address?: string;
  category?: string;
  success?: boolean;
  message?: string;
}
