/**
 * Aegis Module - Threat Intelligence Service
 * 
 * Integrates with multiple threat intelligence APIs:
 * - VirusTotal (file/IP/domain reputation)
 * - AbuseIPDB (IP abuse scores)
 */

import axios, { AxiosInstance } from 'axios';

export interface ThreatIntelResult {
  threatLevel: 'malicious' | 'suspicious' | 'benign' | 'unknown';
  verdicts: Array<{
    source: string;
    verdict: string;
    confidence: number;
  }>;
  tags: string[];
  geoLocation?: {
    country: string;
    city: string;
  };
  asn?: {
    number: number;
    name: string;
  };
  lastSeen?: Date;
}

/**
 * VirusTotal Integration
 */
export class VirusTotalService {
  private apiKey: string;
  private baseUrl = 'https://www.virustotal.com/api/v3';
  private client: AxiosInstance;
  private timeout = 10000; // 10 seconds

  constructor() {
    this.apiKey = process.env.VIRUSTOTAL_API_KEY || '';

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'x-apikey': this.apiKey,
      },
      timeout: this.timeout,
    });

    if (!this.apiKey) {
      console.warn('[ThreatIntel] VirusTotal API key not configured - set VIRUSTOTAL_API_KEY environment variable');
    }
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Validate API configuration
   */
  async validateConfiguration(): Promise<{ valid: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return { valid: false, error: 'API key not configured' };
    }

    try {
      // Test API with a basic request
      await this.client.get('/ip_addresses/8.8.8.8', { timeout: 5000 });
      return { valid: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { valid: false, error: `API validation failed: ${message}` };
    }
  }

  /**
   * Enrich IP address with threat intelligence
   */
  async enrichIP(ip: string): Promise<ThreatIntelResult | null> {
    if (!this.apiKey) {
      console.warn('[ThreatIntel] VirusTotal not configured, skipping IP enrichment');
      return null;
    }

    try {
      const response = await this.client.get(`/ip_addresses/${ip}`);
      const data = response.data.data.attributes;
      const stats = data.last_analysis_stats || {};

      const malicious = stats.malicious || 0;
      const suspicious = stats.suspicious || 0;
      const harmless = stats.harmless || 0;
      const undetected = stats.undetected || 0;
      const total = malicious + suspicious + harmless + undetected;

      let threatLevel: ThreatIntelResult['threatLevel'] = 'unknown';
      if (total === 0) {
        threatLevel = 'unknown';
      } else if (malicious > 0) {
        threatLevel = 'malicious';
      } else if (suspicious > 0) {
        threatLevel = 'suspicious';
      } else {
        threatLevel = 'benign';
      }

      return {
        threatLevel,
        verdicts: [
          {
            source: 'VirusTotal',
            verdict: `${malicious}/${total} vendors flagged as malicious`,
            confidence: total > 0 ? (malicious / total) * 100 : 0,
          },
        ],
        tags: data.tags || [],
        geoLocation: {
          country: data.country || 'Unknown',
          city: data.city || 'Unknown',
        },
        asn: data.asn
          ? {
              number: data.asn,
              name: data.as_owner || 'Unknown',
            }
          : undefined,
      };
    } catch (error) {
      console.error('[ThreatIntel] VirusTotal IP enrichment failed:', error);
      return null;
    }
  }

  /**
   * Enrich domain with threat intelligence
   */
  async enrichDomain(domain: string): Promise<ThreatIntelResult | null> {
    if (!this.apiKey) return null;

    try {
      const response = await this.client.get(`/domains/${domain}`);
      const data = response.data.data.attributes;
      const stats = data.last_analysis_stats || {};

      const malicious = stats.malicious || 0;
      const suspicious = stats.suspicious || 0;
      const harmless = stats.harmless || 0;
      const undetected = stats.undetected || 0;
      const total = malicious + suspicious + harmless + undetected;

      return {
        threatLevel:
          malicious > 0 ? 'malicious' : suspicious > 0 ? 'suspicious' : total > 0 ? 'benign' : 'unknown',
        verdicts: [
          {
            source: 'VirusTotal',
            verdict: `${malicious}/${total} vendors flagged as malicious`,
            confidence: total > 0 ? (malicious / total) * 100 : 0,
          },
        ],
        tags: data.categories || [],
        lastSeen: data.last_analysis_date
          ? new Date(data.last_analysis_date * 1000)
          : undefined,
      };
    } catch (error) {
      console.error('[ThreatIntel] VirusTotal domain enrichment failed:', error);
      return null;
    }
  }

  /**
   * Enrich file hash with threat intelligence
   */
  async enrichFileHash(hash: string): Promise<ThreatIntelResult | null> {
    if (!this.apiKey) return null;

    try {
      const response = await this.client.get(`/files/${hash}`);
      const data = response.data.data.attributes;
      const stats = data.last_analysis_stats || {};

      const malicious = stats.malicious || 0;
      const total = Object.values(stats).reduce((a: number, b: unknown) => {
        return a + (typeof b === 'number' ? b : 0);
      }, 0);

      return {
        threatLevel: malicious > 0 ? 'malicious' : 'benign',
        verdicts: [
          {
            source: 'VirusTotal',
            verdict: `${malicious}/${total} antivirus engines detected malware`,
            confidence: total > 0 ? (malicious / total) * 100 : 0,
          },
        ],
        tags: data.tags || [],
      };
    } catch (error) {
      console.error('[ThreatIntel] VirusTotal file hash enrichment failed:', error);
      return null;
    }
  }
}

