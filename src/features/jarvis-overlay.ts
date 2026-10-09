export type AmbientSnapshot = {
  weather?: string;
  location?: string;
  time: string;
  battery?: string;
};
export type AmbientBridge = {
  onClap?: (handler: () => void) => () => void;
  listen?: (onText: (text: string) => void, onError: (message: string) => void) => () => void;
  execute?: (command: unknown) => Promise<unknown>;
};

export class JarvisOverlayController {
  private stopClap: (() => void) | undefined;
  private stopListen: (() => void) | undefined;
  private active = false;
  constructor(
    private readonly bridge: AmbientBridge,
    private readonly onState: (state: {
      active: boolean;
      greeting?: string;
      snapshot?: AmbientSnapshot;
    }) => void,
  ) {}
  start() {
    this.stopClap = this.bridge.onClap?.(() => this.activate());
  }
  activate(snapshot?: AmbientSnapshot) {
    this.active = true;
    this.onState({
      active: true,
      greeting: "مرحبا يا أبانوب، ماذا تريد أن نفعل؟",
      snapshot: snapshot ?? { time: new Date().toLocaleTimeString("ar-EG") },
    });
    this.stopListen?.();
    this.stopListen = this.bridge.listen?.(
      (text) => void this.bridge.execute?.(text),
      (message) => this.onState({ active: true, greeting: message }),
    );
  }
  stop() {
    this.active = false;
    this.stopListen?.();
    this.stopClap?.();
    this.onState({ active: false });
  }
  isActive() {
    return this.active;
  }
}
