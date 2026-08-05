-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ParkingSpot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "country" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "building" TEXT NOT NULL DEFAULT '',
    "floor" TEXT NOT NULL DEFAULT '',
    "floorId" TEXT NOT NULL DEFAULT '',
    "xPosition" REAL NOT NULL DEFAULT 0,
    "yPosition" REAL NOT NULL DEFAULT 0
);
INSERT INTO "new_ParkingSpot" ("active", "id", "name", "type", "zone") SELECT "active", "id", "name", "type", "zone" FROM "ParkingSpot";
DROP TABLE "ParkingSpot";
ALTER TABLE "new_ParkingSpot" RENAME TO "ParkingSpot";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