/**
 * AbuseIPDB Integration
 */
export class AbuseIPDBService {
  private apiKey: string;
  private baseUrl = 'https://api.abuseipdb.com/api/v2';
  private client: AxiosInstance;
  private timeout = 10000;

  constructor() {
    this.apiKey = process.env.ABUSEIPDB_API_KEY || '';

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Key: this.apiKey,
      },
      timeout: this.timeout,
    });

    if (!this.apiKey) {
      console.warn('[ThreatIntel] AbuseIPDB API key not configured - set ABUSEIPDB_API_KEY environment variable');
    }
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Validate API configuration
   */
  async validateConfiguration(): Promise<{ valid: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return { valid: false, error: 'API key not configured' };
    }

    try {
      // Test API with a basic request
      await this.client.get('/check', {
        params: { ipAddress: '8.8.8.8', maxAgeInDays: 90 },
        timeout: 5000,
      });
      return { valid: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { valid: false, error: `API validation failed: ${message}` };
    }
  }

  /**
   * Enrich IP address with AbuseIPDB data
   */
  async enrichIP(ip: string): Promise<ThreatIntelResult | null> {
    if (!this.apiKey) {
      console.warn('[ThreatIntel] AbuseIPDB not configured, skipping IP enrichment');
      return null;
    }

    try {
      const response = await this.client.get('/check', {
        params: {
          ipAddress: ip,
          maxAgeInDays: 90,
        },
      });

      const data = response.data.data;
      const abuseScore = data.abuseConfidenceScore || 0;

      return {
        threatLevel:
          abuseScore > 75 ? 'malicious' : abuseScore > 25 ? 'suspicious' : 'benign',
        verdicts: [
          {
            source: 'AbuseIPDB',
            verdict: `Abuse confidence: ${abuseScore}% (${data.totalReports || 0} reports)`,
            confidence: abuseScore,
          },
        ],
        tags: data.usageType ? [data.usageType] : [],
        geoLocation: {
          country: data.countryCode || 'Unknown',
          city: data.city || 'Unknown',
        },
      };
    } catch (error) {
      console.error('[ThreatIntel] AbuseIPDB enrichment failed:', error);
      return null;
    }
  }
}

