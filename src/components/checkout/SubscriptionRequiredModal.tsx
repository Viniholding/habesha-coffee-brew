import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, Trash2, Coffee } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SubscriptionRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemoveSubscriptions: () => void;
}

const SubscriptionRequiredModal = ({
  open,
  onOpenChange,
  onRemoveSubscriptions,
}: SubscriptionRequiredModalProps) => {
  const navigate = useNavigate();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Coffee className="h-8 w-8 text-primary" />
          </div>
          <AlertDialogTitle className="text-center">
            Account Required for Subscriptions
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            You need an account to manage subscription deliveries, billing, and preferences. 
            Create one now to enjoy automatic coffee deliveries!
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 mt-4">
          <Button
            className="w-full gap-2"
            onClick={() => navigate("/auth?redirect=/checkout&mode=signup")}
          >
            <UserPlus className="h-4 w-4" />
            Create Account
          </Button>
          
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => navigate("/auth?redirect=/checkout")}
          >
            <LogIn className="h-4 w-4" />
            Log In
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            variant="ghost"
            className="w-full gap-2 text-muted-foreground hover:text-destructive"
            onClick={onRemoveSubscriptions}
          >
            <Trash2 className="h-4 w-4" />
            Remove Subscriptions from Cart
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SubscriptionRequiredModal;
