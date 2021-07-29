-- CreateTable
CREATE TABLE "GraphQLQuery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "apiUrl" TEXT NOT NULL,
    "field" TEXT NOT NULL
);
