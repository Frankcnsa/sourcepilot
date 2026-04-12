import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const VOLCENGINE_API_KEY = process.env.VOLCENGINE_API_KEY;
const VOLCENGINE_ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3/images/generations';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 检查表是否存在
async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);
    return !error || !error.message.includes('does not exist');
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;
    let userEmail: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        userId = user.id;
        userEmail = user.email || null;
      }
    }

    const body = await req.json();
    const { prompt, attributes } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Please log in to generate' }, { status: 401 });
    }

    // 检查表是否存在
    const usersTableExists = await checkTableExists('users');
    const avatarGenTableExists = await checkTableExists('avatar_generations');

    let freeUsed = false;
    let credits = 0;
    let shouldRecordToDb = false;

    if (usersTableExists) {
      shouldRecordToDb = true;
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('free_avatar_used, credits')
        .eq('id', userId)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.error('Database query error:', userError);
        shouldRecordToDb = false;
      } else if (userData) {
        freeUsed = userData.free_avatar_used || false;
        credits = userData.credits || 0;
      } else {
        // 创建用户记录
        const { error: insertError } = await supabase
          .from('users')
          .insert({ 
            id: userId, 
            email: userEmail,
            credits: 0, 
            free_avatar_used: false 
          });
        
        if (insertError) {
          console.error('Insert user error:', insertError);
          shouldRecordToDb = false;
        }
      }
    }

    if (freeUsed && credits < 1) {
      return NextResponse.json({ error: 'Insufficient credits. Please purchase more.' }, { status: 402 });
    }

    // 调用火山方舟 API
    console.log('Calling Volcengine API with key:', VOLCENGINE_API_KEY?.slice(0, 10) + '...');
    
    const response = await fetch(VOLCENGINE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VOLCENGINE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'doubao-seedream-5.0-lite',
        prompt: prompt,
        size: '1024x1024',
        n: 1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Volcengine API error:', response.status, errorText);
      return NextResponse.json({ error: `Image generation failed: ${response.status} - ${errorText.slice(0, 200)}` }, { status: 500 });
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image generated' }, { status: 500 });
    }

    // 下载图片
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();
    
    // 尝试上传到 Supabase Storage
    let finalImageUrl = imageUrl;
    try {
      const fileName = `avatar-${userId}-${Date.now()}.png`;
      const { data: uploadData } = await supabase
        .storage
        .from('avatars')
        .upload(`generated/${fileName}`, imageBlob, { contentType: 'image/png' });

      if (uploadData) {
        const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(`generated/${fileName}`);
        finalImageUrl = publicUrl.publicUrl;
      }
    } catch (storageError) {
      console.error('Storage upload error:', storageError);
      // 使用原始 URL
      finalImageUrl = imageUrl;
    }

    // 更新用户记录
    if (shouldRecordToDb) {
      try {
        if (!freeUsed) {
          await supabase.from('users').update({ free_avatar_used: true }).eq('id', userId);
        } else {
          await supabase.from('users').update({ credits: Math.max(0, credits - 1) }).eq('id', userId);
        }
      } catch (updateError) {
        console.error('Update user error:', updateError);
      }
    }

    // 记录生成历史
    if (avatarGenTableExists && shouldRecordToDb) {
      try {
        await supabase.from('avatar_generations').insert({
          user_id: userId,
          attributes: attributes,
          prompt: prompt,
          image_url: finalImageUrl,
          used_free: !freeUsed,
          cost_credits: freeUsed ? 1 : 0,
        });
      } catch (historyError) {
        console.error('Insert history error:', historyError);
      }
    }

    return NextResponse.json({
      imageUrl: finalImageUrl,
      freeUsed: !freeUsed,
      remainingCredits: freeUsed ? Math.max(0, credits - 1) : credits,
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
