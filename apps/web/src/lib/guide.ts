export const guideStorageKeys = {
  welcomeSeen: "taskflow_welcome_seen",
  welcomePending: "taskflow_pending_welcome",
  onboardingActive: "taskflow_onboarding_active",
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
  window.localStorage.setItem(guideStorageKeys.welcomePending, "1");
  window.localStorage.setItem(guideStorageKeys.onboardingActive, "1");
  window.localStorage.setItem(guideStorageKeys.dashboardPending, "1");
}

export function isOnboardingActive() {
  return (
    typeof window !== "undefined" &&
    window.localStorage.getItem(guideStorageKeys.onboardingActive) === "1"
  );
}

export function stopOnboarding() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(guideStorageKeys.onboardingActive);
  window.localStorage.removeItem(guideStorageKeys.dashboardPending);
  window.localStorage.removeItem(guideStorageKeys.projectPendingId);
}
