import { useState, useEffect, useRef } from "react";
import { useReadingProgress } from "@/hooks/useReadingProgress";

const REQUIRED_READING_TIME = 40000; // 40 seconds in milliseconds

export function useArticleRewards(decodedUrl) {
  const [showRewardToast, setShowRewardToast] = useState(false);
  const [rewardInfo, setRewardInfo] = useState(null);
  const { trackArticleRead } = useReadingProgress();
  const timerRef = useRef(null);
  const hasTrackedRef = useRef(false);

  // Track article read after 40 seconds
  useEffect(() => {
    if (!decodedUrl || hasTrackedRef.current) return;

    // Set 40-second timer
    timerRef.current = setTimeout(async () => {
      if (hasTrackedRef.current) return;
      hasTrackedRef.current = true;

      try {
        const result = await trackArticleRead(decodedUrl);

        if (result.alreadyRead) {
          // Already read this article today
          return;
        }

        if (result.success) {
          // Show reward toast
          setRewardInfo(result);
          setShowRewardToast(true);

          setTimeout(() => {
            setShowRewardToast(false);
          }, 2000);
        }
      } catch (error) {
        console.error("Failed to track article read:", error);
      }
    }, REQUIRED_READING_TIME);

    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [decodedUrl, trackArticleRead]);

  return { showRewardToast, rewardInfo };
}