/**
 * Threat Intelligence Orchestrator
 * 
 * Combines multiple threat intelligence services and aggregates results
 */
export class ThreatIntelOrchestrator {
  private virusTotal = new VirusTotalService();
  private abuseIPDB = new AbuseIPDBService();

  /**
   * Get status of all threat intelligence services
   */
  async getServicesStatus(): Promise<{
    virusTotal: { configured: boolean; valid?: boolean; error?: string };
    abuseIPDB: { configured: boolean; valid?: boolean; error?: string };
  }> {
    const status: {
      virusTotal: { configured: boolean; valid?: boolean; error?: string };
      abuseIPDB: { configured: boolean; valid?: boolean; error?: string };
    } = {
      virusTotal: { configured: this.virusTotal.isConfigured() },
      abuseIPDB: { configured: this.abuseIPDB.isConfigured() },
    };

    // Validate configured services
    if (status.virusTotal.configured) {
      const validation = await this.virusTotal.validateConfiguration();
      status.virusTotal.valid = validation.valid;
      if (!validation.valid) status.virusTotal.error = validation.error;
    }

    if (status.abuseIPDB.configured) {
      const validation = await this.abuseIPDB.validateConfiguration();
      status.abuseIPDB.valid = validation.valid;
      if (!validation.valid) status.abuseIPDB.error = validation.error;
    }

    return status;
  }

  /**
   * Get list of available services
   */
  getAvailableServices(): string[] {
    const services: string[] = [];
    if (this.virusTotal.isConfigured()) services.push('virustotal');
    if (this.abuseIPDB.isConfigured()) services.push('abuseipdb');
    return services;
  }

  /**
   * Enrich observable with threat intelligence from multiple sources
   */
  async enrichObservable(
    type: string,
    value: string,
    services: string[] = ['virustotal', 'abuseipdb']
  ): Promise<ThreatIntelResult> {
    const results: ThreatIntelResult[] = [];

    // Run enrichments in parallel
    const promises: Promise<ThreatIntelResult | null>[] = [];

    // Route to appropriate services based on observable type
    if (type === 'IP') {
      if (services.includes('virustotal')) {
        promises.push(this.virusTotal.enrichIP(value));
      }
      if (services.includes('abuseipdb')) {
        promises.push(this.abuseIPDB.enrichIP(value));
      }
    } else if (type === 'DOMAIN') {
      if (services.includes('virustotal')) {
        promises.push(this.virusTotal.enrichDomain(value));
      }
    } else if (type === 'FILE_HASH') {
      if (services.includes('virustotal')) {
        promises.push(this.virusTotal.enrichFileHash(value));
      }
    }

    // Wait for all enrichments
    const enrichmentResults = await Promise.allSettled(promises);

    // Collect successful results
    enrichmentResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value);
      }
    });

    // If no results, return unknown
    if (results.length === 0) {
      return {
        threatLevel: 'unknown',
        verdicts: [],
        tags: [],
      };
    }

    // Aggregate results - use worst-case threat level
    const threatLevels = ['benign', 'unknown', 'suspicious', 'malicious'];
    const maxThreatLevel = results.reduce((max, r) => {
      const currentIndex = threatLevels.indexOf(r.threatLevel);
      const maxIndex = threatLevels.indexOf(max);
      return currentIndex > maxIndex ? r.threatLevel : max;
    }, 'benign' as ThreatIntelResult['threatLevel']);

    // Deduplicate and merge tags
    const allTags = results.flatMap((r) => r.tags || []);
    const uniqueTags = Array.from(new Set(allTags));

    return {
      threatLevel: maxThreatLevel,
      verdicts: results.flatMap((r) => r.verdicts),
      tags: uniqueTags,
      geoLocation: results.find((r) => r.geoLocation)?.geoLocation,
      asn: results.find((r) => r.asn)?.asn,
    };
  }
}

// Singleton instance
export const threatIntel = new ThreatIntelOrchestrator();
