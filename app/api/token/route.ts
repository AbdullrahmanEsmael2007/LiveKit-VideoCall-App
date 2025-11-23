import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get('room');
  const username = req.nextUrl.searchParams.get('username');

  if (!room) {
    return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400 });
  } else if (!username) {
    return NextResponse.json({ error: 'Missing "username" query parameter' }, { status: 400 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  // Check if room exists and has participants to determine if this user should be admin
  let isAdmin = false;
  try {
    const roomService = new RoomServiceClient(wsUrl, apiKey, apiSecret);
    const participants = await roomService.listParticipants(room);
    
    // If no participants, this is the creator/first user
    if (participants.length === 0) {
      isAdmin = true;
    }
  } catch (error) {
    // If room doesn't exist yet (error), this user is creating it
    isAdmin = true;
  }

  const at = new AccessToken(apiKey, apiSecret, { 
    identity: username,
    metadata: JSON.stringify({ roles: isAdmin ? ['admin'] : [] })
  });
  at.addGrant({ roomJoin: true, room: room });

  return NextResponse.json({ token: await at.toJwt() });
}
