"use client"

import { useEffect, useRef } from 'react';

interface AdBannerProps {
  id: string;
  width: number;
  height: number;
}

export function AdBanner({ id, width, height }: AdBannerProps) {
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bannerRef.current && !bannerRef.current.firstChild) {
      const conf = document.createElement('script');
      const script = document.createElement('script');
      conf.innerHTML = `atOptions = { 'key' : '${id}', 'format' : 'iframe', 'height' : ${height}, 'width' : ${width}, 'params' : {} };`;
      script.src = `//www.highperformanceformat.com/${id}/invoke.js`;
      bannerRef.current.appendChild(conf);
      bannerRef.current.appendChild(script);
    }
  }, [id, width, height]);

  return (
    <div className="flex justify-center items-center overflow-hidden my-4">
      <div ref={bannerRef} style={{ width: `${width}px`, height: `${height}px` }} />
    </div>
  );
}

import { cn } from "@/lib/utils"

// Wrapper component for responsive ad placement
export function AdContainer({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={cn("flex items-center justify-center py-4", className)}>
      {children}
    </div>
  )
}
