-- Least privilege: a User row created without an explicit role is a VIEWER.
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'VIEWER';
