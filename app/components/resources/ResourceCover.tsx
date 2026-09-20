type Props = {
  coverUrl: string;
  title: string;
  className?: string;
};

export default function ResourceCover({ coverUrl, title, className }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={coverUrl}
      alt={`Cover of ${title}`}
      className={`w-full h-auto border border-[#1a1816]/10 object-cover ${className ?? ""}`}
      style={{ aspectRatio: "1000 / 1294" }}
      loading="lazy"
    />
  );
}
