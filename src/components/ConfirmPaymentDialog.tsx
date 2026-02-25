import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ConfirmPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (date: Date) => void;
  quoteCode: string;
  quoteCreatedDate: string;
}

export function ConfirmPaymentDialog({
  open,
  onOpenChange,
  onConfirm,
  quoteCode,
  quoteCreatedDate,
}: ConfirmPaymentDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  const minDate = new Date(quoteCreatedDate);
  const maxDate = new Date();

  const handleConfirmToday = () => {
    onConfirm(new Date());
    onOpenChange(false);
    setShowCalendar(false);
  };

  const handleConfirmSelectedDate = () => {
    onConfirm(selectedDate);
    onOpenChange(false);
    setShowCalendar(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Xác nhận thanh toán</DialogTitle>
          <DialogDescription>
            Chọn ngày khách hàng thực sự thanh toán cho báo giá {quoteCode}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!showCalendar ? (
            <div className="space-y-3">
              <Button
                onClick={handleConfirmToday}
                className="w-full"
                size="lg"
              >
                Xác nhận hôm nay
              </Button>
              <Button
                onClick={() => setShowCalendar(true)}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Chọn ngày khác
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "dd/MM/yyyy")
                    ) : (
                      <span>Chọn ngày</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    disabled={(date) =>
                      date > maxDate || date < minDate
                    }
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Ngày tạo báo giá: {format(minDate, "dd/MM/yyyy")}</p>
                <p>• Không được chọn ngày trong tương lai</p>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowCalendar(false)}
                >
                  Quay lại
                </Button>
                <Button onClick={handleConfirmSelectedDate}>
                  Xác nhận
                </Button>
              </DialogFooter>
            </div>
          )}
        </div>
        </DialogContent>
      </Dialog>
  );
}
