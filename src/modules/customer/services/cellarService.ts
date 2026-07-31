import { supabase } from '@/lib/supabase';
import { CellarItem } from '@/types';

export const cellarService = {
  async getCellarItems(userId: string): Promise<CellarItem[]> {
    const { data, error } = await supabase
      .from('cellar_items')
      .select('*, wine:wines(*)')
      .eq('user_id', userId);

    if (error) {
      console.warn('Supabase query error (cellar_items):', error.message);
      return [];
    }

    return data || [];
  },

  async addWineToCellar(userId: string, wineId: string, quantity: number): Promise<boolean> {
    const { error } = await supabase.from('cellar_items').insert({
      user_id: userId,
      wine_id: wineId,
      quantity,
    });

    return !error;
  }
};
