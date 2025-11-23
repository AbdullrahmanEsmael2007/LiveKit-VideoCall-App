import { RoomServiceClient } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { room, identity, targetIdentity } = body;

  if (!room || !identity || !targetIdentity) {
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

    // Get target participant
    const targetParticipant = await roomService.getParticipant(room, targetIdentity);
    const targetMetadata = JSON.parse(targetParticipant.metadata || '{}');
    
    // Add admin role
    if (!targetMetadata.roles) targetMetadata.roles = [];
    if (!targetMetadata.roles.includes('admin')) {
      targetMetadata.roles.push('admin');
    }

    // Update participant metadata
    await roomService.updateParticipant(room, targetIdentity, JSON.stringify(targetMetadata));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to promote user' }, { status: 500 });
  }
}
