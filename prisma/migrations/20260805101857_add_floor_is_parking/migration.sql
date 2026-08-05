-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Floor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "floorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "isParking" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Floor" ("floorId", "id", "imageUrl", "name") SELECT "floorId", "id", "imageUrl", "name" FROM "Floor";
DROP TABLE "Floor";
ALTER TABLE "new_Floor" RENAME TO "Floor";
CREATE UNIQUE INDEX "Floor_floorId_key" ON "Floor"("floorId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
