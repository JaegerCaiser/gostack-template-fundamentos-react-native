import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsString = await AsyncStorage.getItem('@gomarket:products');
      if (productsString) {
        setProducts([...JSON.parse(productsString)]);
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(id => {
    setProducts(oldProducts => {
      const newProducts = oldProducts.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );

      AsyncStorage.setItem('@gomarket:products', JSON.stringify(newProducts));

      return newProducts;
    });
  }, []);

  const decrement = useCallback(id => {
    setProducts(oldProducts => {
      const abs = oldProducts.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity - 1 }
          : product,
      );

      const newProducts = abs.filter(p => p.quantity > 0);
      AsyncStorage.setItem('@gomarket:products', JSON.stringify(newProducts));

      return newProducts;
    });
  }, []);

  const addToCart = useCallback(async (product: Product) => {
    const productsStorageString = await AsyncStorage.getItem(
      '@gomarket:products',
    );
    const productsStorage = productsStorageString
      ? (JSON.parse(productsStorageString) as Product[])
      : [];

    const founded = productsStorage.find(p => p.id === product.id);
    if (!founded) {
      productsStorage.push({ ...product, quantity: 0 });
    }

    const productsDone = productsStorage.map(productState => {
      const productExist = productState.id === product.id;
      if (productExist) {
        return {
          ...productState,
          quantity: productState.quantity + 1,
        };
      }

      return productState;
    });

    setProducts([...productsDone]);

    await AsyncStorage.setItem(
      '@gomarket:products',
      JSON.stringify(productsDone),
    );
  }, []);

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
