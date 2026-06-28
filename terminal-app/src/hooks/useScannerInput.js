import { useEffect, useRef } from "react";

const SCAN_IDLE_TIMEOUT_MS = 180;

export default function useScannerInput({ active, onScanComplete, onScanStart }) {
  const bufferRef = useRef("");
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!active) {
      bufferRef.current = "";
      window.clearTimeout(timeoutRef.current);
      return undefined;
    }

    function finishScan() {
      const scanText = bufferRef.current;
      bufferRef.current = "";
      window.clearTimeout(timeoutRef.current);

      // The raw scanner text is passed once and immediately discarded by the caller.
      if (scanText.trim()) {
        onScanComplete(scanText);
      }
    }

    function scheduleFinish() {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(finishScan, SCAN_IDLE_TIMEOUT_MS);
    }

    function handleKeyDown(event) {
      if (/^F([1-9]|1[0-2])$/.test(event.key)) {
        event.preventDefault();
        return;
      }

      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        finishScan();
        return;
      }

      if (event.key === "Escape") {
        bufferRef.current = "";
        window.clearTimeout(timeoutRef.current);
        return;
      }

      if (event.key.length !== 1) {
        return;
      }

      event.preventDefault();

      if (!bufferRef.current) {
        onScanStart();
      }

      bufferRef.current += event.key;
      scheduleFinish();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      bufferRef.current = "";
      window.clearTimeout(timeoutRef.current);
    };
  }, [active, onScanComplete, onScanStart]);
}
