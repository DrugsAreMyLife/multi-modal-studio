export interface UploadResult {
  url: string;
  path: string;
  id: string;
}

export async function uploadFile(
  file: File,
  folder: string = 'attachments',
): Promise<UploadResult> {
  // 1. Get signed upload URL
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      folder,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get upload URL');
  }

  const { uploadUrl, path } = await response.json();

  // 2. Perform the actual upload
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload file to storage');
  }

  // 3. Construct the public URL (or return the path to get a signed URL later)
  // For this project, we'll assume the 'media' bucket is configured for public access or we use the path.
  // Given we are using signed uploads, we might need a public URL helper if not public.
  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${path}`;

  return {
    url: publicUrl,
    path,
    id: crypto.randomUUID(),
  };
}
