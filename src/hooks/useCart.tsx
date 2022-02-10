import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      const cartReceived = [...cart];
      const prodExist = cartReceived.find((product : Product) => product.id === productId);

      if (prodExist) {
        const currentStock = await api.get<Stock>('/stock/'+productId);
        const updAmount = (prodExist ? prodExist.amount : 0) + 1;
        
        if (currentStock.data.amount >= updAmount) {
          prodExist.amount = updAmount;
          setCart(cartReceived);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartReceived))
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }

      } else {
        const { data } = await api.get('/products/'+productId);
        cartReceived.push({...data, amount: 1});
        setCart(cartReceived);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartReceived))
      }

      

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = async(productId: number) => {
    try {
      const cartReceived = [...cart];
      const index = cartReceived.findIndex(product => product.id === productId);

      if (index >= 0) {
        cartReceived.splice(index, 1)
        setCart(cartReceived);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartReceived))
      } else {
        throw new Error;
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      
      if (amount <= 0)
        return;

      const cartReceived = [...cart];
      const prodExist = cartReceived.find((product : Product) => product.id === productId);
      const currentStock = await api.get<Stock>('/stock/'+productId);

      if (currentStock.data.amount >= amount) {
        if (prodExist) {
          prodExist.amount = amount;
          setCart(cartReceived);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartReceived))
        } else 
          throw new Error;
      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
