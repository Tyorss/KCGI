"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type AutoHeightFrameProps = {
  src: string;
  title: string;
};

export default function AutoHeightFrame({ src, title }: AutoHeightFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const [height, setHeight] = useState(900);

  const resize = useCallback(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!doc) return;

    const body = doc.body;
    const html = doc.documentElement;
    const nextHeight = Math.max(
      body?.scrollHeight || 0,
      body?.offsetHeight || 0,
      html?.clientHeight || 0,
      html?.scrollHeight || 0,
      html?.offsetHeight || 0,
      900
    );
    setHeight(nextHeight + 4);
  }, []);

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  function handleLoad() {
    observerRef.current?.disconnect();
    resize();

    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    observerRef.current = new ResizeObserver(resize);
    observerRef.current.observe(doc.documentElement);
    if (doc.body) observerRef.current.observe(doc.body);

    window.setTimeout(resize, 200);
    window.setTimeout(resize, 800);
    window.setTimeout(resize, 1600);
  }

  return (
    <iframe
      ref={iframeRef}
      className="block w-full border-0 bg-white"
      height={height}
      scrolling="no"
      src={src}
      title={title}
      onLoad={handleLoad}
    />
  );
}
