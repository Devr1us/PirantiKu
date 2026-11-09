"use client";

import * as React from "react";
import Image, { type ImageProps } from "next/image";

interface SafeImageProps extends Omit<ImageProps, "onError"> {
  fallback?: React.ReactNode;
}

export function SafeImage({ fallback, src, alt, ...props }: SafeImageProps) {
  const [prevSrc, setPrevSrc] = React.useState(src);
  const [hasError, setHasError] = React.useState(false);

  if (prevSrc !== src) {
    setPrevSrc(src);
    setHasError(false);
  }

  if (hasError || !src) {
    return <>{fallback}</>;
  }

  return (
    <Image
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      {...props}
    />
  );
}
