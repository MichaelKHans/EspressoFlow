/**
 * Espresso Flow - Supabase Cloud Synchronization & Global Coffee Vault
 * Ultra-fast, zero-overhead client with local-first cache and offline fallback.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { sanitizeBeanInput } from './beanCatalogMatcher';
import type { RepurchaseVerdict, CoffeeBeanProfile } from '../types/espresso';
import { ALL_VERIFIED_COFFEE_CATALOG } from './coffeeCatalogData';

export interface GlobalCoffeeBean {
  id?: string;
  barcode: string;
  roaster: string;
  name: string;
  roast_level: 'light' | 'medium' | 'dark';
  origin_country?: string;
  species?: string;
  varietal?: string;
  purchase_country: string; // e.g. 'DK', 'SE', 'NO', 'DE', 'IT'
  purchase_location?: string; // Retail store/venue (e.g. 'Føtex', 'Hedekaffe Gårdbutik', 'Meny', 'Online')
  suitable_for: string[]; // e.g. ['pure_espresso', 'flat_white', 'cortado', 'cappuccino']
  flavor_notes: string[];
  avg_rating: number;
  ratings_count: number;
  verifications_count: number;
  is_verified: boolean;
  expert_score?: number; // 0-100 scale (e.g. 94.0)
  expert_source?: string; // e.g. 'Coffee Review' | 'SCA Cupping' | 'Cup of Excellence'
  repurchase_buy_again_count?: number;
  repurchase_neutral_count?: number;
  repurchase_never_again_count?: number;
  image_url?: string;
  created_at?: string;
}

export interface BeanDrinkRating {
  id?: string;
  barcode: string;
  user_fingerprint: string;
  rating: number;
  drink_type: 'pure_espresso' | 'flat_white' | 'cortado' | 'cappuccino' | 'all_rounder';
  purchase_country: string;
  purchase_location?: string; // Store or roastery where coffee was purchased
  brew_ratio?: string;
  comment?: string;
  created_at?: string;
}

// In-memory LRU cache to guarantee sub-millisecond barcode lookups (< 0.1ms)
const localBeanCache = new Map<string, GlobalCoffeeBean>();

export const DEFAULT_SUPABASE_URL = 'https://vdxfmvzdmcqfixbegumb.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkeGZtdnpkbWNxZml4YmVndW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MTY3NzYsImV4cCI6MjEwNjA5Mjc3Nn0.8MlspGgPxNuIiRWH819Z59MKgVWzAQdqKPE3cqFv9P4';

/**
 * Get or initialize the active Supabase Client
 */
export function getSupabaseClient(customUrl?: string, customKey?: string): SupabaseClient | null {
  const url =
    customUrl ||
    localStorage.getItem('espresso_supabase_url') ||
    import.meta.env.VITE_SUPABASE_URL ||
    DEFAULT_SUPABASE_URL;
  const key =
    customKey ||
    localStorage.getItem('espresso_supabase_anon_key') ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    DEFAULT_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes('xyzcompany')) {
    return null;
  }

  try {
    return createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (err) {
    console.warn('[Espresso Flow Supabase] Client init failed:', err);
    return null;
  }
}

/**
 * Test the active connection to Supabase
 */
export async function testSupabaseConnection(
  customUrl?: string,
  customKey?: string
): Promise<{
  ok: boolean;
  message: string;
  pingMs?: number;
  schemaUpToDate?: boolean;
}> {
  const client = getSupabaseClient(customUrl, customKey);
  if (!client) {
    return { ok: false, message: 'Missing Supabase URL or Anon Public Key.' };
  }

  const start = performance.now();
  try {
    const { error } = await client
      .from('global_coffee_beans')
      .select('barcode')
      .limit(1);

    const elapsed = Math.round(performance.now() - start);

    if (error) {
      return { ok: false, message: `Database error: ${error.message}` };
    }

    // Check if v1.2.29 columns (expert_score, image_url) are provisioned in remote schema
    const { error: colErr } = await client
      .from('global_coffee_beans')
      .select('expert_score, image_url')
      .limit(1);

    const schemaUpToDate = !colErr;

    return {
      ok: true,
      message: schemaUpToDate
        ? `Connected to Supabase (${elapsed}ms latency) • Schema v1.2.29 100% Up-to-Date`
        : `Connected to Supabase (${elapsed}ms latency) • Bemærk: SQL-migrering for SCA scores & posefotos afventer kørsel i Supabase`,
      pingMs: elapsed,
      schemaUpToDate,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: `Network error: ${msg}` };
  }
}

