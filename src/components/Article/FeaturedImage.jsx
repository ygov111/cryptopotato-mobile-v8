import { Pressable, Image } from "react-native";

export function FeaturedImage({ imageUrl, onPress }) {
  if (!imageUrl || imageUrl === "undefined") return null;

  return (
    <Pressable onPress={() => onPress(imageUrl)}>
      <Image
        source={{ uri: imageUrl }}
        style={{ width: "100%", height: 250 }}
        resizeMode="cover"
      />
    </Pressable>
  );
}
