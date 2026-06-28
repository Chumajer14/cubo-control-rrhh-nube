import { dashboardSummary, aiSummary } from "../services/dashboard.service.js";

export async function summary(req, res) {
  res.json(await dashboardSummary());
}

export async function simulatedAiSummary(req, res) {
  res.json(await aiSummary());
}
