import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface LegalPageWrapperProps {
  children: ReactNode;
}

const LegalPageWrapper = ({ children }: LegalPageWrapperProps) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="legal-content">
      <div className="flex justify-end mb-4 print:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="gap-2"
        >
          <Printer className="h-4 w-4" />
          Print this page
        </Button>
      </div>
      {children}
    </div>
  );
};

export default LegalPageWrapper;
