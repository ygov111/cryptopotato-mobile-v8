import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { RefreshCw } from "lucide-react-native";
import { apiFetch } from "@/utils/fetchHelper";

export default function DiagnosticsScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/api/diagnostics/database");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("Diagnostics error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: "#0A0E27", paddingTop: insets.top }}
    >
      <StatusBar style="light" />

      {/* Header */}
      <View
        style={{
          padding: 20,
          borderBottomWidth: 1,
          borderBottomColor: "#1E293B",
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: "#FFFFFF",
            marginBottom: 4,
          }}
        >
          Database Diagnostics
        </Text>
        <Text style={{ fontSize: 14, color: "#94A3B8" }}>
          Check which database your app is connected to
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {/* Run Diagnostics Button */}
        <TouchableOpacity
          onPress={runDiagnostics}
          disabled={loading}
          style={{
            backgroundColor: "#3B82F6",
            borderRadius: 12,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <RefreshCw size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text
                style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}
              >
                Run Diagnostics
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Error Display */}
        {error && (
          <View
            style={{
              backgroundColor: "#7F1D1D",
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                color: "#FCA5A5",
                fontSize: 14,
                fontWeight: "600",
                marginBottom: 4,
              }}
            >
              ❌ Error
            </Text>
            <Text style={{ color: "#FFFFFF", fontSize: 14 }}>{error}</Text>
          </View>
        )}

        {/* Results Display */}
        {data && (
          <View style={{ gap: 16 }}>
            {/* Status Message */}
            <View
              style={{
                backgroundColor: data.connection?.connected
                  ? "#065F46"
                  : "#7F1D1D",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <Text
                style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}
              >
                {data.message}
              </Text>
            </View>

            {/* Database Info */}
            <View
              style={{
                backgroundColor: "#1E293B",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <Text
                style={{
                  color: "#94A3B8",
                  fontSize: 12,
                  fontWeight: "600",
                  marginBottom: 12,
                }}
              >
                DATABASE INFO
              </Text>
              <InfoRow
                label="Exists"
                value={data.database?.exists ? "✅ Yes" : "❌ No"}
              />
              <InfoRow label="Environment" value={data.database?.environment} />
              <InfoRow label="Node Env" value={data.database?.nodeEnv} />
              {data.database?.host && (
                <>
                  <InfoRow label="Host" value={data.database.host} />
                  <InfoRow label="Database" value={data.database.database} />
                  <InfoRow label="User" value={data.database.user} />
                </>
              )}
            </View>

            {/* Connection Test */}
            {data.connection && (
              <View
                style={{
                  backgroundColor: "#1E293B",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <Text
                  style={{
                    color: "#94A3B8",
                    fontSize: 12,
                    fontWeight: "600",
                    marginBottom: 12,
                  }}
                >
                  CONNECTION TEST
                </Text>
                <InfoRow
                  label="Status"
                  value={
                    data.connection.connected ? "✅ Connected" : "❌ Failed"
                  }
                />
                {data.connection.connected && (
                  <>
                    <InfoRow
                      label="Total Users"
                      value={data.connection.userCount?.toString()}
                    />
                    <InfoRow
                      label="Users with Points"
                      value={data.connection.userPointsCount?.toString()}
                    />
                    {data.connection.sampleUserEmail && (
                      <InfoRow
                        label="Sample User"
                        value={data.connection.sampleUserEmail}
                      />
                    )}
                  </>
                )}
                {data.connection.error && (
                  <InfoRow label="Error" value={data.connection.error} error />
                )}
              </View>
            )}

            {/* Timestamp */}
            <Text
              style={{
                color: "#64748B",
                fontSize: 12,
                textAlign: "center",
                marginTop: 8,
              }}
            >
              Last checked: {new Date(data.timestamp).toLocaleString()}
            </Text>
          </View>
        )}

        {/* Instructions */}
        {!data && !error && !loading && (
          <View
            style={{
              backgroundColor: "#1E293B",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <Text style={{ color: "#94A3B8", fontSize: 14, lineHeight: 20 }}>
              Tap "Run Diagnostics" to check:{"\n\n"}• Which database your app
              is connected to{"\n"}• Database connection status{"\n"}• Number of
              users and points{"\n"}• Environment information
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value, error }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#334155",
      }}
    >
      <Text style={{ color: "#94A3B8", fontSize: 14 }}>{label}</Text>
      <Text
        style={{
          color: error ? "#FCA5A5" : "#FFFFFF",
          fontSize: 14,
          fontWeight: "500",
          flex: 1,
          textAlign: "right",
          marginLeft: 16,
        }}
      >
        {value || "N/A"}
      </Text>
    </View>
  );
}
