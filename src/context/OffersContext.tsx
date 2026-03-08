'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface Offer {
  id: number;
  name: string;
  event_url: string;
  status: number;
  created_at: number;
}

interface OffersContextType {
  offers: Offer[];
  loading: boolean;
  refresh: () => void;
}

const OffersContext = createContext<OffersContextType>({
  offers: [],
  loading: false,
  refresh: () => {},
});

export const useOffers = () => useContext(OffersContext);

export function OffersProvider({ children }: { children: ReactNode }) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/events');
      const data = await response.json();

      if (data.success && data.data) {
        const events = Array.isArray(data.data)
          ? data.data
          : data.data.events || [];
        const activeOffers = events.filter(
          (offer: Offer) => offer.status === 1
        );
        setOffers(activeOffers);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  return (
    <OffersContext.Provider value={{ offers, loading, refresh: fetchOffers }}>
      {children}
    </OffersContext.Provider>
  );
}
