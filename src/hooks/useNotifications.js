import { useEffect, useState } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useUser from "@/utils/auth/useUser";
import { apiFetch } from "@/utils/fetchHelper";

// Configure how notifications should be handled when the app is running
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function useNotifications() {
  const { data: user } = useUser();
  const queryClient = useQueryClient();
  const [permissionStatus, setPermissionStatus] = useState(null);

  // Request permission and register token
  const registerToken = async () => {
    try {
      if (!user?.id) {
        console.log("❌ No user logged in, skipping notification registration");
        return null;
      }

      // Request permission
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      setPermissionStatus(finalStatus);

      if (finalStatus !== "granted") {
        console.log("❌ Notification permission denied");
        return null;
      }

      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;

      console.log("📱 Got push token:", token.substring(0, 20) + "...");

      // Register with backend
      const response = await apiFetch("/api/notifications/register-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          deviceType: Platform.OS,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to register token");
      }

      console.log("✅ Notification token registered successfully");
      return token;
    } catch (error) {
      console.error("Failed to register for push notifications:", error);
      return null;
    }
  };

  // Register token when user logs in
  useEffect(() => {
    if (user?.id) {
      registerToken();
    }
  }, [user?.id]);

  // Get notification preferences
  const { data: preferences } = useQuery({
    queryKey: ["notificationPreferences", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await apiFetch("/api/notifications/preferences");
      if (!response.ok) throw new Error("Failed to fetch preferences");
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Update preferences mutation
  const updatePreferences = useMutation({
    mutationFn: async (prefs) => {
      const response = await apiFetch("/api/notifications/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (!response.ok) throw new Error("Failed to update preferences");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificationPreferences"] });
    },
  });

  return {
    permissionStatus,
    preferences,
    updatePreferences: updatePreferences.mutate,
    registerToken,
  };
}
