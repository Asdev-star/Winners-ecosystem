export type InstallPromptContext = {
  dismissed: boolean;
  displayMode: "browser" | "standalone";
  visits: number;
  daysSinceDismiss: number;
};

export type InstallPromptCaptureContext = {
  dismissed: boolean;
  displayMode: "browser" | "standalone";
};

export function createAuthenticatedSocketUrl(token: string, pathname = "/ws", locationLike?: Pick<Location, "protocol" | "host">) {
  const locationRef = locationLike ?? window.location;
  const protocol = locationRef.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${locationRef.host}${pathname}?token=${encodeURIComponent(token)}`;
}

export function closeOpenSocket(socket: WebSocket | null | undefined) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close();
  }
}

export function getRegulatedResponsiveContainerProps(minHeight: number) {
  return {
    width: "100%" as const,
    height: minHeight,
    minWidth: 0,
    minHeight,
  };
}

export function shouldShowInstallPrompt(context: InstallPromptContext) {
  return !context.dismissed && context.displayMode !== "standalone" && context.visits >= 3 && context.daysSinceDismiss > 30;
}

export function shouldCaptureInstallPrompt(context: InstallPromptCaptureContext) {
  return !context.dismissed && context.displayMode !== "standalone";
}
