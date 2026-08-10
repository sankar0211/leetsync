const { PrismaClient } = require("@prisma/client");
require("dotenv").config({ path: ".env.local" });

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Setting up storage policies...");
    
    // We try to create policies. We use IF NOT EXISTS or catch errors if they exist.
    // In Postgres, we can check if policy exists.
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access'
          ) THEN
              CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
          END IF;
          
          IF NOT EXISTS (
              SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow Uploads'
          ) THEN
              CREATE POLICY "Allow Uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
          END IF;
          
          IF NOT EXISTS (
              SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow Updates'
          ) THEN
              CREATE POLICY "Allow Updates" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars');
          END IF;
      END
      $$;
    `);
    
    console.log("Storage policies successfully created!");
  } catch (err) {
    console.error("Error creating policies:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
