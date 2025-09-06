declare namespace SocialProofSDK {
    function pushEvent(eventName: string, parameters: Record<string, any>): void;
    function firePopup(id: number, title: string, message: string): void;
    function showPopup(title: string, message: string): void;
}