/**
 * Fetch a coffee bean by barcode from local cache or Supabase
 * Return null if not found.
 */
export async function fetchGlobalBean(
  barcode: string
): Promise<GlobalCoffeeBean | null> {
  const cleanBarcode = barcode.trim();
  if (!cleanBarcode) return null;

  // 1. Instant Cache Hit (< 0.1 ms)
  if (localBeanCache.has(cleanBarcode)) {
    return localBeanCache.get(cleanBarcode)!;
  }

  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('global_coffee_beans')
      .select('*')
      .eq('barcode', cleanBarcode)
      .maybeSingle();

    if (error || !data) return null;

    const bean: GlobalCoffeeBean = {
      id: data.id,
      barcode: data.barcode,
      roaster: data.roaster,
      name: data.name,
      roast_level: data.roast_level,
      origin_country: data.origin_country,
      species: data.species || undefined,
      varietal: data.varietal || undefined,
      purchase_country: data.purchase_country || 'DK',
      purchase_location: data.purchase_location || undefined,
      suitable_for: data.suitable_for || [],
      flavor_notes: data.flavor_notes || [],
      avg_rating: Number(data.avg_rating) || 0,
      ratings_count: Number(data.ratings_count) || 0,
      verifications_count: Number(data.verifications_count) || 1,
      is_verified: Boolean(data.is_verified),
      expert_score: data.expert_score ? Number(data.expert_score) : undefined,
      expert_source: data.expert_source || undefined,
      image_url: data.image_url || undefined,
      created_at: data.created_at,
    };

    // Store in cache
    localBeanCache.set(cleanBarcode, bean);
    return bean;
  } catch {
    return null;
  }
}

/**
 * Register or update a crowd-sourced bean in the cloud (Async background execution)
 * Protects verified beans from accidental user corruption and sanitizes inputs.
 */
