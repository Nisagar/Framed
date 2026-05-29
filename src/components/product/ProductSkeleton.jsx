export default function ProductSkeleton({ count = 8 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[3/4] skeleton" />
          <div className="mt-3 space-y-2">
            <div className="h-4 skeleton w-3/4" />
            <div className="h-5 skeleton w-1/3" />
          </div>
        </div>
      ))}
    </>
  )
}
