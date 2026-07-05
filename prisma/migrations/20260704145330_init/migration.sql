-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "availability" TEXT NOT NULL,
    "overrides" TEXT,
    CONSTRAINT "Schedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "lengthInMinutes" INTEGER NOT NULL,
    "locations" TEXT NOT NULL,
    "scheduleId" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "bookingFields" TEXT,
    CONSTRAINT "EventType_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventType_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "duration" INTEGER NOT NULL,
    "eventTypeId" TEXT NOT NULL,
    "attendee" TEXT NOT NULL,
    "guests" TEXT,
    "location" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booking_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "EventType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "EventType_userId_slug_key" ON "EventType"("userId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_uid_key" ON "Booking"("uid");
