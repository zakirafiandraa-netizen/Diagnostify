import React from "react";

interface AvatarProps {
  name: string;
  color: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-12 h-12 text-base",
};

function AvatarInner({ name, color, size = "md" }: AvatarProps) {
  return (
    <div
      className={`${sizeMap[size]} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ backgroundColor: color }}
    >
      {name[0].toUpperCase()}
    </div>
  );
}

export const Avatar = React.memo(AvatarInner);
