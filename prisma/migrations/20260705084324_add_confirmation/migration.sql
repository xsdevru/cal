-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EventType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "lengthInMinutes" INTEGER NOT NULL,
    "locations" TEXT NOT NULL,
    "scheduleId" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "confirmation" TEXT NOT NULL DEFAULT 'auto',
    "bookingFields" TEXT,
    CONSTRAINT "EventType_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventType_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_EventType" ("bookingFields", "description", "hidden", "id", "lengthInMinutes", "locations", "scheduleId", "slug", "title", "userId") SELECT "bookingFields", "description", "hidden", "id", "lengthInMinutes", "locations", "scheduleId", "slug", "title", "userId" FROM "EventType";
DROP TABLE "EventType";
ALTER TABLE "new_EventType" RENAME TO "EventType";
CREATE UNIQUE INDEX "EventType_userId_slug_key" ON "EventType"("userId", "slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
