import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, Switch, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronLeft, Bell, Smartphone, BellRing } from "lucide-react-native";
import useUser from "@/utils/auth/useUser";

export default function Notifications() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: user } = useUser();
  const queryClient = useQueryClient();

  // Fetch notification preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ["notificationPreferences", user?.id],
    queryFn: async () => {
      const response = await fetch("/api/notifications/preferences");
      if (!response.ok) throw new Error("Failed to fetch preferences");
      return await response.json();
    },
    enabled: !!user,
  });

  // Update preferences mutation
  const updateMutation = useMutation({
    mutationFn: async (newPrefs) => {
      const response = await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPrefs),
      });
      if (!response.ok) throw new Error("Failed to update preferences");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificationPreferences"] });
    },
  });

  const togglePreference = (key) => {
    const newPrefs = { ...preferences, [key]: !preferences[key] };
    updateMutation.mutate(newPrefs);
  };

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: "#111111" }}>
        <StatusBar style="light" />
        <View
          style={{
            paddingTop: insets.top + 20,
            paddingHorizontal: 20,
            paddingBottom: 20,
            borderBottomWidth: 1,
            borderColor: "#222222",
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <ChevronLeft size={24} color="white" />
            <Text style={{ color: "white", fontSize: 16, marginLeft: 8 }}>
              Back
            </Text>
          </Pressable>
        </View>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 40,
          }}
        >
          <Bell size={64} color="#666666" />
          <Text
            style={{
              color: "white",
              fontSize: 20,
              fontWeight: "bold",
              marginTop: 24,
              textAlign: "center",
            }}
          >
            Sign In Required
          </Text>
          <Text
            style={{
              color: "#999999",
              fontSize: 14,
              marginTop: 12,
              textAlign: "center",
            }}
          >
            Create an account to manage your notification preferences
          </Text>
        </View>
      </View>
    );
  }

  const notificationTypes = [
    {
      id: "price_alerts",
      title: "Price Alerts",
      description: "When your tracked coins hit target prices",
      icon: "📈",
    },
    {
      id: "daily_quest",
      title: "Daily Quest",
      description: "New daily challenge available",
      icon: "🎯",
    },
    {
      id: "magic_coin",
      title: "Magic Coin",
      description: "Daily prediction results and new contests",
      icon: "🪙",
    },
    {
      id: "achievements",
      title: "Achievements",
      description: "When you earn new badges or milestones",
      icon: "🏆",
    },
    {
      id: "leaderboard",
      title: "Leaderboard",
      description: "Rank changes and competition updates",
      icon: "📊",
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#111111" }}>
      <StatusBar style="light" />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 20,
          paddingBottom: 20,
          borderBottomWidth: 1,
          borderColor: "#222222",
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <ChevronLeft size={24} color="white" />
          <Text style={{ color: "white", fontSize: 16, marginLeft: 8 }}>
            Back
          </Text>
        </Pressable>

        <Text style={{ color: "white", fontSize: 28, fontWeight: "bold" }}>
          Notifications
        </Text>
        <Text style={{ color: "#999999", fontSize: 14, marginTop: 5 }}>
          Manage in-app and push notifications
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Explanation */}
        <View style={{ padding: 20 }}>
          <View
            style={{
              backgroundColor: "#1a1a1a",
              borderRadius: 12,
              padding: 16,
              borderLeftWidth: 4,
              borderLeftColor: "#fed319",
            }}
          >
            <Text style={{ color: "white", fontSize: 14, lineHeight: 20 }}>
              <Text style={{ fontWeight: "bold" }}>In-App</Text> notifications
              appear as a banner at the top of the screen while you're using the
              app.{"\n\n"}
              <Text style={{ fontWeight: "bold" }}>Push</Text> notifications are
              sent to your device even when the app is closed.
            </Text>
          </View>
        </View>

        {/* Notification Types */}
        <View style={{ paddingHorizontal: 20 }}>
          {notificationTypes.map((type, index) => (
            <View
              key={type.id}
              style={{
                backgroundColor: "#1a1a1a",
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}
            >
              {/* Header */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 24, marginRight: 12 }}>
                  {type.icon}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: "white",
                      fontSize: 16,
                      fontWeight: "bold",
                    }}
                  >
                    {type.title}
                  </Text>
                  <Text
                    style={{ color: "#999999", fontSize: 13, marginTop: 2 }}
                  >
                    {type.description}
                  </Text>
                </View>
              </View>

              {/* Toggles */}
              <View style={{ gap: 12 }}>
                {/* In-App Toggle */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "#111111",
                    padding: 12,
                    borderRadius: 8,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flex: 1,
                    }}
                  >
                    <Smartphone size={18} color="#fed319" />
                    <Text
                      style={{
                        color: "white",
                        fontSize: 14,
                        marginLeft: 10,
                        fontWeight: "600",
                      }}
                    >
                      In-App Banner
                    </Text>
                  </View>
                  <Switch
                    value={preferences?.[`${type.id}_inapp`] ?? true}
                    onValueChange={() => togglePreference(`${type.id}_inapp`)}
                    trackColor={{ false: "#333333", true: "#fed31980" }}
                    thumbColor={
                      preferences?.[`${type.id}_inapp`] ? "#fed319" : "#666666"
                    }
                  />
                </View>

                {/* Push Toggle */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "#111111",
                    padding: 12,
                    borderRadius: 8,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flex: 1,
                    }}
                  >
                    <BellRing size={18} color="#fed319" />
                    <Text
                      style={{
                        color: "white",
                        fontSize: 14,
                        marginLeft: 10,
                        fontWeight: "600",
                      }}
                    >
                      Push Notification
                    </Text>
                  </View>
                  <Switch
                    value={preferences?.[`${type.id}_push`] ?? true}
                    onValueChange={() => togglePreference(`${type.id}_push`)}
                    trackColor={{ false: "#333333", true: "#fed31980" }}
                    thumbColor={
                      preferences?.[`${type.id}_push`] ? "#fed319" : "#666666"
                    }
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Test Banner Button */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <Pressable
            onPress={() => {
              Alert.alert(
                "Test Notification",
                "In production, this would show a test banner notification at the top of the screen",
                [{ text: "OK" }],
              );
            }}
            style={{
              backgroundColor: "#fed319",
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text
              style={{ color: "#111111", fontSize: 16, fontWeight: "bold" }}
            >
              Test In-App Banner
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
