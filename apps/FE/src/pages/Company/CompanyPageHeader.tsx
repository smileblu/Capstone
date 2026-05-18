import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

type CompanyPageHeaderProps = {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  imageSrc?: string;
  imageAlt?: string;
};

export default function CompanyPageHeader({
  title,
  showBack = false,
  onBack,
  imageSrc,
  imageAlt,
}: CompanyPageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="relative flex h-10 items-center justify-center">
      {showBack && (
        <button
          type="button"
          onClick={onBack ?? (() => navigate(-1))}
          className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--color-grey-150)]"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="h-6 w-6 text-[var(--color-grey-750)]" />
        </button>
      )}

      {imageSrc ? (
        <img
          src={imageSrc}
          alt={imageAlt ?? title}
          className="h-8 max-w-[calc(100%-96px)] object-contain"
        />
      ) : (
        <h1 className="h0 m-0 max-w-[calc(100%-96px)] truncate text-center text-[var(--color-dark-green)]">
          {title}
        </h1>
      )}
    </header>
  );
}
