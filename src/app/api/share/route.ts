import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { createServerClient } from '@/lib/db/client';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { type, content, metadata } = await req.json();
    const slug = uuidv4().slice(0, 8); // Short slug

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('shared_content')
      .insert({
        slug,
        user_id: session.user.id,
        type,
        content, // JSON representing the content (e.g. { url: '...' } or full analysis)
        metadata,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      slug,
      url: `${process.env.NEXTAUTH_URL}/share/${slug}`,
    });
  } catch (error: any) {
    console.error('Sharing error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
