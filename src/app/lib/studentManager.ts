import mysql from 'mysql2/promise';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { deleteImagesFromMinio } from '@/app/lib/minio';
import { disconnectPrismaForStudent, getPrismaForStudent } from '@/app/lib/prisma';

const dbUrl = process.env.DATABASE_URL || ''

export async function createStudentSchema(studentName: string) {
  const schemaName = `student_${studentName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  
  const connection = await mysql.createConnection(dbUrl);
  
  try {
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${schemaName}`);
    
    const prismaSchemaTemplate = fs.readFileSync(
      path.join(process.cwd(), 'prisma', 'schema.prisma'),
      'utf8'
    );
    
    const prismaSchema = prismaSchemaTemplate.replace(
      'env("DATABASE_URL")',
      `"${dbUrl}/${schemaName}"`
    );
    
    const tempSchemaPath = path.join(process.cwd(), 'prisma', `schema-${schemaName}.prisma`);
    fs.writeFileSync(tempSchemaPath, prismaSchema);
    

    execSync(`npx prisma migrate deploy --schema=${tempSchemaPath}`);
    
    execSync(`npx prisma db seed`, {
      env: {
        ...process.env,
        DATABASE_URL: `${dbUrl}/${schemaName}`
      }
    });

    fs.unlinkSync(tempSchemaPath);
    
    console.log(`Schema ${schemaName} created and seeded successfully`);
    return schemaName;
  } catch (error) {
    console.error('Error creating student schema:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

export async function deleteStudentSchema(studentName: string) {
  const schemaName = `student_${studentName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  const connection = await mysql.createConnection(dbUrl);
  let shouldDisconnectStudentClient = false;

  try {
    // Check if schema exists first
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(`
      SELECT SCHEMA_NAME
      FROM INFORMATION_SCHEMA.SCHEMATA
      WHERE SCHEMA_NAME = ?
    `, [schemaName]);

    if (rows.length === 0) {
      throw new Error(`Schema ${schemaName} does not exist`);
    }

    const prisma = await getPrismaForStudent(schemaName);
    shouldDisconnectStudentClient = true;

    const photos = await prisma.photo.findMany({
      select: {
        imageUrl: true,
      },
    });
    const imageUrls = photos
      .map((photo) => photo.imageUrl)
      .filter((imageUrl): imageUrl is string => Boolean(imageUrl));

    await disconnectPrismaForStudent(schemaName);
    shouldDisconnectStudentClient = false;

    // Drop the database
    await connection.execute(`DROP DATABASE ${schemaName}`);

    const hasImagesToClean = imageUrls.length > 0;
    if (hasImagesToClean) {
      void deleteImagesFromMinio(imageUrls)
        .then((cleanupSummary) => {
          console.log(
            `Async MinIO cleanup for ${schemaName} finished. Deleted ${cleanupSummary.deleted} objects and skipped ${cleanupSummary.skipped} non-MinIO URLs.`
          );
        })
        .catch((cleanupError) => {
          console.error(`Async MinIO cleanup for ${schemaName} failed.`, cleanupError);
        });
    }

    const cleanupStatus = hasImagesToClean
      ? "MinIO cleanup started asynchronously."
      : "No image references found for MinIO cleanup.";

    console.log(`Schema ${schemaName} deleted successfully. ${cleanupStatus}`);
    return true;
  } catch (error) {
    console.error('Error deleting student schema:', error);
    throw error;
  } finally {
    if (shouldDisconnectStudentClient) {
      try {
        await disconnectPrismaForStudent(schemaName);
      } catch (disconnectError) {
        console.error(`Error disconnecting Prisma client for ${schemaName}:`, disconnectError);
      }
    }
    await connection.end();
  }
}

export async function listStudentSchemas() {
  console.log(dbUrl)
  const connection = await mysql.createConnection(dbUrl);
  
  try {
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(`
      SELECT SCHEMA_NAME 
      FROM INFORMATION_SCHEMA.SCHEMATA 
      WHERE SCHEMA_NAME LIKE 'student_%'
    `);
    
    return (rows as mysql.RowDataPacket[]).map(row => row.SCHEMA_NAME.replace('student_', ''));
  } finally {
    await connection.end();
  }
}
