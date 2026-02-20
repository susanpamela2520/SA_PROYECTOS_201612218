import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  Restaurant,
  RestaurantResponse,
} from './intefaces/restaurant.interface';
import { Observable } from 'rxjs';
import { MenuItem, MenuResponse } from './intefaces/menu.interface';

@Injectable({
  providedIn: 'root',
})
export class RestaurantService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/restaurants';

  // Obtener todos (Público)
  getRestaurants(): Observable<RestaurantResponse> {
    return this.http.get<RestaurantResponse>(this.apiUrl);
  }

  // Obtener uno (Público)
  getRestaurant(id: number): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${this.apiUrl}/${id}`);
  }

  // Crear (Solo ADMIN)
  createRestaurant(restaurant: Restaurant): Observable<Restaurant> {
    return this.http.post<Restaurant>(this.apiUrl, restaurant);
  }

  // Actualizar (Solo ADMIN)
  updateRestaurant(id: number, restaurant: Restaurant): Observable<Restaurant> {
    return this.http.put<Restaurant>(`${this.apiUrl}/${id}`, restaurant);
  }

  // Eliminar (Solo ADMIN)
  deleteRestaurant(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  // Ver platos de un restaurante (Público/Restaurante)
  getMenu(restaurantId: number): Observable<MenuResponse> {
    return this.http.get<MenuResponse>(`${this.apiUrl}/${restaurantId}/menu`);
  }

  // Crear plato (Solo Rol RESTAURANTE)
  createDish(restaurantId: number, dish: MenuItem): Observable<MenuItem> {
    return this.http.post<MenuItem>(
      `${this.apiUrl}/${restaurantId}/menu`,
      dish,
    );
  }

  // Actualizar plato (Solo Rol RESTAURANTE)
  updateDish(itemId: number, dish: MenuItem): Observable<MenuItem> {
    return this.http.put<MenuItem>(`${this.apiUrl}/menu/${itemId}`, dish);
  }

  // Eliminar plato (Solo Rol RESTAURANTE)
  deleteDish(itemId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/menu/${itemId}`);
  }
}
