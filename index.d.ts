declare global {
  interface Window {
    SocialProof: {
      pushEvent(eventName: string, parameters: Record<string, any>): void;
      firePopup(id: number, title: string, message: string): void;
      showPopup(title: string, message: string): void;
    };
  }

  const SocialProof: Window['SocialProof'];
}

export {};
