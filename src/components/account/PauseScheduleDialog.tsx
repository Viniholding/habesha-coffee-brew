import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { format, addDays, addWeeks } from "date-fns";
import { CalendarClock, Loader2 } from "lucide-react";

interface PauseScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (resumeDate: Date | null) => Promise<void>;
  loading: boolean;
}

const PauseScheduleDialog = ({ open, onOpenChange, onConfirm, loading }: PauseScheduleDialogProps) => {
  const [scheduleResume, setScheduleResume] = useState(false);
  const [resumeDate, setResumeDate] = useState<Date | undefined>(addWeeks(new Date(), 2));

  const quickOptions = [
    { label: "1 week", date: addWeeks(new Date(), 1) },
    { label: "2 weeks", date: addWeeks(new Date(), 2) },
    { label: "1 month", date: addDays(new Date(), 30) },
    { label: "2 months", date: addDays(new Date(), 60) },
  ];

  const handleConfirm = async () => {
    await onConfirm(scheduleResume && resumeDate ? resumeDate : null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Pause Subscription
          </DialogTitle>
          <DialogDescription>
            Your subscription will be paused and no charges will occur until you resume.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="schedule-resume" className="font-medium">
              Schedule automatic resume
            </Label>
            <Switch
              id="schedule-resume"
              checked={scheduleResume}
              onCheckedChange={setScheduleResume}
            />
          </div>

          {scheduleResume && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {quickOptions.map((option) => (
                  <Button
                    key={option.label}
                    variant={resumeDate?.toDateString() === option.date.toDateString() ? "default" : "outline"}
                    size="sm"
                    onClick={() => setResumeDate(option.date)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              <Calendar
                mode="single"
                selected={resumeDate}
                onSelect={setResumeDate}
                disabled={(date) => date < addDays(new Date(), 1)}
                className="rounded-md border pointer-events-auto"
              />

              {resumeDate && (
                <p className="text-sm text-muted-foreground">
                  Your subscription will automatically resume on{" "}
                  <span className="font-medium text-foreground">
                    {format(resumeDate, "MMMM d, yyyy")}
                  </span>
                </p>
              )}
            </div>
          )}

          {!scheduleResume && (
            <p className="text-sm text-muted-foreground">
              You can manually resume your subscription anytime from your account.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {scheduleResume ? "Pause & Schedule Resume" : "Pause Subscription"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PauseScheduleDialog;
