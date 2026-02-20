import { computed, Injectable, signal } from '@angular/core';
import { MenuItem } from '../restaurant/intefaces/menu.interface';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  // Signal privado con la lista de productos
  private cartItems = signal<CartItem[]>([]);

  // Signals computados (se actualizan solos)
  items = computed(() => this.cartItems());

  count = computed(() =>
    this.cartItems().reduce((acc, item) => acc + item.quantity, 0),
  );

  total = computed(() =>
    this.cartItems().reduce((acc, item) => acc + item.price * item.quantity, 0),
  );

  addToCart(product: MenuItem) {
    const currentItems = this.cartItems();
    const existingItem = currentItems.find((i) => i.id === product.id);

    if (existingItem) {
      this.cartItems.set(
        currentItems.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        ),
      );
    } else {
      this.cartItems.set([...currentItems, { ...product, quantity: 1 }]);
    }
  }

  removeItem(productId: number) {
    this.cartItems.set(this.cartItems().filter((i) => i.id !== productId));
  }

  clearCart() {
    this.cartItems.set([]);
  }
}

export interface CartItem extends MenuItem {
  quantity: number;
}
