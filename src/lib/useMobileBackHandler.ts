import { useEffect, useRef, useState, useCallback } from 'react';

export interface ModalRegistration {
  name: string;
  isOpen: boolean;
  close: () => void;
}

export interface UseMobileBackHandlerOptions {
  activeTab: 'drinks' | 'monitor' | 'logbook' | 'equipment';
  setActiveTab: (tab: 'drinks' | 'monitor' | 'logbook' | 'equipment') => void;
  activeMode?: 'flow' | 'beandex';
  setActiveMode?: (mode: 'flow' | 'beandex') => void;
  modals: ModalRegistration[];
  exitToastMessage?: string;
}

/**
 * Mobile Hardware & Gesture Back Button Handler
 *
 * Intercepts Android hardware/gesture back button and browser/iOS popstate navigation:
 * 1. Closes active modals/sheets first before navigating away.
 * 2. Navigates back from Beandex mode to Espresso Flow root.
 * 3. Navigates back to the root 'Coffee Bar' (drinks) tab if on another tab.
 * 4. Shows a double-press exit toast if on the root tab to prevent accidental closing.
 */
export function useMobileBackHandler({
  activeTab,
  setActiveTab,
  activeMode = 'flow',
  setActiveMode,
  modals,
  exitToastMessage = 'Tryk tilbage igen for at afslutte',
}: UseMobileBackHandlerOptions) {
  const [showExitToast, setShowExitToast] = useState(false);
  const lastBackPressTimeRef = useRef<number>(0);
  const exitToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep latest refs to avoid stale closures in event listeners
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const setActiveTabRef = useRef(setActiveTab);
  setActiveTabRef.current = setActiveTab;

  const activeModeRef = useRef(activeMode);
  activeModeRef.current = activeMode;

  const setActiveModeRef = useRef(setActiveMode);
  setActiveModeRef.current = setActiveMode;

  const modalsRef = useRef(modals);
  modalsRef.current = modals;

  // Track modal history stack depth to cleanly sync browser history
  const modalHistoryCountRef = useRef<number>(0);
  const isProgrammaticBackRef = useRef<boolean>(false);

  // Helper to close a modal and optionally sync browser history
  const handleModalCloseWithHistory = useCallback((closeFn: () => void) => {
    closeFn();
    if (modalHistoryCountRef.current > 0) {
      modalHistoryCountRef.current -= 1;
      isProgrammaticBackRef.current = true;
      try {
        window.history.back();
      } catch {
        // Safe fallback
      }
    }
  }, []);

  // Monitor modals opening and push history state
  const prevOpenModalsRef = useRef<Record<string, boolean>>({});
  useEffect(() => {
    modals.forEach((modal) => {
      const wasOpen = prevOpenModalsRef.current[modal.name] || false;
      if (!wasOpen && modal.isOpen) {
        // Modal just opened -> push state so Android Back closes this modal
        modalHistoryCountRef.current += 1;
        try {
          window.history.pushState({ espresso_flow_modal: modal.name }, '');
        } catch {
          // Ignore
        }
      }
      prevOpenModalsRef.current[modal.name] = modal.isOpen;
    });
  }, [modals]);

  // Monitor mode changes and push history state when entering beandex
  const prevModeRef = useRef(activeMode);
  useEffect(() => {
    if (prevModeRef.current === 'flow' && activeMode === 'beandex') {
      try {
        window.history.pushState({ espresso_flow_mode: 'beandex' }, '');
      } catch {
        // Ignore
      }
    }
    prevModeRef.current = activeMode;
  }, [activeMode]);

  // Monitor tab changes and push history state if navigating away from drinks
  const prevTabRef = useRef(activeTab);
  useEffect(() => {
    if (prevTabRef.current === 'drinks' && activeTab !== 'drinks') {
      try {
        window.history.pushState({ espresso_flow_tab: activeTab }, '');
      } catch {
        // Ignore
      }
    }
    prevTabRef.current = activeTab;
  }, [activeTab]);

  // Popstate listener (Android back button, iOS swipe back, browser back)
  useEffect(() => {
    // Initial guard state on mount so initial back press doesn't instantly close PWA/tab
    try {
      if (!window.history.state || !window.history.state.espresso_flow_root) {
        window.history.replaceState({ espresso_flow_root: true }, '');
        window.history.pushState({ espresso_flow_view: 'active' }, '');
      }
    } catch {
      // Ignore
    }

    const handlePopState = (_event: PopStateEvent) => {
      // If back was triggered programmatically (e.g. user clicked modal X button), ignore
      if (isProgrammaticBackRef.current) {
        isProgrammaticBackRef.current = false;
        return;
      }

      // 1. Check if any modal is open -> Close the topmost open modal
      const openModals = modalsRef.current.filter((m) => m.isOpen);
      if (openModals.length > 0) {
        if (modalHistoryCountRef.current > 0) {
          modalHistoryCountRef.current -= 1;
        }
        // Close the last opened modal
        const topmostModal = openModals[openModals.length - 1];
        topmostModal.close();
        return;
      }

      // 2. Check if user is in Beandex mode -> Navigate back to Espresso Flow
      if (activeModeRef.current === 'beandex' && setActiveModeRef.current) {
        setActiveModeRef.current('flow');
        return;
      }

      // 3. Check if user is on a secondary tab -> Navigate back to Coffee Bar (drinks)
      if (activeTabRef.current !== 'drinks') {
        setActiveTabRef.current('drinks');
        return;
      }

      // 3. Root tab (Coffee Bar) with no open modals -> Double back to exit
      const now = Date.now();
      if (now - lastBackPressTimeRef.current < 2000) {
        // User pressed back twice within 2 seconds -> Allow default browser exit
        setShowExitToast(false);
        try {
          window.history.back();
        } catch {
          // Ignore
        }
      } else {
        // First back press -> Show warning toast and push guard state back
        lastBackPressTimeRef.current = now;
        setShowExitToast(true);

        try {
          window.history.pushState({ espresso_flow_view: 'active' }, '');
        } catch {
          // Ignore
        }

        if (exitToastTimerRef.current) {
          clearTimeout(exitToastTimerRef.current);
        }
        exitToastTimerRef.current = setTimeout(() => {
          setShowExitToast(false);
        }, 2200);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (exitToastTimerRef.current) {
        clearTimeout(exitToastTimerRef.current);
      }
    };
  }, []);

  return {
    showExitToast,
    exitToastMessage,
    handleModalCloseWithHistory,
  };
}
