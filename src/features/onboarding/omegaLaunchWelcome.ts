export const OMEGA_WELCOME_KEY = "we_omega_launch_welcome";

export interface OmegaLaunchWelcome {
  pathPrefix: string;
  supervisor: string;
  layer: string;
  title: string;
  message: string;
  selectedPlan: string;
  profileType?: string;
  entryPath?: string;
  briefingFocus?: string[];
  firstAction?: string;
  dismissAfterMs?: number;
}
