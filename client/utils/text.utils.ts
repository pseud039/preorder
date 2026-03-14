export const getInitials = (name: string) => {
  return (
    name
      .split(" ")
      .map((part: string) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2) || "U"
  );
};
