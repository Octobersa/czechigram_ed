import {createStudentSchema, deleteStudentSchema, listStudentSchemas} from '@/app/lib/studentManager';
import {NextRequest, NextResponse} from 'next/server';

const AUTH_TOKEN = process.env.API_STUDENT_MANAGEMENT_TOKEN;
const AUTH_HEADER_NAME = 'X-Auth-Token';

function unauthorizedResponse() {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
}

function checkAuth(req: NextRequest): NextResponse | null {
    if (!AUTH_TOKEN) {
        console.error('API_STUDENT_MANAGEMENT_TOKEN is not set in environment variables.');
        return NextResponse.json({ message: 'Internal Server Error: Auth not configured' }, { status: 500 });
    }
    const token = req.headers.get(AUTH_HEADER_NAME);
    if (token !== AUTH_TOKEN) {
        return unauthorizedResponse();
    }
    return null;
}


export async function GET() {
    try {
        const schemas = await listStudentSchemas();
        return NextResponse.json(schemas);
    } catch (error) {
        console.error('error', error);
        return NextResponse.json({ message: 'Failed to fetch student schemas' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const authError = checkAuth(req);
    if (authError) return authError;
    try {
      const { studentName } = await req.json();
      const existingNames = await listStudentSchemas();
      if (existingNames.includes(studentName)) {
        return NextResponse.json({message:`Schema for student ${studentName} already exists` }, {status: 400})
      }
      await createStudentSchema(studentName);
      return NextResponse.json ({message: `Schema for student ${studentName} went well. And he can use app.`}, {status: 200})
    } catch (error) {
        console.error('Error creating student schema:', error);
        return NextResponse.json(
            { message: 'Failed to create student schema' },
            { status: 500 }
        );
    }

}

export async function DELETE(
    req: NextRequest
) {
    const authError = checkAuth(req);
    if (authError) return authError;
    try {
        const url = new URL(req.url);
        const studentName = url.searchParams.get('studentName');
        if (!studentName) {
            return NextResponse.json({ message: 'Student name is required' }, { status: 400 });
        }
        await deleteStudentSchema(studentName);
        return NextResponse.json(
            { message: `Schema for student ${studentName} deleted successfully` },
            { status: 200 }
        );
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Error deleting student schema:', error.message);
            return NextResponse.json(
                { message: error.message || 'Failed to delete student schema' },
                { status: 500 }
            );
        } else {
            console.error('Error deleting student schema:', error);
            return NextResponse.json(
                { message: 'Failed to delete student schema' },
                { status: 500 }
            );
        }
    }
}
