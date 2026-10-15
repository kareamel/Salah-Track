import { Suspense } from "react";
import { TagCheckingSkeleton } from "@/components/salahtrack/check-in";
import {
  CheckInHeader,
  ScanCheckIn,
} from "@/components/salahtrack/scan-check-in";

// NFC quick check-in: /scan/<tag id>. The tag id is read in the browser, so
// the screen is wrapped in <Suspense> (required by Next.js for pages that
// read a dynamic part of the URL). The placeholder matches the real layout.
export default function ScanCheckInPage() {
  return (
    <Suspense
      fallback={
        <>
          <CheckInHeader dateLabel={undefined} verified={false} />
          <TagCheckingSkeleton />
        </>
      }
    >
      <ScanCheckIn />
    </Suspense>
  );
}
