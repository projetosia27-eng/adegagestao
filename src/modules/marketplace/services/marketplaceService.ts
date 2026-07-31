import { supabase } from '@/lib/supabase';
import { Wine, Store } from '@/types';

export const marketplaceService = {
  async getFeaturedWines(): Promise<Wine[]> {
    const { data, error } = await supabase
      .from('wines')
      .select('*')
      .limit(10);

    if (error) {
      console.warn('Supabase query error (wines catalog):', error.message);
      return [];
    }

    return data || [];
  },

  async getAllStores(): Promise<Store[]> {
    const { data, error } = await supabase
      .from('stores')
      .select('*');

    if (error) {
      console.warn('Supabase query error (stores):', error.message);
      return [];
    }

    return data || [];
  }
};
