import { CropAnalysisReport } from '../../types/analysis.types';
import { localDb } from '../db/localDb';
import { apiClient, ENV_CONFIG } from './apiClient';

export interface HistoryFilter {
  crop?: string;
  riskLevel?: string;
  searchQuery?: string;
}

export const historyService = {
  async getAllReports(filters?: HistoryFilter): Promise<CropAnalysisReport[]> {
    const currentUser = localDb.getAuthUser();

    // Guests keep all test history strictly isolated on their local device
    if (!currentUser?.isGuest && !ENV_CONFIG.USE_LOCAL_DB && ENV_CONFIG.HISTORY_API_URL) {
      try {
        const queryParams: Record<string, string> = {};
        if (filters?.crop) queryParams.crop = filters.crop;
        if (filters?.riskLevel) queryParams.risk = filters.riskLevel;
        if (filters?.searchQuery) queryParams.q = filters.searchQuery;
        if (currentUser?.id) queryParams.farmer_id = currentUser.id;

        return await apiClient<CropAnalysisReport[]>(ENV_CONFIG.HISTORY_API_URL, {
          params: queryParams,
        });
      } catch (err) {
        console.warn('Backend history unreachable, fetching from local DB:', err);
      }
    }

    let reports = localDb.getReports();

    if (filters) {
      if (filters.crop && filters.crop !== 'ALL') {
        reports = reports.filter((r) =>
          r.mlModelDetection.cropIdentified.toLowerCase().includes(filters.crop!.toLowerCase())
        );
      }
      if (filters.riskLevel && filters.riskLevel !== 'ALL') {
        reports = reports.filter((r) => r.aiAdvisory.overallRiskLevel === filters.riskLevel);
      }
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        reports = reports.filter(
          (r) =>
            r.mlModelDetection.cropIdentified.toLowerCase().includes(q) ||
            r.mlModelDetection.diseaseOrCondition.toLowerCase().includes(q) ||
            r.userInputs.locationName?.toLowerCase().includes(q) ||
            r.aiAdvisory.executiveSummary.toLowerCase().includes(q)
        );
      }
    }

    return reports;
  },

  async getReportById(id: string): Promise<CropAnalysisReport | null> {
    if (!ENV_CONFIG.USE_LOCAL_DB && ENV_CONFIG.HISTORY_API_URL) {
      try {
        return await apiClient<CropAnalysisReport>(`${ENV_CONFIG.HISTORY_API_URL}/${id}`);
      } catch (err) {
        console.warn('Backend report lookup failed, checking local store:', err);
      }
    }
    return localDb.getReportById(id);
  },

  async deleteReport(id: string): Promise<void> {
    if (!ENV_CONFIG.USE_LOCAL_DB && ENV_CONFIG.HISTORY_API_URL) {
      try {
        await apiClient(`${ENV_CONFIG.HISTORY_API_URL}/${id}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.warn('Backend delete report failed:', err);
      }
    }
    localDb.deleteReport(id);
  },

  async resetSeedData(): Promise<void> {
    localDb.resetToDefaults();
  }
};
