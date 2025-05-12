
import React from "react";

interface HeadingProps {
  title: string;
  description?: string;
}

export const Heading = ({
  title,
  description,
}: HeadingProps) => {
  return (
    <div className="mb-6">
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      {description && (
        <p className="text-muted-foreground mt-1">
          {description}
        </p>
      )}
    </div>
  );
};
