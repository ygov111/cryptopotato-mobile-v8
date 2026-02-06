import { View, Text } from "react-native";
import { formatDate } from "@/utils/articleHelpers";

export function ArticleMetadata({ author, date }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderColor: "#222222",
      }}
    >
      <Text style={{ color: "#fed319", fontSize: 14, fontWeight: "600" }}>
        {author}
      </Text>
      {date && (
        <>
          <Text
            style={{
              color: "#666666",
              fontSize: 14,
              marginHorizontal: 8,
            }}
          >
            •
          </Text>
          <Text style={{ color: "#999999", fontSize: 14 }}>
            {formatDate(date)}
          </Text>
        </>
      )}
    </View>
  );
}
