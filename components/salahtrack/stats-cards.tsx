import { Flame, Trophy } from "lucide-react";
import {
  card,
  enter,
  InlineError,
  type LoadStatus,
} from "@/components/salahtrack/ui";
import { toLocalDate } from "@/lib/local-date";
import {
  PRAYERS_PER_DAY,
  type StreakSummary,
  type WeekSummary,
} from "@/lib/prayer-stats";

/* -------------------------------------------------------------------------- */
/*  Streak card                                                               */
/* -------------------------------------------------------------------------- */

export function StreakCard({
  status,
  summary,
  onRetry,
}: {
  status: LoadStatus;
  summary: StreakSummary | null;
  onRetry: () => void;
}) {
  const ready = status === "ready" && summary !== null;
  const current = summary?.current ?? 0;
  const active = ready && current > 0;

  return (
    <section className={`${enter} delay-300 ${card}`}>
      <div className="flex items-center gap-4">
        <div
          className={`grid size-14 shrink-0 place-items-center rounded-2xl transition-colors duration-500 ${
            active
              ? "bg-gradient-to-br from-amber-100 to-orange-100 text-orange-500"
              : "bg-stone-100 text-stone-400"
          }`}
        >
          <Flame className="size-7" fill={active ? "currentColor" : "none"} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-stone-500">Current streak</p>
          {ready ? (
            <p className="text-2xl font-semibold tracking-tight">
              <span className="tabular-nums">{current}</span>{" "}
              {current === 1 ? "day" : "days"}
            </p>
          ) : (
            <span className="mt-1 block h-7 w-24 animate-pulse rounded bg-stone-200" />
          )}
        </div>
        {ready && (
          <div className="flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-600">
            <Trophy className="size-3.5 text-amber-500" />
            Best <span className="tabular-nums">{summary.longest}</span>
          </div>
        )}
      </div>

      <div className="mt-4">
        {status === "error" ? (
          <InlineError message="Couldn't load your streak." onRetry={onRetry} />
        ) : ready ? (
          <p className="rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-600">
            {streakMessage(summary)}
          </p>
        ) : (
          <div className="h-11 animate-pulse rounded-2xl bg-stone-100" />
        )}
      </div>
    </section>
  );
}

function streakMessage(summary: StreakSummary) {
  if (!summary.hasAnyRecords) {
    return "Record all five prayers in one day to start your streak.";
  }
  if (summary.todayComplete) {
    return "Today is complete. MashaAllah! Keep it going tomorrow, in sha Allah.";
  }
  if (summary.current > 0) {
    return `Record all five prayers today to make it ${summary.current + 1} days.`;
  }
  return "Record all five prayers today to start a new streak.";
}

/* -------------------------------------------------------------------------- */
/*  Weekly statistics                                                         */
/* -------------------------------------------------------------------------- */

export function WeeklyCard({
  status,
  week,
  onRetry,
}: {
  status: LoadStatus;
  week: WeekSummary | null;
  onRetry: () => void;
}) {
  const ready = status === "ready" && week !== null;
  const firstCounted = week?.days.find((d) => d.counted);
  const partialWeek = ready && week.days.some((d) => !d.counted);

  return (
    <section className={`${enter} delay-500 ${card}`}>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">This week</h2>
          <p className="text-sm text-stone-500">Last 7 days</p>
        </div>
        <div className="text-right">
          {ready ? (
            <p className="text-2xl font-semibold tabular-nums text-emerald-700">
              {week.percent}%
            </p>
          ) : (
            <span className="ml-auto block h-8 w-14 animate-pulse rounded bg-stone-200" />
          )}
          <p className="text-xs text-stone-500">recorded</p>
        </div>
      </div>

      {status === "error" ? (
        <div className="mt-5">
          <InlineError message="Couldn't load this week." onRetry={onRetry} />
        </div>
      ) : (
        <>
          {/* Bar chart */}
          <div className="mt-5 flex items-end gap-2">
            {(ready ? week.days : PLACEHOLDER_DAYS).map((day, i) => {
              const date = ready ? toLocalDate(day.date) : null;
              const label = date?.toLocaleDateString("en-GB", { weekday: "short" });
              return (
                <div
                  key={ready ? day.date : i}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <div
                    className={`flex h-24 w-full items-end overflow-hidden rounded-xl ${
                      !ready
                        ? "animate-pulse bg-stone-100"
                        : day.counted
                          ? "bg-stone-100"
                          : "bg-stone-50"
                    }`}
                    title={
                      date
                        ? `${date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}: ${day.count} of ${PRAYERS_PER_DAY} recorded`
                        : undefined
                    }
                  >
                    {ready && day.count > 0 && (
                      <div
                        className={`w-full rounded-xl transition-[height] duration-700 ease-out ${
                          day.count >= PRAYERS_PER_DAY
                            ? "bg-gradient-to-t from-emerald-600 to-emerald-400"
                            : "bg-emerald-200"
                        }`}
                        style={{
                          height: `${(day.count / PRAYERS_PER_DAY) * 100}%`,
                        }}
                      />
                    )}
                  </div>
                  <span
                    className={`h-4 text-xs ${
                      day.isToday
                        ? "font-semibold text-emerald-700"
                        : day.counted || !ready
                          ? "text-stone-400"
                          : "text-stone-300"
                    }`}
                  >
                    {ready ? (day.isToday ? "Today" : label) : ""}
                  </span>
                  {date && (
                    <span className="sr-only">
                      {day.count} of {PRAYERS_PER_DAY} prayers recorded
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary numbers */}
          <div className="mt-5 grid grid-cols-3 divide-x divide-stone-200 rounded-2xl bg-stone-50 py-3 text-center">
            <Stat
              value={ready ? `${week.recorded}/${week.possible}` : null}
              label="Prayers"
            />
            <Stat
              value={ready ? String(week.completeDays) : null}
              label="Complete days"
            />
            <Stat
              value={ready ? week.dailyAverage.toFixed(1) : null}
              label="Daily avg"
            />
          </div>

          {partialWeek && firstCounted && (
            <p className="mt-3 text-center text-xs text-stone-400">
              Counted from{" "}
              {toLocalDate(firstCounted.date).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
              , when you joined SalahTrack.
            </p>
          )}
        </>
      )}
    </section>
  );
}

const PLACEHOLDER_DAYS = Array.from({ length: 7 }, (_, i) => ({
  date: "",
  count: 0,
  isToday: i === 6,
  counted: true,
}));

function Stat({ value, label }: { value: string | null; label: string }) {
  return (
    <div>
      {value === null ? (
        <span className="mx-auto block h-5 w-10 animate-pulse rounded bg-stone-200" />
      ) : (
        <p className="text-base font-semibold tabular-nums">{value}</p>
      )}
      <p className="text-xs text-stone-500">{label}</p>
    </div>
  );
}
