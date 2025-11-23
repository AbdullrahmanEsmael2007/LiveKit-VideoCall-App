import { RoomServiceClient } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { room, identity } = body;

  if (!room || !identity) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const roomService = new RoomServiceClient(wsUrl, apiKey, apiSecret);

  try {
    // Verify requester is admin
    const participant = await roomService.getParticipant(room, identity);
    const metadata = JSON.parse(participant.metadata || '{}');
    
    if (!metadata.roles || !metadata.roles.includes('admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the room (kicks everyone out)
    await roomService.deleteRoom(room);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to end room' }, { status: 500 });
  }
}
