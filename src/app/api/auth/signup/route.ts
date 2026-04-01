import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { readDb, writeDb } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { signupSchema } from '@/lib/validations/auth.schema';
import { generateId } from '@/lib/utils/id';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { name, email, password } = parsed.data;
    const db = await readDb();
    if (db.users.find((u) => u.email === email)) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }
    const passwordHash = bcrypt.hashSync(password, 10);
    const user = {
      id: generateId(),
      name,
      email,
      passwordHash,
      role: 'manager' as const,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    db.activityLogs.unshift({
      id: generateId(),
      action: 'product_created',
      description: `User "${name}" signed up`,
      userId: user.id,
      createdAt: new Date().toISOString(),
    });
    await writeDb(db);

    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt };
    const token = await signToken(safeUser);
    const response = NextResponse.json({ data: safeUser }, { status: 201 });
    response.cookies.set('token', token, { httpOnly: true, path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 7 });
    return response;
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
