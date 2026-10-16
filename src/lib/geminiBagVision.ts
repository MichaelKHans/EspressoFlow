/**
 * Espresso Flow - Beandex Bag Vision™ AI Integration
 * Secure serverless vision pipeline via Supabase Edge Functions.
 * Keeps Gemini API keys 100% secure with zero client-side vulnerabilities.
 */

import { getSupabaseClient } from './supabase';
import type { ScannedBeanInfo } from './bagScanner';

export interface BagVisionScanResult {
  success: boolean;
  data?: ScannedBeanInfo;
  error?: string;
  source?: 'supabase_edge_function' | 'local_cache';
}

/**
 * Scan a coffee bag label image using Beandex Bag Vision™
 * Protected serverless execution via Supabase Edge Function `scan-bag-vision`.
 */
export async function scanBagWithVisionAI(
  imageBase64: string,
  thumbnailBase64?: string
): Promise<BagVisionScanResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase klient er ikke konfigureret.',
    };
  }

  try {
    // 1. Invoke Supabase Edge Function `scan-bag-vision`
    const { data, error } = await supabase.functions.invoke('scan-bag-vision', {
      body: {
        imageBase64,
        mimeType: 'image/webp',
      },
    });

    if (error) {
      console.warn('[Beandex Bag Vision] Edge function invocation error:', error);
      return {
        success: false,
        error: error.message || 'Edge function kald fejlede.',
      };
    }

    if (!data || !data.success || !data.data) {
      return {
        success: false,
        error: data?.error || 'Kunne ikke udtrække kaffeposedata fra billedet.',
      };
    }

    const raw = data.data;

    // 2. Format to ScannedBeanInfo
    const scanned: ScannedBeanInfo = {
      roaster: raw.roaster,
      name: raw.name,
      roastLevel: raw.roast_level || 'medium',
      originCountry: raw.origin_country || undefined,
      flavorNotes: Array.isArray(raw.flavor_notes) ? raw.flavor_notes : [],
      roastDate: raw.roast_date || '',
      hasExplicitRoastDate: Boolean(raw.roast_date),
      imageUrl: thumbnailBase64 || undefined,
      isVerified: false,
      detectedFormat: 'Beandex Bag Vision™ (AI)',
    };

    // 3. Cloud Enrichment: Check if this roaster + name already exists in Supabase
    try {
      const { data: matchedBean } = await supabase
        .from('global_coffee_beans')
        .select('*')
        .ilike('roaster', raw.roaster)
        .ilike('name', raw.name)
        .limit(1)
        .maybeSingle();

      if (matchedBean) {
        // Enrich with verified community ratings and notes
        scanned.barcode = matchedBean.barcode || undefined;
        scanned.communityRating = matchedBean.avg_rating ? Number(matchedBean.avg_rating) : undefined;
        scanned.communityVotes = matchedBean.ratings_count ? Number(matchedBean.ratings_count) : undefined;
        scanned.isVerified = Boolean(matchedBean.is_verified);
        scanned.expertScore = matchedBean.expert_score ? Number(matchedBean.expert_score) : undefined;
        scanned.expertSource = matchedBean.expert_source || undefined;
        scanned.purchaseLocation = matchedBean.purchase_location || undefined;
        scanned.suitableFor = matchedBean.suitable_for || undefined;

        if ((!scanned.flavorNotes || scanned.flavorNotes.length === 0) && matchedBean.flavor_notes?.length) {
          scanned.flavorNotes = matchedBean.flavor_notes;
        }
      }
    } catch {
      // Enrichment is optional, do not block the scan flow
    }

    return {
      success: true,
      data: scanned,
      source: 'supabase_edge_function',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Beandex Bag Vision] Exception:', err);
    return {
      success: false,
      error: `Netværksfejl under vision-scanning: ${msg}`,
    };
  }
}
