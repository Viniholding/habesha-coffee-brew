import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays } from "date-fns";
import { CalendarClock, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface EditResumeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: string;
  currentResumeAt: string | null;
  onUpdate: () => void;
}

const EditResumeDialog = ({ open, onOpenChange, subscriptionId, currentResumeAt, onUpdate }: EditResumeDialogProps) => {
  const [resumeDate, setResumeDate] = useState<Date | undefined>(
    currentResumeAt ? new Date(currentResumeAt) : undefined
  );
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!resumeDate) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ resume_at: resumeDate.toISOString() })
        .eq("id", subscriptionId);

      if (error) throw error;

      toast.success(`Resume date updated to ${format(resumeDate, "MMM d, yyyy")}`);
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update resume date");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSchedule = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ resume_at: null })
        .eq("id", subscriptionId);

      if (error) throw error;

      toast.success("Scheduled resume removed. Resume manually when ready.");
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to remove schedule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Edit Resume Date
          </DialogTitle>
          <DialogDescription>
            Change when your subscription will automatically resume.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Calendar
            mode="single"
            selected={resumeDate}
            onSelect={setResumeDate}
            disabled={(date) => date < addDays(new Date(), 1)}
            className="rounded-md border pointer-events-auto"
          />

          {resumeDate && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Your subscription will resume on{" "}
              <span className="font-medium text-foreground">
                {format(resumeDate, "MMMM d, yyyy")}
              </span>
            </p>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {currentResumeAt && (
            <Button
              variant="outline"
              onClick={handleRemoveSchedule}
              disabled={loading}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Schedule
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading || !resumeDate}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditResumeDialog;
