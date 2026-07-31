-- CreateTable
CREATE TABLE "Desk" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "floorId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "xPosition" REAL NOT NULL,
    "yPosition" REAL NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "restricted" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "deskId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "bookingDate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "qrToken" TEXT NOT NULL,
    "checkedInAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Booking_deskId_fkey" FOREIGN KEY ("deskId") REFERENCES "Desk" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
