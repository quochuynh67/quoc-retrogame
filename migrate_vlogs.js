import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) {
    env[key.trim()] = val.join('=').trim();
  }
});

const SUPABASE_URL = env['VITE_SUPABASE_URL'];
const SUPABASE_KEY = env['VITE_SUPABASE_ANON_KEY'];

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials in .env file.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function extractUploaderName(fileName) {
  try {
    const parts = fileName.split('__');
    if (parts.length >= 3) {
      return decodeURIComponent(parts[0]);
    }
  } catch (e) {}
  return 'Người dùng ẩn danh';
}

function extractUid(fileName) {
  try {
    const parts = fileName.split('__');
    if (parts.length >= 3) {
      return parts[1];
    }
  } catch (e) {}
  return 'guest_' + Math.random().toString(36).substring(2, 9);
}

async function migrate() {
  console.log("🚀 Starting data migration from Storage bucket 'videos' to Database tables...");

  // 1. Fetch all files from the storage bucket
  const listUrl = `${SUPABASE_URL}/storage/v1/object/list/videos`;
  let files = [];
  try {
    const response = await fetch(listUrl, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prefix: '',
        limit: 100,
        offset: 0,
        sortBy: {
          column: 'name',
          order: 'desc'
        }
      })
    });

    if (response.ok) {
      const allFiles = await response.json();
      files = allFiles.filter(file => file.name.includes('.'));
      console.log(`📦 Found ${files.length} video files in storage bucket.`);
    } else {
      console.error('❌ Failed to list storage files:', response.status);
      return;
    }
  } catch (error) {
    console.error('❌ Error fetching storage list:', error);
    return;
  }

  // 2. Loop through and migrate each file
  let successCount = 0;
  let skipCount = 0;

  for (const file of files) {
    const nickname = extractUploaderName(file.name);
    const uploaderId = extractUid(file.name);
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/videos/${encodeURIComponent(file.name)}`;

    console.log(`\n----------------------------------------`);
    console.log(`Processing file: ${file.name}`);
    console.log(`- Nickname parsed: ${nickname}`);
    console.log(`- User ID: ${uploaderId}`);
    console.log(`- Public URL: ${publicUrl}`);

    try {
      // A. Check if the video URL already exists in database
      const { data: existingVideo, error: selectErr } = await supabase
        .from('vlog_videos')
        .select('id')
        .eq('url', publicUrl)
        .maybeSingle();

      if (selectErr) {
        console.error(`⚠️ Error checking existing video:`, selectErr.message);
        continue;
      }

      if (existingVideo) {
        console.log(`⏭️ Video already exists in Database (ID: ${existingVideo.id}). Skipping.`);
        skipCount++;
        continue;
      }

      // B. Upsert the User
      const { error: userError } = await supabase
        .from('vlog_users')
        .upsert([{ id: uploaderId, nickname: nickname }]);

      if (userError) {
        console.error(`⚠️ Failed to upsert user ${nickname}:`, userError.message);
        continue;
      }
      console.log(`✅ User profile verified/created.`);

      // C. Insert the Video row
      const { data: insertedVideo, error: insertErr } = await supabase
        .from('vlog_videos')
        .insert([{
          user_id: uploaderId,
          uploader_name: nickname,
          url: publicUrl,
          title: `Vlog chuyến đi của ${nickname}`,
          description: `Khám phá hành trình cùng với ${nickname}. Video được di chuyển tự động từ Storage bucket.`,
          is_system: false,
          likes: Math.floor(Math.random() * 400) + 120,
          views: Math.floor(Math.random() * 1500) + 400
        }])
        .select();

      if (insertErr) {
        console.error(`❌ Failed to insert video row:`, insertErr.message);
      } else {
        console.log(`🎉 Successfully inserted video to DB! (ID: ${insertedVideo[0].id})`);
        successCount++;
      }

    } catch (err) {
      console.error(`❌ Unexpected error processing ${file.name}:`, err);
    }
  }

  console.log(`\n========================================`);
  console.log(`✨ Migration finished!`);
  console.log(`- Successfully migrated: ${successCount}`);
  console.log(`- Already existed (skipped): ${skipCount}`);
  console.log(`========================================`);
}

migrate();
