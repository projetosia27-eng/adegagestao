import { supabase } from '@/lib/supabase';
import { Store, Wine, Order } from '@/types';

export const vendorService = {
  async getVendorStore(vendorId: string): Promise<Store | null> {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('vendor_id', vendorId)
      .maybeSingle();

    if (error) {
      console.warn('Supabase query error (stores):', error.message);
      return null;
    }

    return data;
  },

  async getVendorInventory(storeId: string): Promise<Wine[]> {
    const { data, error } = await supabase
      .from('wines')
      .select('*')
      .eq('store_id', storeId);

    if (error) {
      console.warn('Supabase query error (wines):', error.message);
      return [];
    }

    return data || [];
  }
};