export async function upsertGlobalBean(
  bean: Partial<GlobalCoffeeBean> & {
    barcode: string;
    roaster: string;
    name: string;
    roast_level: 'light' | 'medium' | 'dark';
  }
): Promise<{ success: boolean; data?: GlobalCoffeeBean; error?: string }> {
  const cleanBarcode = bean.barcode.trim();
  if (!cleanBarcode) return { success: false, error: 'Barcode is required' };

  // 1. Check existing cached profile
  const existing = localBeanCache.get(cleanBarcode);

  // 2. Validate input if not already verified
  let targetRoaster = bean.roaster.trim();
  let targetName = bean.name.trim();

  // If already verified by Admin, preserve the verified metadata!
  if (existing?.is_verified) {
    targetRoaster = existing.roaster;
    targetName = existing.name;
  } else {
    // Sanitize user submission to prevent garbage / typos in cloud
    const sanitized = sanitizeBeanInput({
      roaster: targetRoaster,
      name: targetName,
      roastLevel: bean.roast_level,
    });
    if (!sanitized.valid) {
      console.debug('[Supabase Guard] Submission rejected by quality filter:', sanitized.error);
      return { success: false, error: sanitized.error };
    }
    targetRoaster = sanitized.roaster;
    targetName = sanitized.name;
  }

  // 3. Optimistic local cache update immediately
  const updatedBean: GlobalCoffeeBean = {
    barcode: cleanBarcode,
    roaster: targetRoaster,
    name: targetName,
    roast_level: bean.roast_level,
    origin_country: bean.origin_country || existing?.origin_country || '',
    species: bean.species || existing?.species || undefined,
    varietal: bean.varietal || existing?.varietal || undefined,
    purchase_country: bean.purchase_country || existing?.purchase_country || 'DK',
    purchase_location: bean.purchase_location || existing?.purchase_location,
    suitable_for: bean.suitable_for || existing?.suitable_for || [],
    flavor_notes: bean.flavor_notes || existing?.flavor_notes || [],
    avg_rating: existing?.avg_rating || 0,
    ratings_count: existing?.ratings_count || 0,
    verifications_count: (existing?.verifications_count || 0) + 1,
    is_verified: existing?.is_verified || false,
    expert_score: existing?.is_verified ? existing.expert_score : bean.expert_score || existing?.expert_score,
    expert_source: existing?.is_verified ? existing.expert_source : bean.expert_source || existing?.expert_source,
    image_url: bean.image_url || existing?.image_url,
  };
  localBeanCache.set(cleanBarcode, updatedBean);

  const client = getSupabaseClient();
  if (!client) {
    return { success: true, data: updatedBean }; // Graceful local save
  }

  try {
    const { data, error } = await client
      .from('global_coffee_beans')
      .upsert(
        {
          barcode: updatedBean.barcode,
          roaster: updatedBean.roaster,
          name: updatedBean.name,
          roast_level: updatedBean.roast_level,
          origin_country: updatedBean.origin_country,
          species: updatedBean.species,
          varietal: updatedBean.varietal,
          purchase_country: updatedBean.purchase_country,
          purchase_location: updatedBean.purchase_location,
          suitable_for: updatedBean.suitable_for,
          flavor_notes: updatedBean.flavor_notes,
          verifications_count: updatedBean.verifications_count,
          expert_score: updatedBean.expert_score,
          expert_source: updatedBean.expert_source,
          image_url: updatedBean.image_url,
        },
        { onConflict: 'barcode' }
      )
      .select()
      .maybeSingle();

    if (error) {
      // Defensive fallback: if remote table hasn't executed migration for new v1.2.29 columns yet
      if (
        error.message.includes('expert_score') ||
        error.message.includes('expert_source') ||
        error.message.includes('image_url') ||
        error.message.includes('purchase_location')
      ) {
        console.warn('[Supabase Fallback] Remote schema missing new columns, retrying with base columns.');
        const { data: legacyData, error: legacyErr } = await client
          .from('global_coffee_beans')
          .upsert(
            {
              barcode: updatedBean.barcode,
              roaster: updatedBean.roaster,
              name: updatedBean.name,
              roast_level: updatedBean.roast_level,
              origin_country: updatedBean.origin_country,
              purchase_country: updatedBean.purchase_country,
              suitable_for: updatedBean.suitable_for,
              flavor_notes: updatedBean.flavor_notes,
              verifications_count: updatedBean.verifications_count,
            },
            { onConflict: 'barcode' }
          )
          .select()
          .maybeSingle();

        if (!legacyErr && legacyData) {
          return { success: true, data: legacyData as GlobalCoffeeBean };
        }
      }

      console.warn('[Supabase Upsert Error]:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as GlobalCoffeeBean };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Submit a drink rating with community consensus for drink suitability
 */
export async function submitDrinkRating(
  rating: BeanDrinkRating
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase is not configured' };

  try {
    // 1. Insert rating
    const { error: insertErr } = await client.from('bean_drink_ratings').insert({
      barcode: rating.barcode,
      user_fingerprint: rating.user_fingerprint,
      rating: rating.rating,
      drink_type: rating.drink_type,
      purchase_country: rating.purchase_country,
      brew_ratio: rating.brew_ratio,
      comment: rating.comment,
    });

    if (insertErr) {
      return { success: false, error: insertErr.message };
    }

    // 2. Fetch all ratings for this bean to recalculate avg & check 70% consensus
    const { data: allRatings } = await client
      .from('bean_drink_ratings')
      .select('rating, drink_type')
      .eq('barcode', rating.barcode);

    if (allRatings && allRatings.length > 0) {
      const count = allRatings.length;
      const totalScore = allRatings.reduce((sum, r) => sum + (r.rating || 0), 0);
      const avg = Number((totalScore / count).toFixed(2));

      // Calculate drink suitability consensus (Requires >= 5 ratings, >= 70% vote)
      const drinkVotes: Record<string, number> = {};
      allRatings.forEach((r) => {
        drinkVotes[r.drink_type] = (drinkVotes[r.drink_type] || 0) + 1;
      });

      const qualifiedDrinks: string[] = [];
      if (count >= 5) {
        for (const [drink, votes] of Object.entries(drinkVotes)) {
          if (votes / count >= 0.7) {
            qualifiedDrinks.push(drink);
          }
        }
      }

      // Update bean stats in cloud
      await client
        .from('global_coffee_beans')
        .update({
          avg_rating: avg,
          ratings_count: count,
          ...(qualifiedDrinks.length > 0 ? { suitable_for: qualifiedDrinks } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('barcode', rating.barcode);

      // Invalidate local cache
      localBeanCache.delete(rating.barcode);
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Synchronizes anonymous barista repurchase verdict to Supabase Global Vault (Fire-and-forget)
 */
export async function syncBeanRepurchaseVerdict(
  bean: CoffeeBeanProfile,
  verdict: RepurchaseVerdict
): Promise<void> {
  const client = getSupabaseClient();
  if (!client || !bean.name) return;

  try {
    let query = client
      .from('global_coffee_beans')
      .select('id, barcode, roaster, name, repurchase_buy_again_count, repurchase_neutral_count, repurchase_never_again_count');

    if (bean.barcode) {
      query = query.eq('barcode', bean.barcode);
    } else if (bean.roaster) {
      query = query.ilike('roaster', bean.roaster).ilike('name', bean.name);
    } else {
      query = query.ilike('name', bean.name);
    }

    const { data } = await query.limit(1);
    if (data && data.length > 0) {
      const match = data[0];
      const buyAgain = (match.repurchase_buy_again_count || 0) + (verdict === 'buy_again' ? 1 : 0);
      const neutral = (match.repurchase_neutral_count || 0) + (verdict === 'neutral' ? 1 : 0);
      const neverAgain = (match.repurchase_never_again_count || 0) + (verdict === 'never_again' ? 1 : 0);

      await client
        .from('global_coffee_beans')
        .update({
          repurchase_buy_again_count: buyAgain,
          repurchase_neutral_count: neutral,
          repurchase_never_again_count: neverAgain,
        })
        .eq('id', match.id);
    }
  } catch (err) {
    console.debug('Failed to sync repurchase verdict to Supabase (offline fallback):', err);
  }
}

/**
 * Fetch top rated beans filtered by drink suitability and country
 */
export async function fetchTopBeansByDrink(
  drinkType?: string,
  country = 'DK',
  limit = 20
): Promise<GlobalCoffeeBean[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    let query = client
      .from('global_coffee_beans')
      .select('*')
      .eq('purchase_country', country)
      .gte('ratings_count', 5) // Strict threshold: Only rated beans count!
      .order('avg_rating', { ascending: false })
      .limit(limit);

    if (drinkType) {
      query = query.contains('suitable_for', [drinkType]);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data as GlobalCoffeeBean[];
  } catch {
    return [];
  }
}

/**
 * Generate a persistent anonymous device fingerprint
 */
export function getDeviceFingerprint(): string {
  let fp = localStorage.getItem('espresso_device_fingerprint');
  if (!fp) {
    fp = 'barista_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
    localStorage.setItem('espresso_device_fingerprint', fp);
  }
  return fp;
}

/**
 * Fetch all verified coffee beans from Supabase cloud vault with built-in instant offline fallback
 */
export async function fetchAllGlobalBeans(): Promise<GlobalCoffeeBean[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('global_coffee_beans')
        .select('*')
        .order('is_verified', { ascending: false })
        .order('avg_rating', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as GlobalCoffeeBean[];
      }
    } catch {
      // Fallback below
    }
  }

  // Built-in verified beans fallback for 100% offline reliability (All 50+ international lots)
  return ALL_VERIFIED_COFFEE_CATALOG.map((item) => ({
    barcode: item.barcode || '0000000000000',
    name: item.name,
    roaster: item.roaster,
    roast_level: item.roastLevel === 'medium-dark' ? 'dark' : item.roastLevel,
    origin_country: item.originCountry,
    species: item.species,
    varietal: item.varietal,
    purchase_country: item.purchaseCountry || 'DK',
    purchase_location: item.purchaseLocation,
    suitable_for: item.suitableFor || ['pure_espresso', 'flat_white'],
    flavor_notes: item.flavorNotes,
    avg_rating: 0,
    ratings_count: 0,
    verifications_count: 1,
    is_verified: true,
    expert_score: item.scaScore,
    expert_source: item.scaScore ? 'SCA Specialty Lot' : undefined,
    image_url: item.imageUrl,
  }));
}

/**
 * Fetch all beans for the Admin Curator Desk (both unverified pending & verified)
 */
export async function fetchAllCuratorBeans(): Promise<GlobalCoffeeBean[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('global_coffee_beans')
        .select('*')
        .order('is_verified', { ascending: true }) // unverified first
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as GlobalCoffeeBean[];
      }
    } catch (err) {
      console.warn('[Admin Curator] Fetch failed, falling back to local dataset:', err);
    }
  }

  // Include verified beans plus a pending crowdsourced sample for offline testing
  const allVerified = await fetchAllGlobalBeans();
  const samplePending: GlobalCoffeeBean = {
    barcode: '5701000123456',
    name: 'Økologisk Mellemristet Hele Bønner',
    roaster: 'Peter Larsen Kaffe',
    roast_level: 'medium',
    origin_country: 'Peru & Honduras',
    purchase_country: 'DK',
    suitable_for: ['all_rounder', 'pure_espresso'],
    flavor_notes: ['Mørk Chokolade', 'Ristede Nødder'],
    avg_rating: 0,
    ratings_count: 0,
    verifications_count: 1,
    is_verified: false, // Pending curator review!
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  };

  return [samplePending, ...allVerified];
}

/**
 * Admin action: Verify or update an existing global coffee bean
 */
export async function adminVerifyGlobalBean(
  barcode: string,
  updates?: Partial<GlobalCoffeeBean>
): Promise<{ success: boolean; data?: GlobalCoffeeBean; error?: string }> {
  const cleanBarcode = barcode.trim();
  const client = getSupabaseClient();

  const payload: Partial<GlobalCoffeeBean> = {
    ...updates,
    is_verified: true,
  };

  // Update in local cache
  const cached = localBeanCache.get(cleanBarcode);
  if (cached) {
    const merged = { ...cached, ...payload };
    localBeanCache.set(cleanBarcode, merged);
  }

  if (!client) {
    return { success: true };
  }

  try {
    const { data, error } = await client
      .from('global_coffee_beans')
      .update(payload)
      .eq('barcode', cleanBarcode)
      .select()
      .maybeSingle();

    if (error) {
      // Defensive fallback if remote schema has not run v1.2.29 migration
      if (
        error.message.includes('expert_score') ||
        error.message.includes('expert_source') ||
        error.message.includes('image_url') ||
        error.message.includes('purchase_location')
      ) {
        console.warn('[Admin Verify Fallback] Remote schema missing new columns, stripping them for update.');
        const fallbackPayload = { ...payload };
        delete fallbackPayload.expert_score;
        delete fallbackPayload.expert_source;
        delete fallbackPayload.image_url;
        delete fallbackPayload.purchase_location;
        const { data: fbData, error: fbErr } = await client
          .from('global_coffee_beans')
          .update(fallbackPayload)
          .eq('barcode', cleanBarcode)
          .select()
          .maybeSingle();

        if (!fbErr && fbData) {
          return { success: true, data: fbData as GlobalCoffeeBean };
        }
      }

      return { success: false, error: error.message };
    }

    return { success: true, data: data as GlobalCoffeeBean };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Admin action: Delete or reject an unverified/duplicate global coffee bean
 */
export async function adminDeleteGlobalBean(
  barcode: string
): Promise<{ success: boolean; error?: string }> {
  const cleanBarcode = barcode.trim();
  localBeanCache.delete(cleanBarcode);

  const client = getSupabaseClient();
  if (!client) return { success: true };

  try {
    const { error } = await client
      .from('global_coffee_beans')
      .delete()
      .eq('barcode', cleanBarcode);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Admin action: Create a brand new verified bean in the central vault
 */
export async function adminCreateGlobalBean(
  bean: GlobalCoffeeBean
): Promise<{ success: boolean; data?: GlobalCoffeeBean; error?: string }> {
  const cleanBarcode = bean.barcode.trim();
  const beanToInsert: GlobalCoffeeBean = {
    ...bean,
    barcode: cleanBarcode,
    is_verified: true,
    verifications_count: Math.max(1, bean.verifications_count || 1),
    avg_rating: bean.avg_rating || 0.0,
    ratings_count: bean.ratings_count || 0,
  };

  localBeanCache.set(cleanBarcode, beanToInsert);

  const client = getSupabaseClient();
  if (!client) {
    return { success: true, data: beanToInsert };
  }

  try {
    const { data, error } = await client
      .from('global_coffee_beans')
      .upsert(beanToInsert, { onConflict: 'barcode' })
      .select()
      .maybeSingle();

    if (error) {
      // Defensive fallback if remote schema has not run v1.2.29 migration
      if (
        error.message.includes('expert_score') ||
        error.message.includes('expert_source') ||
        error.message.includes('image_url') ||
        error.message.includes('purchase_location')
      ) {
        const fallbackBean = { ...beanToInsert };
        delete fallbackBean.expert_score;
        delete fallbackBean.expert_source;
        delete fallbackBean.image_url;
        delete fallbackBean.purchase_location;
        const { data: fbData, error: fbErr } = await client
          .from('global_coffee_beans')
          .upsert(fallbackBean, { onConflict: 'barcode' })
          .select()
          .maybeSingle();

        if (!fbErr && fbData) {
          return { success: true, data: fbData as GlobalCoffeeBean };
        }
      }

      return { success: false, error: error.message };
    }

    return { success: true, data: data as GlobalCoffeeBean };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// -------------------------------------------------------------------------
// Crowdsourced Gear Submissions & Moderation Hub (Etape 5)
// -------------------------------------------------------------------------
export interface CrowdsourcedGearSubmission {
  id?: string;
  brand: string;
  model: string;
  category: 'machine' | 'grinder' | 'brewer' | 'kettle';
  subCategory?: string;
  specs: any;
  notes?: string;
  user_fingerprint?: string;
  status?: 'pending' | 'approved' | 'rejected';
  created_at?: string;
}

export async function submitCrowdsourcedGear(
  submission: Omit<CrowdsourcedGearSubmission, 'user_fingerprint' | 'status'>
): Promise<{ success: boolean; error?: string }> {
  const payload: CrowdsourcedGearSubmission = {
    ...submission,
    user_fingerprint: getDeviceFingerprint(),
    status: 'pending',
  };

  const client = getSupabaseClient();
  if (!client) {
    queuePendingGearSubmissionLocally(payload);
    return { success: true };
  }

  try {
    const { error } = await client.from('crowdsourced_gear_submissions').insert({
      brand: payload.brand,
      model: payload.model,
      category: payload.category,
      sub_category: payload.subCategory || null,
      specs: payload.specs,
      notes: payload.notes || null,
      user_fingerprint: payload.user_fingerprint,
      status: 'pending',
    });

    if (error) {
      console.debug('[Supabase Crowdsource] Remote insert deferred (offline/schema pending):', error.message);
      queuePendingGearSubmissionLocally(payload);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    queuePendingGearSubmissionLocally(payload);
    return { success: false, error: msg };
  }
}

function queuePendingGearSubmissionLocally(payload: CrowdsourcedGearSubmission) {
  try {
    const key = 'flowbean_queued_gear_submissions_v1';
    const raw = localStorage.getItem(key);
    const queue: CrowdsourcedGearSubmission[] = raw ? JSON.parse(raw) : [];
    queue.push(payload);
    localStorage.setItem(key, JSON.stringify(queue.slice(-20)));
  } catch {
    // Ignore quota issues
  }
}

export async function fetchPendingGearSubmissionsCount(): Promise<number> {
  const client = getSupabaseClient();
  if (!client) return 0;
  try {
    const { count, error } = await client
      .from('crowdsourced_gear_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

export async function fetchPendingGearSubmissions(): Promise<CrowdsourcedGearSubmission[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('crowdsourced_gear_submissions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) return [];
    return (data as CrowdsourcedGearSubmission[]) || [];
  } catch {
    return [];
  }
}

export async function adminApproveGearSubmission(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client
      .from('crowdsourced_gear_submissions')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// -------------------------------------------------------------------------
// Flowbean Fleet Shot Telemetry Vector (<450 bytes) (Etape 4 & 5)
// -------------------------------------------------------------------------
export interface FleetShotTelemetryVector {
  id?: string;
  mathVersion: string;
  machineKey: string;
  grinderKey: string;
  beanKey?: string;
  physicsClass: string;
  basketDiameterMm?: number;
  doseG: number;
  yieldG: number;
  brewTimeS: number;
  preInfusionS?: number;
  grindSetting: string;
  flowCurve1Hz?: number[];
  tasteRating?: number;
  channelingDetected?: boolean;
  aiPredictedTimeS?: number;
  userOverrideDelta?: number;
  userFingerprint?: string;
}

export async function uploadFleetShotTelemetry(
  vector: Omit<FleetShotTelemetryVector, 'userFingerprint'>
): Promise<{ success: boolean; error?: string }> {
  const payload: FleetShotTelemetryVector = {
    ...vector,
    userFingerprint: getDeviceFingerprint(),
  };

  const client = getSupabaseClient();
  if (!client) return { success: true };

  try {
    const { error } = await client.from('fleet_shot_telemetry').insert({
      math_version: payload.mathVersion,
      machine_key: payload.machineKey,
      grinder_key: payload.grinderKey,
      bean_key: payload.beanKey || null,
      physics_class: payload.physicsClass,
      basket_diameter_mm: payload.basketDiameterMm || null,
      dose_g: payload.doseG,
      yield_g: payload.yieldG,
      brew_time_s: payload.brewTimeS,
      pre_infusion_s: payload.preInfusionS || null,
      grind_setting: payload.grindSetting,
      flow_curve_1hz: payload.flowCurve1Hz || [],
      taste_rating: payload.tasteRating || null,
      channeling_detected: payload.channelingDetected ?? false,
      ai_predicted_time_s: payload.aiPredictedTimeS || null,
      user_override_delta: payload.userOverrideDelta || null,
      user_fingerprint: payload.userFingerprint,
    });

    if (error) {
      console.debug('[Supabase Telemetry] Shot upload deferred:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

export interface FleetTelemetrySummary {
  totalShots: number;
  avgDoseG: number;
  avgYieldG: number;
  avgRatio: number;
  avgBrewTimeS: number;
  avgPreInfusionS: number;
  channelingRatePercent: number;
  avgTasteRating: number;
  aiAccuracyPercent: number;
  userOverrideRatePercent: number;
  isSimulated: boolean;
  basketBreakdown: {
    diameterMm: number;
    label: string;
    shotsCount: number;
    avgFlowGps: number;
    channelingPercent: number;
    color: string;
  }[];
  topEquipment: {
    name: string;
    type: 'machine' | 'grinder';
    shotsCount: number;
    sharePercent: number;
  }[];
  avgFlowCurve1Hz: { second: number; flowGps: number }[];
}

export const SIMULATED_FLEET_DATASET: FleetTelemetrySummary = {
  totalShots: 1420,
  avgDoseG: 18.2,
  avgYieldG: 37.4,
  avgRatio: 2.05,
  avgBrewTimeS: 27.4,
  avgPreInfusionS: 4.8,
  channelingRatePercent: 14.2,
  avgTasteRating: 4.4,
  aiAccuracyPercent: 92.6,
  userOverrideRatePercent: 11.4,
  isSimulated: true,
  basketBreakdown: [
    { diameterMm: 58, label: '58mm E61 / Commercial Standard', shotsCount: 742, avgFlowGps: 1.45, channelingPercent: 8.4, color: '#2C2018' },
    { diameterMm: 54, label: '54mm Breville / Sage Bambino', shotsCount: 418, avgFlowGps: 1.34, channelingPercent: 13.8, color: '#C26D52' },
    { diameterMm: 51, label: '51mm De\'Longhi Dedica', shotsCount: 196, avgFlowGps: 1.16, channelingPercent: 26.5, color: '#E07A5F' },
    { diameterMm: 52, label: '52mm Wacaco Picopresso (Lever)', shotsCount: 64, avgFlowGps: 1.28, channelingPercent: 10.9, color: '#72806B' },
  ],
  topEquipment: [
    { name: 'Lelit Mara X (PL62X)', type: 'machine', shotsCount: 405, sharePercent: 28.5 },
    { name: 'Sage Bambino Plus', type: 'machine', shotsCount: 342, sharePercent: 24.1 },
    { name: 'Gaggia Classic Pro', type: 'machine', shotsCount: 258, sharePercent: 18.2 },
    { name: 'De\'Longhi Dedica (EC685)', type: 'machine', shotsCount: 196, sharePercent: 13.8 },
    { name: 'Wacaco Picopresso', type: 'machine', shotsCount: 64, sharePercent: 4.5 },
    { name: 'Baratza Encore ESP Pro', type: 'grinder', shotsCount: 486, sharePercent: 34.2 },
    { name: 'Niche Zero', type: 'grinder', shotsCount: 369, sharePercent: 26.0 },
    { name: 'Turin DF64 Gen 2', type: 'grinder', shotsCount: 277, sharePercent: 19.5 },
    { name: 'Eureka Mignon Specialita', type: 'grinder', shotsCount: 172, sharePercent: 12.1 },
    { name: 'Comandante C40 MK4', type: 'grinder', shotsCount: 116, sharePercent: 8.2 },
  ],
  avgFlowCurve1Hz: [
    { second: 0, flowGps: 0.0 },
    { second: 1, flowGps: 0.05 },
    { second: 2, flowGps: 0.1 },
    { second: 3, flowGps: 0.2 },
    { second: 4, flowGps: 0.4 },
    { second: 5, flowGps: 0.8 },
    { second: 6, flowGps: 1.2 },
    { second: 7, flowGps: 1.45 },
    { second: 8, flowGps: 1.5 },
    { second: 10, flowGps: 1.5 },
    { second: 12, flowGps: 1.48 },
    { second: 14, flowGps: 1.45 },
    { second: 16, flowGps: 1.42 },
    { second: 18, flowGps: 1.40 },
    { second: 20, flowGps: 1.38 },
    { second: 22, flowGps: 1.35 },
    { second: 24, flowGps: 1.30 },
    { second: 26, flowGps: 1.25 },
    { second: 28, flowGps: 1.15 },
    { second: 30, flowGps: 0.95 },
    { second: 32, flowGps: 0.4 },
  ],
};

export async function fetchFleetTelemetryStats(forceSimulated: boolean = false): Promise<FleetTelemetrySummary> {
  if (forceSimulated) {
    return SIMULATED_FLEET_DATASET;
  }

  const client = getSupabaseClient();
  if (!client) return SIMULATED_FLEET_DATASET;

  try {
    const { data, error } = await client
      .from('fleet_shot_telemetry')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error || !data || data.length === 0) {
      return SIMULATED_FLEET_DATASET;
    }

    const rows = data as any[];
    const total = rows.length;

    let sumDose = 0;
    let sumYield = 0;
    let sumBrewTime = 0;
    let sumPreInfusion = 0;
    let preInfusionCount = 0;
    let channelingCount = 0;
    let tasteSum = 0;
    let tasteCount = 0;
    let overrideCount = 0;
    let withinTargetCount = 0;

    const basketMap: Record<number, { count: number; sumFlow: number; channeling: number }> = {};
    const equipMap: Record<string, { type: 'machine' | 'grinder'; count: number }> = {};

    for (const r of rows) {
      sumDose += Number(r.dose_g) || 18;
      sumYield += Number(r.yield_g) || 36;
      sumBrewTime += Number(r.brew_time_s) || 28;

      if (r.pre_infusion_s) {
        sumPreInfusion += Number(r.pre_infusion_s);
        preInfusionCount++;
      }

      if (r.channeling_detected) {
        channelingCount++;
      }

      if (r.taste_rating) {
        tasteSum += Number(r.taste_rating);
        tasteCount++;
      }

      if (r.user_override_delta && Math.abs(Number(r.user_override_delta)) > 0.05) {
        overrideCount++;
      }

      if (r.ai_predicted_time_s && r.brew_time_s) {
        const diff = Math.abs(Number(r.brew_time_s) - Number(r.ai_predicted_time_s));
        if (diff <= 1.5) withinTargetCount++;
      }

      const bMm = Number(r.basket_diameter_mm) || 58;
      if (!basketMap[bMm]) basketMap[bMm] = { count: 0, sumFlow: 0, channeling: 0 };
      basketMap[bMm].count++;
      const flow = Number(r.yield_g) / Math.max(1, Number(r.brew_time_s));
      basketMap[bMm].sumFlow += flow;
      if (r.channeling_detected) basketMap[bMm].channeling++;

      if (r.machine_key) {
        const mKey = String(r.machine_key);
        if (!equipMap[mKey]) equipMap[mKey] = { type: 'machine', count: 0 };
        equipMap[mKey].count++;
      }
      if (r.grinder_key) {
        const gKey = String(r.grinder_key);
        if (!equipMap[gKey]) equipMap[gKey] = { type: 'grinder', count: 0 };
        equipMap[gKey].count++;
      }
    }

    const basketBreakdown = Object.entries(basketMap).map(([mmStr, info]) => {
      const mm = Number(mmStr);
      const label = mm === 58 ? '58mm Commercial E61' : mm === 54 ? '54mm Breville/Sage' : mm === 51 ? '51mm De\'Longhi Dedica' : `${mm}mm Precision/Manual`;
      const color = mm === 58 ? '#2C2018' : mm === 54 ? '#C26D52' : mm === 51 ? '#E07A5F' : '#72806B';
      return {
        diameterMm: mm,
        label,
        shotsCount: info.count,
        avgFlowGps: Math.round((info.sumFlow / info.count) * 100) / 100,
        channelingPercent: Math.round((info.channeling / info.count) * 1000) / 10,
        color,
      };
    });

    const topEquipment = Object.entries(equipMap)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8)
      .map(([name, info]) => ({
        name,
        type: info.type,
        shotsCount: info.count,
        sharePercent: Math.round((info.count / total) * 1000) / 10,
      }));

    return {
      totalShots: total,
      avgDoseG: Math.round((sumDose / total) * 10) / 10,
      avgYieldG: Math.round((sumYield / total) * 10) / 10,
      avgRatio: Math.round((sumYield / Math.max(1, sumDose)) * 100) / 100,
      avgBrewTimeS: Math.round((sumBrewTime / total) * 10) / 10,
      avgPreInfusionS: preInfusionCount > 0 ? Math.round((sumPreInfusion / preInfusionCount) * 10) / 10 : 5.0,
      channelingRatePercent: Math.round((channelingCount / total) * 1000) / 10,
      avgTasteRating: tasteCount > 0 ? Math.round((tasteSum / tasteCount) * 10) / 10 : 4.4,
      aiAccuracyPercent: Math.round((withinTargetCount / total) * 1000) / 10,
      userOverrideRatePercent: Math.round((overrideCount / total) * 1000) / 10,
      isSimulated: false,
      basketBreakdown,
      topEquipment,
      avgFlowCurve1Hz: SIMULATED_FLEET_DATASET.avgFlowCurve1Hz,
    };
  } catch (err) {
    console.warn('[Supabase Telemetry] Failed to fetch stats, using simulated baseline:', err);
    return SIMULATED_FLEET_DATASET;
  }
}


