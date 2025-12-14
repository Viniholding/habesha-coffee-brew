import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

interface LegalBreadcrumbProps {
  currentPage: string;
}

const LegalBreadcrumb = ({ currentPage }: LegalBreadcrumbProps) => {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-2 text-sm text-muted-foreground">
        <li>
          <Link 
            to="/" 
            className="flex items-center gap-1 hover:text-primary transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Home</span>
          </Link>
        </li>
        <li>
          <ChevronRight className="h-4 w-4" />
        </li>
        <li>
          <span className="text-foreground font-medium">{currentPage}</span>
        </li>
      </ol>
    </nav>
  );
};

export default LegalBreadcrumb;
