import { computed, Injectable, signal } from '@angular/core';
import { MenuItem } from '../restaurant/intefaces/menu.interface';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  // 1. El Signal que guarda la lista de platos
  private cartItems = signal<CartItem[]>([]);

  // 2. Signals computados (se actualizan solos cuando cambia cartItems)
  public items = computed(() => this.cartItems());

  public totalItems = computed(() =>
    this.cartItems().reduce((acc, item) => acc + item.quantity, 0),
  );

  public totalPrice = computed(() =>
    this.cartItems().reduce((acc, item) => acc + item.price * item.quantity, 0),
  );

  // 3. Método para agregar un plato
  addToCart(product: MenuItem) {
    const currentItems = this.cartItems();
    const existingItem = currentItems.find((item) => item.id === product.id);

    if (existingItem) {
      this.cartItems.set(
        currentItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      this.cartItems.set([...currentItems, { ...product, quantity: 1 }]);
    }
  }

  // 4. Quitar un producto completamente
  removeItem(productId: number) {
    this.cartItems.set(
      this.cartItems().filter((item) => item.id !== productId),
    );
  }

  updateQuantity(productId: number, delta: number) {
    this.cartItems.update((items) =>
      items.map((item) => {
        if (item.id === productId) {
          const newQty = item.quantity + delta;
          return { ...item, quantity: newQty > 0 ? newQty : 1 };
        }
        return item;
      }),
    );
  }

  // 5. Vaciar todo el carrito
  clearCart() {
    this.cartItems.set([]);
  }
}

export interface CartItem extends MenuItem {
  quantity: number;
}
