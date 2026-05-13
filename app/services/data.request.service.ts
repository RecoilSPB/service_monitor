import type { AxiosError } from "axios";
import { api } from "./api.service";
import type { MonitoringStand } from "../types/monitoring";

export const getStands = async (): Promise<MonitoringStand[]> => {
  try {
    return (
      await api.get('api/stands')
    ).data;
  } catch (e: AxiosError | any) {
    if (e.status === 401) {
      throw e;
    }
    throw e?.response?.data?.message || e?.message || e?.code || e;
  }
};