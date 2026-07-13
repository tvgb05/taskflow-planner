export const guideStorageKeys = {
  dashboardSeen: "taskflow_dashboard_guide_seen",
  dashboardPending: "taskflow_pending_dashboard_guide",
  newProjectSeen: "taskflow_new_project_guide_seen",
  projectSeen: "taskflow_project_guide_seen",
  projectPendingId: "taskflow_pending_project_guide_id",
  aiSuggestSeen: "taskflow_ai_suggest_guide_seen",
} as const;

export function prepareGuidesForNewUser() {
  if (typeof window === "undefined") return;

  Object.values(guideStorageKeys).forEach((key) => {
    window.localStorage.removeItem(key);
  });
  window.localStorage.setItem(guideStorageKeys.dashboardPending, "1");
}
