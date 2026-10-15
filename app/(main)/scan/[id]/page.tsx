import { Suspense } from "react";
import { TagCheckingSkeleton } from "@/components/salahtrack/check-in";
import { ScanCheckIn } from "@/components/salahtrack/scan-check-in";
import { PageHeader } from "@/components/salahtrack/ui";

// NFC check-in page: /scan/<tag id>. The tag id is read in the browser, so
// the screen is wrapped in <Suspense> (required by Next.js for pages that
// read a dynamic part of the URL).
export default function ScanCheckInPage() {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader title="NFC check-in" subtitle={" "} />
          <TagCheckingSkeleton />
        </>
      }
    >
      <ScanCheckIn />
    </Suspense>
  );
}
