'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function StorageSettings() {
  const { data: session } = useSession();
  const [activeProvider, setActiveProvider] = useState<string | null>(null);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>External Storage</CardTitle>
        <CardDescription>
          Connect your cloud storage to save generated content directly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Google Drive */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center space-x-4">
            {/* <Icons.google className="w-6 h-6" /> */}
            <div>
              <p className="font-medium">Google Drive</p>
              <p className="text-sm text-gray-500">Save files to your Google Drive</p>
            </div>
          </div>
          {session?.user && (session as any).provider === 'google' ? (
            <Button variant="outline" onClick={() => signOut()}>
              Disconnect
            </Button>
          ) : (
            <Button onClick={() => signIn('google')}>Connect</Button>
          )}
        </div>

        {/* Dropbox */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center space-x-4">
            {/* <Icons.dropbox className="w-6 h-6" /> */}
            <div>
              <p className="font-medium">Dropbox</p>
              <p className="text-sm text-gray-500">Save files to your Dropbox</p>
            </div>
          </div>
          {session?.user && (session as any).provider === 'dropbox' ? (
            <Button variant="outline" onClick={() => signOut()}>
              Disconnect
            </Button>
          ) : (
            <Button onClick={() => signIn('dropbox')}>Connect</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
