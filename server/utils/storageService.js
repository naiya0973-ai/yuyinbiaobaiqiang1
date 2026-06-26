const { supabaseAdmin } = require('../config/supabase');

function getAudioBucket() {
  return process.env.SUPABASE_STORAGE_AUDIO_BUCKET || 'audios';
}

function shouldUseSupabaseStorage() {
  return process.env.VERCEL || process.env.USE_SUPABASE_STORAGE === 'true';
}

async function uploadAudio(buffer, filename, contentType) {
  const bucket = getAudioBucket();
  const storagePath = `audio/${filename}`;

  const { error } = await supabaseAdmin.storage.from(bucket).upload(storagePath, buffer, {
    contentType: contentType || 'application/octet-stream',
    upsert: false
  });

  if (error) {
    throw error;
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(storagePath);

  return {
    url: data.publicUrl,
    path: storagePath
  };
}

async function deleteAudio(filename) {
  const bucket = getAudioBucket();
  const storagePath = `audio/${filename}`;

  const { error } = await supabaseAdmin.storage.from(bucket).remove([storagePath]);
  if (error) {
    throw error;
  }
}

module.exports = {
  getAudioBucket,
  shouldUseSupabaseStorage,
  uploadAudio,
  deleteAudio
};
