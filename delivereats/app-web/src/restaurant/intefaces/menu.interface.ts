export interface MenuItem {
  id?: number;
  name: string;
  description: string;
  price: number;
  restaurantId: number;
}

export interface MenuResponse {
  menuItems: MenuItem[];
}
