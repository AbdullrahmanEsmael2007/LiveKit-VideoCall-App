import { RoomServiceClient } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const svc = new RoomServiceClient(wsUrl, apiKey, apiSecret);

  try {
    const rooms = await svc.listRooms();
    // Filter out the 'lobby' room itself if you don't want it in the "Active Rooms" list
    const activeRooms = rooms.filter(r => r.name !== 'lobby');
    return NextResponse.json(activeRooms);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to list rooms' }, { status: 500 });
  }
}
