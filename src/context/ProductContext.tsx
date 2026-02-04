"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface Product {
  product_id: number;
  name: string;
  price: number;
  special_price?: number;
  category_name?: string;
  product_unit?: string;
  category_id?: number;
  id?: string;
  currentPrice?: number;
  originalPrice?: number;
  image?: string;
  weight?: number;
}

interface ProductContextType {
  products: { [key: string]: Product };
  setProduct: (id: string, product: Product) => void;
  getProduct: (id: string) => Product | null;
  clearProducts: () => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<{ [key: string]: Product }>({});

  const setProduct = (id: string, product: Product) => {
    setProducts(prev => ({
      ...prev,
      [id]: product
    }));
  };

  const getProduct = (id: string): Product | null => {
    return products[id] || null;
  };

  const clearProducts = () => {
    setProducts({});
  };

  return (
    <ProductContext.Provider value={{
      products,
      setProduct,
      getProduct,
      clearProducts
    }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProduct = (): ProductContextType => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProduct must be used within a ProductProvider");
  }
  return context;
};