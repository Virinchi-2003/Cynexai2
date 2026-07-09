import { client } from '../turso';

export interface MarketingMetric {
  id: string;
  platform: string;
  spend: number;
  leads_generated: number;
  traffic: number;
  updated_at: string;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  status: string;
  budget: number;
  spent: number;
  leads: number;
  platform: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function executeWithRetry(query: string, args: any[] = [], retries = MAX_RETRIES): Promise<any> {
  try {
    if (!client) throw new Error('Database client not configured');
    return await client.execute({ sql: query, args });
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return executeWithRetry(query, args, retries - 1);
    }
    throw error;
  }
}

export async function getMarketingMetrics(): Promise<MarketingMetric[]> {
  try {
    const res = await executeWithRetry('SELECT * FROM marketing_metrics');
    return res.rows.map((row: any) => ({
      id: row.id,
      platform: row.platform,
      spend: Number(row.spend),
      leads_generated: Number(row.leads_generated),
      traffic: Number(row.traffic),
      updated_at: row.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch marketing metrics:', error);
    return [];
  }
}

export async function getMarketingCampaigns(): Promise<MarketingCampaign[]> {
  try {
    const res = await executeWithRetry('SELECT * FROM marketing_campaigns');
    return res.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      status: row.status,
      budget: Number(row.budget),
      spent: Number(row.spent),
      leads: Number(row.leads),
      platform: row.platform
    }));
  } catch (error) {
    console.error('Failed to fetch marketing campaigns:', error);
    return [];
  }
}
