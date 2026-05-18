export function StoryImage({ src, alt, className = "" }: { src?: string | null; alt: string; className?: string }) {
  if (!src) return <div className={`placeholder ${className}`}>Image generating</div>;
  return <img className={className} src={src} alt={alt} />;
}
