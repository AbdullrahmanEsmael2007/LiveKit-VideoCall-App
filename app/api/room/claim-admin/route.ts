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
    // List all participants
    const participants = await roomService.listParticipants(room);
    
    // Check if any OTHER participant is admin
    const hasAdmin = participants.some(p => {
      if (p.identity === identity) return false; // Ignore self
      const md = JSON.parse(p.metadata || '{}');
      return md.roles && md.roles.includes('admin');
    });

    if (hasAdmin) {
      return NextResponse.json({ success: false, message: 'Admin already exists' });
    }

    // No admin exists, promote self
    const participant = await roomService.getParticipant(room, identity);
    const metadata = JSON.parse(participant.metadata || '{}');
    
    if (!metadata.roles) metadata.roles = [];
    if (!metadata.roles.includes('admin')) {
      metadata.roles.push('admin');
    }

    await roomService.updateParticipant(room, identity, JSON.stringify(metadata));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to claim admin' }, { status: 500 });
  }
}
